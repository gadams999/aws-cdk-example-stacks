import * as cdk from "@aws-cdk/core"
import * as ec2 from "@aws-cdk/aws-ec2"
import { AutoScalingGroup, HealthCheck } from "@aws-cdk/aws-autoscaling"
import { ManagedPolicy } from "@aws-cdk/aws-iam"
import {
    NetworkTargetGroup,
    Protocol,
    TargetType,
    INetworkLoadBalancerTarget,
    CfnListener,
} from "@aws-cdk/aws-elasticloadbalancingv2"
import { NetworkLoadBalancerStatic } from "./cdk-nlb-static"
import { type } from "os"
// import { AmazonLinuxImage } from "@aws-cdk/aws-ec2"

export class VpcNlbEipStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

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
        })

        // Create a network load balancer with an elastic IP address in
        // each availability zone.
        const nlb = new NetworkLoadBalancerStatic(this, "NLB", {
            name: "MyStaticNLB",
            vpc: vpc,
        })
        const tg = new NetworkTargetGroup(this, "TargetGroup", {
            port: 80,
            protocol: Protocol.TCP,
            targetType: TargetType.INSTANCE,
            vpc: vpc,
        })

        const listener = new CfnListener(this, "WEBTRAFFIC", {
            loadBalancerArn: nlb.arn,
            port: 80,
            protocol: "TCP",
            defaultActions: [{ type: "forward" }],
        })
        tg.registerListener(listener.arn)

        // Make the EIP addresses available CloudFormation outputs
        let i = 1
        for (let eip of nlb.eipArray) {
            new cdk.CfnOutput(this, `NLB_${i}`, {
                description: `Elastic IP Address ${i++}`,
                value: eip.ref,
            })
        }

        // Add a listener to the NLB

        /**
         * Below is an example to create an NLB listener -> target group -> ASG -> Instances
         */

        // ASG with launch config
        let commands = `#!/bin/bash -xe
        yum update && yum upgrade -y
        foo bar
        `
        let userData = ec2.UserData.custom(commands)

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
            userData: userData,
        })
        // Enable for management from Systems Manager
        asg.role.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName(
                "AmazonSSMManagedInstanceCore"
            )
        )
        tg.addTarget(asg)
        // add listener for udp
        // target profile
        // autoscaling 1-n
    }
}
