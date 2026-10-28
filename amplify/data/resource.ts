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
		allow.ownerDefinedIn('userId'),
		allow.resource(weeklyReset),
	]),


	Comment: a.model({
		userId: a.string(),
		text: a.string().required(),
	})
	.authorization((allow) => [
		allow.ownerDefinedIn('userId'),
		allow.authenticated().to(['read']),
		allow.resource(weeklyReset),
	]),


	Suggestion: a.model({
		userId: a.string(),
		text: a.string(),
	})
	.authorization((allow) => [
		allow.ownerDefinedIn('userId'),
		allow.authenticated().to(['read']),
		allow.resource(weeklyReset),
	]),


	Vote: a.model({
		userId: a.string(),
		targetId: a.id().required(),
		value: a.integer().required()
	})
	.secondaryIndexes((index) => [index('targetId')])
	.authorization((allow) => [
		allow.ownerDefinedIn('userId'),
		allow.authenticated().to(['read']),
		allow.resource(weeklyReset),
	]),


	UsedPseudonyms: a.model({
		pseudonym: a.string().required(),
	})
	.authorization((allow) => [
		allow.ownerDefinedIn('userId'),
		allow.authenticated().to(['create', 'read']),
		allow.resource(weeklyReset)
	]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
	schema,
	authorizationModes: {
		defaultAuthorizationMode: 'userPool',
	},
});
