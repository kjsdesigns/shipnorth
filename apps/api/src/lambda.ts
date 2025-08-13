import serverlessExpress from '@codegenie/serverless-express';
import app from './index';

// Create the serverless express handler
export const handler = serverlessExpress({ app });