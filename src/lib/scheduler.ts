import type { JobSchedule } from '../types';

/**
 * Parse cron expression to next run time
 */
export function getNextRunTime(schedule: JobSchedule): Date {
  const now = new Date();
  
  switch (schedule.type) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000);
    
    case 'daily':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    
    case 'weekly':
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(0, 0, 0, 0);
      return nextWeek;
    
    case 'cron':
      // Simplified cron parsing (full implementation in Phase 6)
      if (schedule.cronExpression) {
        return parseCronExpression(schedule.cronExpression);
      }
      return new Date(now.getTime() + 60 * 60 * 1000);
    
    case 'once':
    default:
      return now;
  }
}

/**
 * Parse cron expression (simplified version)
 */
function parseCronExpression(_expression: string): Date {
  // This is a placeholder - full cron parsing will be in Phase 6
  // For now, default to 1 hour from now
  const now = new Date();
  return new Date(now.getTime() + 60 * 60 * 1000);
}

/**
 * Calculate period in minutes for chrome.alarms
 */
export function getAlarmPeriod(schedule: JobSchedule): number | undefined {
  switch (schedule.type) {
    case 'hourly':
      return 60;
    case 'daily':
      return 60 * 24;
    case 'weekly':
      return 60 * 24 * 7;
    default:
      return undefined;
  }
}

/**
 * Validate job schedule
 */
export function isValidSchedule(schedule: JobSchedule): boolean {
  if (!schedule.type) return false;
  
  if (schedule.type === 'cron' && !schedule.cronExpression) {
    return false;
  }
  
  return true;
}
