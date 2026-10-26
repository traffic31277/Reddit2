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

// Access External Tables
const stack = backend.createStack("ExternalResources");
const pseudonymPool = dynamodb.Table.fromTableName(
  stack,
  "ExternalPseudonymPoolTable",
  "PseudonymPool"
);

const usedPseudonyms = dynamodb.Table.fromTableName(
  stack,
  "ExternalUsedPseudonymsTable",
  "UsedPseudonyms"
);

const suggestions = dynamodb.Table.fromTableName(
  stack,
  "ExternalSuggestionsTable",
  "Suggestions"
)

// Grant the weeklyReset function read access to the external table
pseudonymPool.grantReadData(
  backend.weeklyReset.resources.lambda
);

usedPseudonyms.grantReadWriteData(
  backend.weeklyReset.resources.lambda
);

backend.data.addDynamoDbDataSource(
  "ExternalSuggestionsTableDataSource",
  suggestions
)