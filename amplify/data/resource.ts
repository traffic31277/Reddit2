import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { weeklyReset } from '../weekly_reset/resource';
import { assignPseudonym } from '../assign_pseudonym/resource';


const schema = a.schema({
  assignPseudonym: a
    .query()
    .arguments({
      userId: a.string().required(),
    })
    .authorization((allow) => [allow.authenticated()])
    .returns(a.string())
    .handler(a.handler.function(assignPseudonym)),

}).authorization((allow) => [
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
