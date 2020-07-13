import * as cdk from "@aws-cdk/core"
import * as ec2 from "@aws-cdk/aws-ec2"
import { NetworkLoadBalancer } from "@aws-cdk/aws-elasticloadbalancingv2"

export class VpcNlbEipStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        // Create VPC with public AZs
        // create NLB across AZs
        // Add EIPs per AZ
        // add listener for udp
        // launch config
        // target profile
        // autoscaling 1-n

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

        // NLB
        const nlb = new NetworkLoadBalancer(this, "NLB", {
            vpc: vpc,
            loadBalancerName: "NLB",
            crossZoneEnabled: true,
            deletionProtection: false,
            internetFacing: true,
        })

        // Create the EIPs for the NLB
        for (let i = 0; i < vpc.availabilityZones.length; i++) {
          nlb.node
        }
          console.log("AZs:", vpc.availabilityZones.length)
        }
    }
}
