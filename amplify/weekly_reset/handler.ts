import { type Schema } from '../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { EventBridgeHandler } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from "$amplify/env/weekly-reset";

// Table Names as Strings
const PSEUDONYM_POOL_TABLE_NAME = "PseudonymPool";
const USED_PSEUDONYMS_TABLE_NAME = "UsedPseudonyms";

// Boilerplate needed to access the User Table
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const userClient = generateClient<Schema>();

// Boilerplate needed to access the PseudonymPool Table
const externalClient = DynamoDBDocumentClient.from( new DynamoDBClient({}));

// Generate a new random Pseudonym from the pool of words.
async function generatePseudonym() {

  // Generate a random partition key for an adjective and an animal word.
  const adjectiveKey = `ADJECTIVE${Math.floor(Math.random() * 500)}`;
  const animalKey = `ANIMAL${Math.floor(Math.random() * 100)}`;

  // Retrieve the adjective item from the PseudonymPool table with the random key.
  const adjective = await externalClient.send(
    new GetCommand({
      TableName: PSEUDONYM_POOL_TABLE_NAME,
      Key: {
        id: adjectiveKey
      },
    })
  );

  // Retrieve the animal item from the PseudonymPool table with the random key.
  const animal = await externalClient.send(
    new GetCommand({
      TableName: PSEUDONYM_POOL_TABLE_NAME,
      Key: {
        id: animalKey
      },
    })
  );

  // Extract the string from the items from the PseudonymPool table.
  const adjectiveWord = adjective.Item?.word;
  const animalWord = animal.Item?.word;

  // Error Check
  if (typeof adjectiveWord !== "string" || typeof animalWord !== "string") {
    throw new Error(`PseudonymPool is missing ${!adjectiveWord ? adjectiveKey : animalKey}`);
  }

  // Return the new Pseudonym.
  return adjectiveWord + animalWord;
};


// Weekly Reset Handler. This will run once every week.
export const handler: EventBridgeHandler<"Scheduled Event", null, void> = async () => {
  console.log("Begin Weekly Reset");

  // Recieve every user item in the User table as a list
  // THIS LIST ONLY RETURNS THE FIRST 100 ITEMS. ADD SUPPORT FOR PAGINATING LATER.
  const { data: users, errors }  = await userClient.models.User.list();

  // Check for whether or not the generated pseudonym is unique.
  let uniqueCheck = false;

  // Loop through every user item to replace their pseudonyms.
  for (const user of users) {

    // Delete the pseudonym of this user from the UsedPseudonyms table so it can be assigned again.
    const response = await externalClient.send(
      new DeleteCommand({
        TableName: USED_PSEUDONYMS_TABLE_NAME,
        Key: {
          id: user.pseudonym
        }
      })
    );
    // console.log("Deleted Pseudonym" + deletedPseudonym?.id);

    uniqueCheck = false;

    // Loop until a unique Pseudonym is assigned.
    while (!uniqueCheck) {

      // Generate Pseudonym
      const pseudonym = await generatePseudonym();

      // Check if the generated Pseudonym is currently being used 
      // by attempting to access an item from the UsedPseudonym table.
      const response = await externalClient.send(
        new GetCommand({
          TableName: USED_PSEUDONYMS_TABLE_NAME,
          Key: {
            id: pseudonym, // Partition Key
          }
        })
      );
      console.log("Check result" + response?.Item?.id);

      // If the item access from the UsedPseudonym table fails (aka is null), the
      // pseudonym is currently unused and can thus be assigned.
      if (!response.Item) {

        // Add the new pseudonym to the UsedPseudonym table so that it cannot be used again this week.
        await externalClient.send(
          new PutCommand({
            TableName: USED_PSEUDONYMS_TABLE_NAME,
            Item: {
              id: pseudonym, // Partition Key
            }
          })
        );

        // Update this user's pseudonym field with the new pseudonym.
        await userClient.models.User.update({
          id: user.id,
          pseudonym: pseudonym
        });

        console.log("Chosen Pseudonym" + pseudonym);

        // Set this to true to exit the loop.
        uniqueCheck = true;
      }
    }
  }
  console.log("Weekly Reset Complete");
}

