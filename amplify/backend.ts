import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { weeklyReset } from './weekly_reset/resource'

const backend = defineBackend({
  auth,
  data,
  weeklyReset,
});

const stack = backend.createStack("ExternalResources");

const pseudonymPool = dynamodb.Table.fromTableName(
  stack,
  "PseudonymPool",
  "PseudonymPool"
);

pseudonymPool.grantReadData(
  backend.weeklyReset.resources.lambda
);