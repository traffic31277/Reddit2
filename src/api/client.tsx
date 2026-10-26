import { Amplify } from "aws-amplify";
import outputs from '../../amplify_outputs.json';

export const client = Amplify.configure(outputs);