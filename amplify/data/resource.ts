import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  User: a.model({
    pseudonym: a.string().required(),
    hasSuggestion: a.boolean().required() // Could remove this, only used on make suggestion page to prevent users from making multiple suggestions
  }),
  Suggestion: a.model({
    userId: a.string().required(),
    text: a.string().required(),
    likes: a.integer()
  }),
}).authorization((allow) => [
  // allow.owner(),
  allow.publicApiKey()
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});