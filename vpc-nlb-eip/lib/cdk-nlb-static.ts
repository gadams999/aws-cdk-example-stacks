import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import {
  CfnLoadBalancer,
  CfnListener,
  NetworkListenerProps,
} from "@aws-cdk/aws-elasticloadbalancingv2";

/**
 * Creates a public facing network load balancer with elastic ip addresses
 * for each availability zone
 */

export interface NetworkLoadBalancerStaticProps {
  /**
   * The name of the NLB
   */
  readonly name: string;

  /**
   * VPC to get the AZs, generate EIPs for each
   */

  readonly vpc: ec2.Vpc;
}

export interface ListenerProps {
  /**
   * Create listener for UDP, TCP, etc. and port
   */
  readonly props: NetworkListenerProps;
}

export class NetworkLoadBalancerStatic extends cdk.Construct {
  eipArray: ec2.CfnEIP[] = [];
  nlb: CfnLoadBalancer;
  arn: string;
  listeners: CfnListener[] = [];
  constructor(
    scope: cdk.Construct,
    id: string,
    props: NetworkLoadBalancerStaticProps
  ) {
    super(scope, id);

    // Property validation
    if (
      !RegExp("^[^-][da-zA-Z()-]+[^-]$").test(props.name) ||
      props.name.length > 32
    ) {
      throw new Error(
        "'NetworkLoadBalancerStatic' must only contain alphanumeric characters and hyphen, must not start or end with a hyphen, and be less than 32 characters in length"
      );
    }

    // For all subnets in the VPC, allocate an EIP as part
    // of the subnet mapping
    let subnetMappings = [];
    let workingEip;
    // Create eipArray first and add to array
    for (let i = 0; i < props.vpc.publicSubnets.length; i++) {
      workingEip = new ec2.CfnEIP(this, `EIP_${i + 1}`, {
        domain: "vpc",
      });
      this.eipArray.push(workingEip);
      subnetMappings[i] = {
        subnetId: props.vpc.publicSubnets[i].subnetId,
        allocationId: workingEip.attrAllocationId,
      };
    }

    // Create the load balancer
    this.nlb = new CfnLoadBalancer(this, "NLB", {
      name: props.name,
      type: "network",
      scheme: "internet-facing",
      subnetMappings: subnetMappings,
    });
    this.arn = this.nlb.ref;

    /**
     * In order to have a clean stack deletion, there will need to be a custom resource
     * to disassociate the EIP's from the NLB.
     * 
     * TODO: create the custom resource.
     */  
  }
}
