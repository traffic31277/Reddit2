import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { weeklyReset } from './weekly_reset/resource'
import { assignPseudonym } from "./assign_pseudonym/resource";

const backend = defineBackend({
  auth,
  data,
  assignPseudonym,
  weeklyReset
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

const users = dynamodb.Table.fromTableName(
  stack,
  "ExternalUsersTable",
  "Users"
);

const suggestions = dynamodb.Table.fromTableName(
  stack,
  "ExternalSuggestionsTable",
  "Suggestions"
)

const topSuggestions = dynamodb.Table.fromTableName(
  stack,
  "ExternalTopSuggestionsTable",
  "TopSuggestions"
)

const comments = new dynamodb.Table(
  stack,
  "CommentsTable",
  {
    tableName: "Comments",
    partitionKey: {
      name: "suggestionId",
      type: dynamodb.AttributeType.STRING,
    },
    sortKey: {
      name: "commentId",
      type: dynamodb.AttributeType.STRING,
    },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  }
);

// Store one vote per signed-in user for each suggestion.
// These votes are separate from the Comments table.
const suggestionVotes = new dynamodb.Table(
  stack,
  "SuggestionVotesTable",
  {
    tableName: "SuggestionVotes",
    partitionKey: {
      name: "suggestionId",
      type: dynamodb.AttributeType.STRING,
    },
    sortKey: {
      name: "userId",
      type: dynamodb.AttributeType.STRING,
    },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  }
);

// Reference the Lambda functions
const weeklyResetLambda = backend.weeklyReset.resources.lambda;
const assignPseudonymLambda = backend.assignPseudonym.resources.lambda;

// Grant the weeklyReset function read access to the external table
pseudonymPool.grantReadData(
  weeklyResetLambda
);

pseudonymPool.grantReadData(
  assignPseudonymLambda
);

usedPseudonyms.grantReadWriteData(
  weeklyResetLambda
);

usedPseudonyms.grantReadWriteData(
  assignPseudonymLambda
);

users.grantReadWriteData(
  weeklyResetLambda
);

users.grantReadWriteData(
  assignPseudonymLambda
);


topSuggestions.grantReadWriteData(
  weeklyResetLambda
);

const authenticatedUserRole = backend.auth.resources.authenticatedUserIamRole;

comments.grantReadWriteData(
  authenticatedUserRole
);

users.grantReadData(
  authenticatedUserRole
);

suggestions.grantReadWriteData(
  authenticatedUserRole
);

suggestionVotes.grantReadWriteData(
  authenticatedUserRole
);