import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Chat: a.model({
    name: a.string(),
    isDone: a.boolean(),
    messages: a.hasMany('Message', 'chatId')
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
    defaultAuthorizationMode: 'userPool',
  },
});