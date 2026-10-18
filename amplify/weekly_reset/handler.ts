import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { type Schema } from "../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { EventBridgeHandler } from "aws-lambda";

// const client = generateClient<Schema>();

export const handler: EventBridgeHandler<"Scheduled Event", null, void> = async (event) => {
  console.log("Scheduled Function Works");
  console.log("event", JSON.stringify(event, null, 2));
 
}

