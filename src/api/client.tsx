import { generateClient } from "aws-amplify/data";
import { Amplify } from 'aws-amplify';
import outputs  from '../../amplify_outputs.json';
import { type Schema } from '../../amplify/data/resource';

Amplify.configure(outputs);

export const client = generateClient<Schema>();