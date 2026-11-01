import { type Schema } from '../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { EventBridgeHandler } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from "$amplify/env/weekly-reset";

// Boilerplate needed to access the AssignPseudonym lambda through the data client
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const schemaClient = generateClient<Schema>();

// Table Names as Strings
const USED_PSEUDONYMS_TABLE_NAME = "UsedPseudonyms";
const USERS_TABLE_NAME = "Users";

// Boilerplate needed to access the PseudonymPool Table
const externalClient = DynamoDBDocumentClient.from( new DynamoDBClient({ region:"us-east-2" }));



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

        console.log(`Assigned Pseudonym ${data} to User ${user.userId}`);
      }

      lastKey = page.LastEvaluatedKey;
    } while (lastKey && Object.keys(lastKey).length > 0);
  }
  catch (error) {
    console.error("Error During Pseudonym Reset: ", error);
  }

  console.log("Weekly Reset Complete");
}

