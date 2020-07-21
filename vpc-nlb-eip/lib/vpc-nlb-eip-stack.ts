import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import { AutoScalingGroup } from "@aws-cdk/aws-autoscaling";
import { ManagedPolicy } from "@aws-cdk/aws-iam";
import {
  NetworkTargetGroup,
  Protocol,
  TargetType,
  CfnListener,
} from "@aws-cdk/aws-elasticloadbalancingv2";
import { NetworkLoadBalancerStatic } from "./cdk-nlb-static";

export class VpcNlbEipStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a new VPC with only public subnets
    const vpc = new ec2.Vpc(this, "VPC", {
      cidr: "10.0.0.0/16",
      maxAzs: 3,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: "Public Access",
        },
      ],
    });

    // Create a network load balancer with an elastic IP address in
    // each availability zone.
    const nlb = new NetworkLoadBalancerStatic(this, "NLB", {
      name: "MyStaticNLB",
      vpc: vpc,
    });
    const tg = new NetworkTargetGroup(this, "TargetGroup", {
      port: 80,
      protocol: Protocol.TCP,
      targetType: TargetType.INSTANCE,
      vpc: vpc,
    });

    const listener = new CfnListener(this, "WEBTRAFFIC", {
      loadBalancerArn: nlb.arn,
      port: 80,
      protocol: "TCP",
      defaultActions: [{ type: "forward", targetGroupArn: tg.targetGroupArn }],
    });

    // Make the EIP addresses available CloudFormation outputs
    let i = 1;
    for (let eip of nlb.eipArray) {
      new cdk.CfnOutput(this, `NLB_${i}`, {
        description: `Elastic IP Address ${i++}`,
        value: eip.ref,
      });
    }

    /**
     * Below is an example to create an NLB listener -> target group -> ASG -> Instances
     */

    // UserData for the ASG launch config. will be executed once per-instance startup
    let commands = `#!/bin/bash -xe
yum update && yum upgrade -y
yum install httpd -y
systemctl start httpd
`;
    let userData = ec2.UserData.custom(commands);

    // Create a security group for inbound traffic
    // Since the NLB will present the original IP address, set inbound to
    // proper ipv4/v6 scopes.
    const sg = new ec2.SecurityGroup(this, "Instance SG", {
      description: "All Load balancer to instance",
      vpc: vpc,
    });
    sg.addIngressRule(
      ec2.Peer.ipv4("0.0.0.0/0"),
      ec2.Port.tcp(80),
      "HTTP incoming"
    );

    // Create the ASG with t3.medium instances, AL2, and honor the NLB's 
    // target group health checks along with normal ec2 health checks.
    const asg = new AutoScalingGroup(this, "AutoscalingGroup", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MEDIUM
      ),
      vpc: vpc,
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      desiredCapacity: 2,
      healthCheck: {
          type: "ELB",
          gracePeriod: cdk.Duration.seconds(30)
      },
      userData: userData,
      securityGroup: sg,
    });
    // Enable the automatic management via Systems Manager
    // by adding the policy to the instance role. Add other
    // AWS services these instances should monitor.
    asg.role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    // Finally register the TargetGroup in the autoscaling group
    tg.addTarget(asg);
  }
}
