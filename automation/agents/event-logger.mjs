/**
 * EVENT LOGGING SYSTEM
 * 
 * Provides structured event logging for agent operations.
 * Used by the agent dashboard for real-time observability.
 * 
 * Usage:
 *   import { logEvent, getEvents } from './event-logger.mjs';
 *   
 *   await logEvent({
 *     agentId: 'scout',
 *     taskId: 'task-123',
 *     actionType: 'tool_call',
 *     target: 'web_fetch',
 *     metadata: { url: 'https://example.com' },
 *     status: 'running'
 *   });
 */

import fs from 'fs';
import path from 'path';

const EVENT_LOG_PATH = './automation/agents/event-log.json';
const MAX_EVENTS = 1000; // Keep last 1000 events

// Event schema
const EVENT_SCHEMA = {
  timestamp: 'string',      // ISO 8601
  agentId: 'string',        // e.g., 'scout', 'writer', 'publisher'
  taskId: 'string',        // e.g., 'lead-123', 'blog-456'
  actionType: 'string',    // 'queued' | 'started' | 'tool_call' | 'db_write' | 'api_call' | 'file_change' | 'message' | 'completed' | 'failed' | 'blocked'
  target: 'string',        // e.g., 'sanity.create', 'web_fetch', 'file:lead-queue.json'
  metadata: 'object',      // Additional context
  durationMs: 'number',    // How long the action took
  status: 'string',        // 'queued' | 'running' | 'completed' | 'failed' | 'blocked'
  error: 'string|null',    // Error message if failed
  agentMessage: 'string|null' // Message for inter-agent communication
};

// Redaction patterns for PII/secrets
const REDACT_PATTERNS = [
  { pattern: /token["']?\s*[:=]\s*["']?([a-zA-Z0-9_-]{20,})/gi, replacement: 'token=[REDACTED]' },
  { pattern: /password["']?\s*[:=]\s*["']?([^\s"']+)/gi, replacement: 'password=[REDACTED]' },
  { pattern: /api[_-]?key["']?\s*[:=]\s*["']?([a-zA-Z0-9_-]{20,})/gi, replacement: 'api_key=[REDACTED]' },
  { pattern: /sanity[_-]?token["']?\s*[:=]\s*["']?([a-zA-Z0-9_-]{20,})/gi, replacement: 'sanity_token=[REDACTED]' },
  { pattern: /(sk-|pk_live_)[a-zA-Z0-9]{20,}/gi, replacement: '[REDACTED_KEY]' },
];

function redactSecrets(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const str = JSON.stringify(obj);
  let redacted = str;
  
  for (const { pattern, replacement } of REDACT_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  
  try {
    return JSON.parse(redacted);
  } catch {
    return obj;
  }
}

function loadEvents() {
  try {
    if (fs.existsSync(EVENT_LOG_PATH)) {
      return JSON.parse(fs.readFileSync(EVENT_LOG_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load events:', e.message);
  }
  return [];
}

function saveEvents(events) {
  try {
    // Ensure directory exists
    const dir = path.dirname(EVENT_LOG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Keep only last MAX_EVENTS
    const trimmed = events.slice(-MAX_EVENTS);
    fs.writeFileSync(EVENT_LOG_PATH, JSON.stringify(trimmed, null, 2));
  } catch (e) {
    console.error('Failed to save events:', e.message);
  }
}

/**
 * Log an event from an agent
 * @param {Object} event - Event object
 * @param {string} event.agentId - Agent identifier (e.g., 'scout', 'writer')
 * @param {string} event.taskId - Task identifier
 * @param {string} event.actionType - Type of action
 * @param {string} event.target - Target of the action
 * @param {Object} [event.metadata] - Additional context
 * @param {number} [event.durationMs] - Duration in milliseconds
 * @param {string} [event.status] - Status: queued|running|completed|failed|blocked
 * @param {string} [event.error] - Error message if failed
 * @param {string} [event.agentMessage] - Message for inter-agent comms
 */
export async function logEvent(event) {
  const events = loadEvents();
  
  const newEvent = {
    timestamp: new Date().toISOString(),
    agentId: event.agentId || 'unknown',
    taskId: event.taskId || null,
    actionType: event.actionType || 'unknown',
    target: event.target || null,
    metadata: event.metadata ? redactSecrets(event.metadata) : null,
    durationMs: event.durationMs || null,
    status: event.status || 'running',
    error: event.error ? redactSecrets(event.error) : null,
    agentMessage: event.agentMessage || null
  };
  
  events.push(newEvent);
  saveEvents(events);
  
  console.log(`📊 Event: [${newEvent.agentId}] ${newEvent.actionType} ${newEvent.target} (${newEvent.status})`);
  
  return newEvent;
}

/**
 * Get events with optional filtering
 * @param {Object} options - Filter options
 * @param {string} [options.agentId] - Filter by agent
 * @param {string} [options.taskId] - Filter by task
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.actionType] - Filter by action type
 * @param {number} [options.limit] - Max events to return (default 100)
 * @param {number} [options.since] - Only events after this ISO timestamp
 */
export function getEvents(options = {}) {
  const events = loadEvents();
  
  let filtered = events;
  
  if (options.agentId) {
    filtered = filtered.filter(e => e.agentId === options.agentId);
  }
  if (options.taskId) {
    filtered = filtered.filter(e => e.taskId === options.taskId);
  }
  if (options.status) {
    filtered = filtered.filter(e => e.status === options.status);
  }
  if (options.actionType) {
    filtered = filtered.filter(e => e.actionType === options.actionType);
  }
  if (options.since) {
    filtered = filtered.filter(e => e.timestamp >= options.since);
  }
  
  // Sort by timestamp descending (newest first)
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Limit
  const limit = options.limit || 100;
  return filtered.slice(0, limit);
}

/**
 * Get event statistics (for dashboard)
 */
export function getEventStats() {
  const events = loadEvents();
  
  const stats = {
    total: events.length,
    byAgent: {},
    byStatus: {},
    byActionType: {},
    recentActivity: []
  };
  
  for (const event of events) {
    // By agent
    stats.byAgent[event.agentId] = (stats.byAgent[event.agentId] || 0) + 1;
    
    // By status
    stats.byStatus[event.status] = (stats.byStatus[event.status] || 0) + 1;
    
    // By action type
    stats.byActionType[event.actionType] = (stats.byActionType[event.actionType] || 0) + 1;
  }
  
  // Recent activity (last 10 events)
  stats.recentActivity = events.slice(-10).reverse();
  
  return stats;
}

/**
 * Get unique agent IDs that have logged events
 */
export function getActiveAgents() {
  const events = loadEvents();
  const agents = new Set(events.map(e => e.agentId));
  return [...agents].sort();
}

/**
 * Clear all events (for testing)
 */
export function clearEvents() {
  saveEvents([]);
  console.log('📊 Event log cleared');
}

export default { logEvent, getEvents, getEventStats, getActiveAgents, clearEvents };
