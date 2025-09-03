import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'shipnorth-postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

export class PortalPersistenceService {
  /**
   * Update user's last used portal in database
   */
  static async updateLastUsedPortal(userId: string, portal: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'UPDATE users SET last_used_portal = $1 WHERE id = $2',
        [portal, userId]
      );
      
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Failed to update last used portal:', error);
      return false;
    }
  }

  /**
   * Get user's portal preferences
   */
  static async getPortalPreferences(userId: string): Promise<{
    lastUsedPortal?: string;
    defaultPortal?: string;
  } | null> {
    try {
      const result = await pool.query(
        'SELECT last_used_portal, default_portal FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) return null;
      
      return {
        lastUsedPortal: result.rows[0].last_used_portal,
        defaultPortal: result.rows[0].default_portal
      };
    } catch (error) {
      console.error('Failed to get portal preferences:', error);
      return null;
    }
  }

  /**
   * Set user's default portal
   */
  static async setDefaultPortal(userId: string, portal: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'UPDATE users SET default_portal = $1 WHERE id = $2',
        [portal, userId]
      );
      
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Failed to set default portal:', error);
      return false;
    }
  }
}