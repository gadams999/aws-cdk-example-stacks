import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import { CfnLoadBalancer } from "@aws-cdk/aws-elasticloadbalancingv2";
import { CfnResource } from "@aws-cdk/core";

/**
 * Creates a public facing network load balancer with elastic ip addresses
 * for each availability zone
 */

export interface NetworkLoadBalancerStaticProps {
  /**
   * The subnets for creating mapping
   */
  readonly name: string;
  readonly vpc: ec2.Vpc;
}

export interface ListenerProps {
  /**
   * Create listener for UDP, TCP, etc. and port
   */
  readonly name: string;
  readonly protocol: string;
  readonly port: number;
  }

export class NetworkLoadBalancerStatic extends cdk.Construct {
  eipArray: ec2.CfnEIP[] = [];
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
    const nlb = new CfnLoadBalancer(this, "NLB", {
      name: props.name,
      type: "network",
      scheme: "internet-facing",
      subnetMappings: subnetMappings,
    });

    // these may be removed once the determination how to do disaccociations of eipArray to the NLB
    // nlb.addDependsOn(eipArray[0])
    // nlb.addDependsOn(eipArray[1])
    // const igw = props.vpc.node.findChild('IGW') as ec2.CfnInternetGateway
    // const vpcResource = props.vpc.node.findChild('Resource') as CfnResource
    // // Add dependencies to detach eipArray
    // for (let i = 0; i < eipArray.length; i++) {
    //     eipArray[i].addDependsOn(vpcResource)
    // }
  }
  public addListener(scope: cdk.Construct, id: string, props: ListenerProps) {

  }
}
