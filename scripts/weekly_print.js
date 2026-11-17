/*
* This is the script ran by the raspberry pi to print to the receipt printer.
* This is set to run weekly via Crontab, synced exactly with the weekly reset on Mondays at Midnight
* This script is never called by the app, it is simply here for documentation purposes.
*/

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, ExecuteStatementCommand, ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Printer } from "@node-escpos/core";
import USB from "@node-escpos/usb-adapter";

// Client for accessing dyanmo db
const client = new DynamoDBClient({ region: "us-east-2" });
const dynamo = DynamoDBDocumentClient.from(client);

// Table name for the top suggestions
const TABLE_NAME = "TopSuggestions";

// Identifying the printer's usb by id.
const device = new USB(0x0416, 0x5011);

// Making the printer object
const options = { encoding: "GB18030" };
const printer = new Printer(device, options);

async function main() {
  // Get the date for the start of last week
  let date = new Date();
  date.setDate(date.getDate() - 7)
  
  // format the date as a suggestionId
  const lastResetDate = `SUGGESTION_${date.toISOString()}`;
  
  // Find the top suggestion from last week.
  // This scan should only return a single post if the app works properly,
  //   but a full scan is done just to be safe.
  const suggestions = [];
  let suggestionLastKey;
  
  do {
    const page = await dynamo.send(
      new ScanCommand({
	TableName: TABLE_NAME,
	FilterExpression: "#suggestionId > :threshold",
	ExpressionAttributeNames: {
	  "#suggestionId": "suggestionId",
	},
	ExpressionAttributeValues: {
	  ":threshold": lastResetDate,
	},
	ExclusiveStartKey: suggestionLastKey,
      })
    );
    
    suggestions.push(...(page.Items ?? []));
    suggestionLastKey = page.LastEvaluatedKey;
  } while (suggestionLastKey);
  
  // There should only be 1 suggestion here, but just in case
  const topSuggestion = suggestions[0]; 
  
  // Extract the suggestion post date from the suggestionId.
  const suggestionDateStr = topSuggestion.suggestionId.substring(11);
  const suggestionDate = new Date(suggestionDateStr);
  
  // Format the date in a more readable manner
  const formattedDate = suggestionDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12:  true    
  });
  
  // Do da printing
  device.open(function(err) {
    printer
    .font('a')
    .align('lt')
    .style("bu")
    .size(2, 2)
    .text(`${topSuggestion.pseudonym}\n`)
    .size(1, 1)
    .text(`${formattedDate}\n`)
    .text(` ${topSuggestion.text}\n`)
    .text(`Likes: ${topSuggestion.likes}  Comments: ${topSuggestion.comments}`)
    .feed(1)
    .cut()
    .close();
  });
}

main().catch(error => {
  console.error(`Weekly Print Failed: `, error); 
});
