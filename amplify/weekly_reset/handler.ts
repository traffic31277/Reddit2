/*
Code reviewed by lily 11/2/26
*/

import { type Schema } from '../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { EventBridgeHandler } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from "$amplify/env/weekly-reset";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

// Boilerplate needed to access the AssignPseudonym lambda through the data client
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const schemaClient = generateClient<Schema>();

// Table Names as Strings
const USED_PSEUDONYMS_TABLE_NAME = "UsedPseudonyms";
const USERS_TABLE_NAME = "Users";
const SUGGESTIONS_TABLE_NAME = "Suggestions"
const TOP_SUGGESTIONS_TABLE_NAME = "TopSuggestions";

// Boilerplate needed to access the PseudonymPool Table
// const externalClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-2" }));

const client = new DynamoDBClient(
  {
    region: "us-east-2",
    credentials: fromCognitoIdentityPool({
      identityPoolId: 'us-east-2:12e12612-5d7f-4e29-b566-432accd9bcca',
  }),
});
const externalClient = DynamoDBDocumentClient.from(client);


// Weekly Reset Handler. This will run once every week.
export const handler: EventBridgeHandler<"Scheduled Event", null, void> = async () => {
  console.log("Begin Weekly Reset");

  // Loop through every user in the User Table with ScanCommand
  let lastKey;
  try {
    do {
      let page = await externalClient.send(new ScanCommand({
        TableName: USERS_TABLE_NAME,
        ExclusiveStartKey: lastKey,
      }));
      for (const user of page.Items ?? []) {

        // Delete the pseudonym of this user from the UsedPseudonyms table so it can be assigned again.
        const response = await externalClient.send(
          new DeleteCommand({
            TableName: USED_PSEUDONYMS_TABLE_NAME,
            Key: {
              id: user.pseudonym
            }
          })
        );

        // Assign a new pseudonym to this user
        const { data, errors } = await schemaClient.queries.assignPseudonym({
          userId: user.userId,
        });

        // Reset the hasSuggestion flag for this user to false, allowing them to submit another suggestion
        await externalClient.send(
          new UpdateCommand({
            TableName: "Users",
            Key: {
              userId: user.userId
            },
            UpdateExpression: "SET #hasSuggestion = :hasSuggestion",
            ExpressionAttributeNames: { "#hasSuggestion": "hasSuggestion" },
            ExpressionAttributeValues: { ":hasSuggestion": false }
          })
        );

        console.log(`Assigned Pseudonym ${data} to User ${user.userId}`);
      }

      lastKey = page.LastEvaluatedKey;
    } while (lastKey && Object.keys(lastKey).length > 0);
  }
  catch (error) {
    console.error("Error During Weekly Reset: ", error);
  }

  /* Find the top suggestion from this week. */
  // Find the cutoff date for the start of this week
  let date = new Date()
  date.setDate(date.getDate() - 7)
  const lastResetDate = `SUGGESTION_${date.toISOString()}`

  console.log(`Start Date of this week: ${lastResetDate}`);

  // Scan with a filter to collect each user's suggestion from this week
  const suggestions = [];
  let suggestionLastKey;
  do {
    const page = await externalClient.send(new ScanCommand({
      TableName: SUGGESTIONS_TABLE_NAME,
      FilterExpression: "#suggestionId > :threshold", // Only include suggestions that are later than the reset date
      ExpressionAttributeNames: {
        "#suggestionId": "suggestionId",
      },
      ExpressionAttributeValues: {
        ":threshold": lastResetDate,
      },
      ExclusiveStartKey: suggestionLastKey,
    }));

    suggestions.push(...(page.Items ?? []));
    suggestionLastKey = page.LastEvaluatedKey;
  } while (suggestionLastKey);

  // console.log(suggestions);

  // Find the top suggestion by like count
  let topSuggestion = null
  let topLikesCount = -9999999

  for (const item of suggestions) {
    if (topLikesCount < item.likes) {
      topLikesCount = item.likes;
      topSuggestion = item;
    }
  }

  console.log("Top Suggestion:");
  console.log(topSuggestion);

  // Add the top suggestion from this week to the TopSuggestion table
  if (topSuggestion != null) {
    await externalClient.send(
      new PutCommand({
        TableName: TOP_SUGGESTIONS_TABLE_NAME,
        Item: {
          suggestionId: topSuggestion.suggestionId,
          pseudonym: topSuggestion.pseudonym,
          text: topSuggestion.text,
          likes: topSuggestion.likes,
          comments: topSuggestion.comments
        }
      })
    )
  }
  console.log("Top Suggestion has been added to the archive.");
  
  console.log("Weekly Reset Complete");
}

