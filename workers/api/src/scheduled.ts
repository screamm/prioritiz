/**
 * Scheduled Worker Handler
 * Runs on cron trigger to clean up abandoned/expired user data from D1
 */

import type { Bindings } from './index'

const EXPIRATION_DAYS = 90
const EXPIRATION_MS = EXPIRATION_DAYS * 24 * 60 * 60 * 1000

interface UserRow {
  token: string
}

/**
 * Handles scheduled cleanup of expired users
 * Deletes users who have not synced in 90 days
 */
export async function handleScheduled(env: Bindings): Promise<void> {
  const cutoffTime = Date.now() - EXPIRATION_MS

  console.log(`[Scheduled Cleanup] Starting cleanup for users inactive since ${new Date(cutoffTime).toISOString()}`)

  // Find expired users (no sync in 90 days)
  // Use COALESCE to check last_sync_at first, then created_at
  const expiredUsers = await env.DB.prepare(`
    SELECT token FROM users
    WHERE COALESCE(last_sync_at, created_at) < ?
  `).bind(cutoffTime).all<UserRow>()

  if (!expiredUsers.results?.length) {
    console.log('[Scheduled Cleanup] No expired users to clean up')
    return
  }

  console.log(`[Scheduled Cleanup] Found ${expiredUsers.results.length} expired users to clean up`)

  let deletedCount = 0
  let errorCount = 0

  // Delete in batches to avoid timeout
  for (const user of expiredUsers.results) {
    try {
      // Foreign key CASCADE should handle todos and priorities,
      // but we delete explicitly for safety and logging
      await env.DB.batch([
        env.DB.prepare('DELETE FROM todos WHERE user_token = ?').bind(user.token),
        env.DB.prepare('DELETE FROM priorities WHERE user_token = ?').bind(user.token),
        env.DB.prepare('DELETE FROM users WHERE token = ?').bind(user.token),
      ])
      deletedCount++
      console.log(`[Scheduled Cleanup] Deleted user ${user.token.substring(0, 3)}***`)
    } catch (error) {
      errorCount++
      console.error(`[Scheduled Cleanup] Failed to delete user ${user.token.substring(0, 3)}***:`, error)
    }
  }

  console.log(`[Scheduled Cleanup] Completed: ${deletedCount} users deleted, ${errorCount} errors`)
}
