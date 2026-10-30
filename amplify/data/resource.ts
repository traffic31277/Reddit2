import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { weeklyReset } from '../weekly_reset/resource';

const schema = a.schema({
	User: a.model({
		userId: a.string().required(),
		pseudonym: a.string().required(),
		hasSuggestion: a.boolean().required(),
	})
	.identifier(['userId'])
	.authorization((allow) => [
		allow.ownerDefinedIn('userId')
	]),


	Comment: a.model({
		userId: a.string(),
		text: a.string().required(),
	})
	.authorization((allow) => [
		allow.ownerDefinedIn('userId')
	]),


	Suggestion: a.model({
		userId: a.string(),
		text: a.string(),
	})	.authorization((allow) => [
		allow.ownerDefinedIn('userId')
	]),


	UsedPseudonyms: a.model({
		pseudonym: a.string().required(),
	}).authorization((allow) => [
		allow.owner()
	])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
	schema,
	authorizationModes: {
		defaultAuthorizationMode: 'userPool',
	},
});
