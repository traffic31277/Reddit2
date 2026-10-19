import { type Schema } from '../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { EventBridgeHandler } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from "$amplify/env/weekly-reset";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const userClient = generateClient<Schema>();

const pseudonymClient = DynamoDBDocumentClient.from( new DynamoDBClient({}));

const tableName = "PseudonymPool";

let uniqueCheck = false;

async function generatePseudonym() {
  const adjectiveKey = `ADJECTIVE${Math.floor(Math.random() * 500)}`;
  const animalKey = `ANIMAL${Math.floor(Math.random() * 100)}`;

  const adjective = await pseudonymClient.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        id: adjectiveKey
      },
    })
  );

  const animal = await pseudonymClient.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        id: animalKey
      },
    })
  );

  const adjectiveWord = adjective.Item?.word;
  const animalWord = animal.Item?.word;
  if (typeof adjectiveWord !== "string" || typeof animalWord !== "string") {
    throw new Error(`PseudonymPool is missing ${!adjectiveWord ? adjectiveKey : animalKey}`);
  }

  return adjectiveWord + animalWord;
};




export const handler: EventBridgeHandler<"Scheduled Event", null, void> = async () => {
  console.log("Begin Weekly Reset");
  // const pseudonym = await generatePseudonym();
  // console.log("Generated pseudonym:", pseudonym);
  const { data: users, errors }  = await userClient.models.User.list();

  for (const user of users) {
    const { data: deletedPseudonym, errors } = await userClient.models.UsedPseudonyms.delete({ id: user.pseudonym });
    console.error("Deleted Pseudonym" + deletedPseudonym?.id);

    uniqueCheck = false;

    while (!uniqueCheck) {
      const pseudonym = await generatePseudonym();
      const { data: result, errors } = await userClient.models.UsedPseudonyms.get({ id: pseudonym });

      console.log("Check result" + result?.id);

      if (result == null) {
        await userClient.models.UsedPseudonyms.create({
          id: pseudonym,
        });

        await userClient.models.User.update({
          id: user.id,
          pseudonym: pseudonym
        });

        console.log("Chosen Pseudonym" + pseudonym);

        uniqueCheck = true;
      }
    }

    console.log("Weekly Reset Complete");
  }
}

