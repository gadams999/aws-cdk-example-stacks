import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
// import { NetworkLoadBalancer } from "@aws-cdk/aws-elasticloadbalancingv2"
import { NetworkLoadBalancerStatic } from "./cdk-nlb-static";

export class VpcNlbEipStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a new VPC with public subnets
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

    // Make the EIP addresses available CloudFormation outputs
    for (let i = 0; i < nlb.eipArray.length; i++) {
      new cdk.CfnOutput(this, `EIP${i + 1}`, {
        description: `Elastic IP Address ${i + 1}`,
        value: nlb.eipArray[i].ref,
      });
    }

    /**
     * Below is an example to create an NLB listener -> target group -> ASG -> Instances
     */

    // launch config
    // create an ASG
    // create target group
    // add listener for udp
    // target profile
    // autoscaling 1-n
  }
}
