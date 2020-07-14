import * as cdk from "@aws-cdk/core"
import * as ec2 from "@aws-cdk/aws-ec2"
import { CfnLoadBalancer } from "@aws-cdk/aws-elasticloadbalancingv2"

/**
 * Creates a public facing network load balancer with elastic ip addresses
 * for each availability zone
 */

export interface NetworkLoadBalancerStaticProps {
    /**
     * The subnets for creating mapping
     */
    readonly subnetList: [ec2.ISubnet]
}

export class NetworkLoadBalancerStatic extends cdk.Construct {
    constructor(
        scope: cdk.Construct,
        id: string,
        props: NetworkLoadBalancerStaticProps
    ) {
        super(scope, id)

        // subnet
        let subnets = []
        for (let i = 0; i < props.subnetList.length; i++) {
            subnets.push(props.subnetList[i])
        }

        const nlb = new CfnLoadBalancer(this, "NLB", {
            name: id,
            type: "network",
            subnetMappings: subnets,
        })
    }
}
