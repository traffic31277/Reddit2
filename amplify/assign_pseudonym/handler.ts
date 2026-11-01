import type { Handler } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// Table Names as Strings
const PSEUDONYM_POOL_TABLE_NAME = "PseudonymPool";
const USED_PSEUDONYMS_TABLE_NAME = "UsedPseudonyms";
const USERS_TABLE_NAME = "Users";

// Boilerplate needed to access the PseudonymPool Table
const externalClient = DynamoDBDocumentClient.from( new DynamoDBClient({  region:"us-east-2"  }));

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

export const handler: Handler = async (event, context) => {
  console.log("Assigning a new Pseudonym");
  const { userId } = event.arguments

  let uniqueCheck = false;
  let pseudonym: string;
  do {
    pseudonym = await generatePseudonym();

    const response = await externalClient.send(
      new GetCommand({
        TableName: USED_PSEUDONYMS_TABLE_NAME,
        Key: {
          id: pseudonym, // Partition Key
        }
      })
    );

    if (!response.Item) {
      uniqueCheck = true;
    }
  }
  while (!uniqueCheck);

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
  await externalClient.send(
    new UpdateCommand({
      TableName: USERS_TABLE_NAME,
      Key: {
        userId: userId
      },
      UpdateExpression: "SET #pseudonym = :pseudonym",
      ExpressionAttributeNames: { "#pseudonym": "pseudonym" },
      ExpressionAttributeValues: { ":pseudonym": pseudonym } 
    })
  );
  console.log("Chosen Pseudonym: " + pseudonym);

  return pseudonym;
};