import 'server-only'
import { db } from '@/lib/db'
import { getClientIp } from '@/lib/auth'

export async function logActivity(entry: {
  userId?: string | null
  action: string
  entityType?: string
  entityId?: string
  details?: string
  ip?: string
}): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        userId: entry.userId ?? undefined,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        details: entry.details?.slice(0, 500),
        ip: entry.ip ?? (await getClientIp()),
      },
    })
  } catch {
    // لاگ نباید عملکرد اصلی را مختل کند
  }
}
