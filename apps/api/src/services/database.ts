// PostgreSQL Database Service - Primary Database
// Unified database service for PostgreSQL
// Migration from DynamoDB completed

export * from './database-postgres';

// Export main components
import { pool, DatabaseService, generateId } from './database-postgres';

export { pool, DatabaseService, generateId };