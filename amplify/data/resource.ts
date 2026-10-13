import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Chat: a.model({
    name: a.string(),
    isDone: a.boolean(),
    message: a.hasMany('Message', 'chatID')
  }),
  Message: a.model({
    text: a.string(),
    chat: a.belongsTo('Chat', 'chatId'),
    chatId: a.id(),
    isDone: a.boolean()
  }),
}).authorization((allow) => allow.owner());

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});