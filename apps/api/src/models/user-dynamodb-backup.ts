// PostgreSQL User Model (replaces DynamoDB)
import { User as PostgreSQLUser } from './user-postgres';

// Re-export PostgreSQL User as main User model
export { User } from './user-postgres';
export const UserModel = PostgreSQLUser;
export default PostgreSQLUser;

// Legacy DynamoDB code has been migrated to PostgreSQL
// All user operations now use PostgreSQL instead of DynamoDB