import { Pool } from 'pg';
import { Action, Resource } from '../auth/simple-acl';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'shipnorth-postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

export interface AuditLogOptions {
  userId: string;
  action: Action;
  resource: Resource;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

export class SimpleAuditService {
  /**
   * Log an action to the audit trail
   */
  static async log(options: AuditLogOptions): Promise<void> {
    try {
      const {
        userId,
        action,
        resource,
        resourceId,
        details = {},
        ipAddress,
        userAgent,
        success = true,
        errorMessage
      } = options;

      // Try to create the table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255),
          action VARCHAR(50) NOT NULL,
          resource VARCHAR(50) NOT NULL,
          resource_id VARCHAR(255),
          details TEXT,
          ip_address VARCHAR(45),
          user_agent TEXT,
          success BOOLEAN DEFAULT TRUE,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(
        `INSERT INTO audit_logs 
         (user_id, action, resource, resource_id, details, ip_address, user_agent, success, error_message, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          userId,
          action,
          resource,
          resourceId,
          JSON.stringify(details),
          ipAddress,
          userAgent,
          success,
          errorMessage
        ]
      );

      console.log(`✅ Audit log: User ${userId} ${success ? 'successfully' : 'failed to'} ${action} ${resource}${resourceId ? ` (${resourceId})` : ''}`);
    } catch (error) {
      console.error('❌ Failed to write audit log:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Get recent audit logs (admin function)
   */
  static async getRecentLogs(limit: number = 100): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT user_id, action, resource, resource_id, details, 
                ip_address, success, error_message, created_at
         FROM audit_logs 
         ORDER BY created_at DESC 
         LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to retrieve audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  static async getStats(): Promise<{
    totalLogs: number;
    recentFailed: number;
    topActions: Array<{ action: string; count: number }>;
  }> {
    try {
      const [totalResult, failedResult, actionsResult] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM audit_logs').catch(() => ({ rows: [{ count: '0' }] })),
        pool.query("SELECT COUNT(*) as count FROM audit_logs WHERE success = false AND created_at > NOW() - INTERVAL '24 hours'").catch(() => ({ rows: [{ count: '0' }] })),
        pool.query('SELECT action, COUNT(*) as count FROM audit_logs GROUP BY action ORDER BY count DESC LIMIT 10').catch(() => ({ rows: [] }))
      ]);

      return {
        totalLogs: parseInt(totalResult.rows[0]?.count || '0'),
        recentFailed: parseInt(failedResult.rows[0]?.count || '0'),
        topActions: actionsResult.rows || []
      };
    } catch (error) {
      console.error('❌ Failed to get audit stats:', error);
      return {
        totalLogs: 0,
        recentFailed: 0,
        topActions: []
      };
    }
  }
}