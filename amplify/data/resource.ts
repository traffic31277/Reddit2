import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  User: a.model({
    userId: a.id().required(),
    pseudonym: a.string().required(),
    hasSuggestion: a.boolean().required()
  }),
  Suggestion: a.model({
    suggestionId: a.id().required(),
    text: a.string().required(),
    likes: a.integer(),
    dislikes: a.integer(),

    
  }),
}).authorization((allow) => allow.owner());

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});