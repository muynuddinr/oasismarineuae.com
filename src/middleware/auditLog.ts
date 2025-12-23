/**
 * Audit Logging System
 * Tracks all admin operations for security and debugging
 */

import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { getClientIP, getUserAgent } from './adminAuth';

interface AuditLogEntry {
  timestamp: string;
  action: string;
  endpoint: string;
  method: string;
  ip: string;
  userAgent: string;
  data?: any;
  success: boolean;
  error?: string;
}

const LOG_DIR = path.join(process.cwd(), 'logs');
const AUDIT_LOG_FILE = path.join(LOG_DIR, 'admin-audit.log');
const SECURITY_LOG_FILE = path.join(LOG_DIR, 'security.log');

// Ensure logs directory exists
function ensureLogDirectory() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Log admin action to audit file
 */
export function logAdminAction(
  action: string,
  endpoint: string,
  method: string,
  ip: string,
  userAgent: string,
  success: boolean = true,
  data?: any,
  error?: string
) {
  try {
    ensureLogDirectory();

    const logEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      action,
      endpoint,
      method,
      ip,
      userAgent,
      data: data ? JSON.stringify(data).substring(0, 500) : undefined, // Limit data size
      success,
      error,
    };

    // Write to audit log
    fs.appendFileSync(AUDIT_LOG_FILE, JSON.stringify(logEntry) + '\n');

    // Alert on dangerous operations
    const dangerousActions = ['DELETE', 'cleanup', 'fix', 'remove', 'drop'];
    if (
      dangerousActions.some((keyword) =>
        action.toLowerCase().includes(keyword.toLowerCase())
      )
    ) {
      console.error('🚨 DANGEROUS OPERATION:', logEntry);
      fs.appendFileSync(SECURITY_LOG_FILE, JSON.stringify(logEntry) + '\n');
    }
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Log admin action from NextRequest
 */
export function logAdminActionFromRequest(
  request: NextRequest,
  action: string,
  success: boolean = true,
  data?: any,
  error?: string
) {
  const ip = getClientIP(request);
  const userAgent = getUserAgent(request);
  const endpoint = request.url;
  const method = request.method;

  logAdminAction(action, endpoint, method, ip, userAgent, success, data, error);
}

/**
 * Log authentication attempt
 */
export function logAuthAttempt(
  request: NextRequest,
  success: boolean,
  reason?: string
) {
  try {
    ensureLogDirectory();

    const logEntry = {
      timestamp: new Date().toISOString(),
      ip: getClientIP(request),
      userAgent: getUserAgent(request),
      endpoint: request.url,
      method: request.method,
      success,
      reason,
    };

    fs.appendFileSync(SECURITY_LOG_FILE, JSON.stringify(logEntry) + '\n');

    if (!success) {
      console.warn('🔐 Failed auth attempt:', logEntry);
    }
  } catch (error) {
    console.error('Failed to write security log:', error);
  }
}

/**
 * Get recent audit logs (for admin dashboard)
 */
export function getRecentAuditLogs(limit: number = 50): AuditLogEntry[] {
  try {
    if (!fs.existsSync(AUDIT_LOG_FILE)) {
      return [];
    }

    const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf-8');
    const lines = content.trim().split('\n');
    const logs: AuditLogEntry[] = lines
      .slice(-limit)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((log): log is AuditLogEntry => log !== null)
      .reverse();

    return logs;
  } catch (error) {
    console.error('Failed to read audit logs:', error);
    return [];
  }
}

/**
 * Monitor database operations
 */
export function logDatabaseOperation(
  operation: string,
  collection: string,
  query: any,
  result?: any
) {
  try {
    ensureLogDirectory();

    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'database',
      operation,
      collection,
      query: JSON.stringify(query).substring(0, 500),
      result: result ? JSON.stringify(result).substring(0, 200) : undefined,
    };

    fs.appendFileSync(AUDIT_LOG_FILE, JSON.stringify(logEntry) + '\n');

    // Alert on dangerous operations
    if (['deleteMany', 'remove', 'drop', 'dropDatabase'].includes(operation)) {
      console.error('🚨 DANGEROUS DB OPERATION:', logEntry);
      fs.appendFileSync(SECURITY_LOG_FILE, JSON.stringify(logEntry) + '\n');
    }
  } catch (error) {
    console.error('Failed to log database operation:', error);
  }
}
