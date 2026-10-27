import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { weeklyReset } from '../weekly_reset/resource';

const schema = a.schema({
  User: a.model({
    pseudonym: a.string().required(),
    hasSuggestion: a.boolean().required()
  }),

  Comment: a.model({
    text: a.string().required(),
    likes: a.integer(),
    dislikes: a.integer()
  }),

  Suggestion: a.model({
    text: a.string(),
    likes: a.integer(),
    dislikes: a.integer()
  }),

  UsedPseudonyms: a.model({
    id: a.id().required(),
  }),
})

.authorization((allow) => [
  allow.owner(),
  allow.authenticated().to(['read']),
  allow.resource(weeklyReset)
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
