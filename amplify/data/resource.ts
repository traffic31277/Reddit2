import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  User: a.model({
    pseudonym: a.string().required(),
    hasSuggestion: a.boolean().required()
  }),
  Suggestion: a.model({
    text: a.string().required(),
    likes: a.integer(),
    dislikes: a.integer(),

    
  }),
}).authorization((allow) => [
  // allow.owner(),
  allow.publicApiKey()
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