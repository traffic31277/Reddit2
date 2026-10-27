import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { weeklyReset } from '../weekly_reset/resource';

const schema = a.schema({
  UsedPseudonyms: a.customType({
    id: a.id().required(),
  }),
  User: a.model({
    pseudonym: a.string().required(),
    hasSuggestion: a.boolean().required() // Could remove this, only used on make suggestion page to prevent users from making multiple suggestions
  }),
  Suggestion: a.customType({
    userId: a.string().required(),
    currentPseudonym: a.string().required(),
    text: a.string().required(),
    likes: a.integer()
  }),


    
  addSuggestion: a
    .mutation()
    .arguments({
      id: a.id(),
      userId: a.string().required(),
      currentPseudonym: a.string().required(),
      text: a.string(),
      likes: a.integer(),
    })
    .returns(a.ref("Suggestion"))
    .authorization(allow => [allow.publicApiKey()])
    .handler(
      a.handler.custom({
        dataSource: "ExternalSuggestionsTableDataSource",
        entry: "./addSuggestion.js",
      })
    ),

  
}).authorization((allow) => [
  // allow.owner(),
  allow.publicApiKey(),
  allow.resource(weeklyReset),
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',

    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
