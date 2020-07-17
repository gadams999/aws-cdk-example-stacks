import * as cdk from "@aws-cdk/core"
import * as ec2 from "@aws-cdk/aws-ec2"
import { AutoScalingGroup, HealthCheck } from "@aws-cdk/aws-autoscaling"
//import { NetworkLoadBalancer } from "@aws-cdk/aws-elasticloadbalancingv2"
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

        // Make the EIP addresses available CloudFormation outputs
        let i = 1
        for (let eip of nlb.eipArray) {
            new cdk.CfnOutput(this, `NLB_${i}`, {
                description: `Elastic IP Address ${i++}`,
                value: eip.ref,
            })
        }

        /**
         * Below is an example to create an NLB listener -> target group -> ASG -> Instances
         */

        // ASG with launch config
        let userData: string = `
        hello there
        mon frere
        `

        const asg = new AutoScalingGroup(this, "AutoscalingGroup", {
            instanceType: new ec2.InstanceType("t3.meduim"),
            vpc: vpc,
            machineImage: new ec2.AmazonLinuxImage({
                generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            }),
            desiredCapacity: 2,
        })
        asg.addUserData(userData)

        // launch config
        // create an ASG
        // create target group
        // add listener for udp
        // target profile
        // autoscaling 1-n
    }
}
