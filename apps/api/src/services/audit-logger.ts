import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'shipnorth-postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

export interface AuditLogOptions {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

export class AuditLogger {
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

      console.log(`✅ Audit: User ${userId} ${success ? 'successfully' : 'failed to'} ${action} ${resource}${resourceId ? ` (${resourceId})` : ''}`);
    } catch (error) {
      console.error('❌ Failed to write audit log:', error);
    }
  }

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
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  }

  static async getStats(): Promise<any> {
    try {
      const [totalResult, failedResult, actionsResult] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM audit_logs'),
        pool.query("SELECT COUNT(*) as count FROM audit_logs WHERE success = false AND created_at > NOW() - INTERVAL '24 hours'"),
        pool.query('SELECT action, COUNT(*) as count FROM audit_logs GROUP BY action ORDER BY count DESC LIMIT 10')
      ]);

      return {
        totalLogs: parseInt(totalResult.rows[0]?.count || '0'),
        recentFailed: parseInt(failedResult.rows[0]?.count || '0'),
        topActions: actionsResult.rows || []
      };
    } catch (error) {
      console.error('Failed to get audit stats:', error);
      return { totalLogs: 0, recentFailed: 0, topActions: [] };
    }
  }
}