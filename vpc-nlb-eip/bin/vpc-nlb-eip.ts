#!/usr/bin/env node
import "source-map-support/register"
import * as cdk from "@aws-cdk/core"
import { VpcNlbEipStack } from "../lib/vpc-nlb-eip-stack"

const app = new cdk.App()
new VpcNlbEipStack(app, "VpcNlbEipStack", {
    env: {
        region: "us-west-2",
    },
})
