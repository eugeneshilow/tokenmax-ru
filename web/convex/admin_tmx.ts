import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

/**
 * Admin-only cleanup: полностью удалить ник с лидерборда (cooked-профиль + все
 * raw-сабмишены). Для чистки тестовых записей перед запуском / модерации.
 * Вызов: `npx convex run admin_tmx:purgeNick '{"nick":"..."}'`.
 */
export const purgeNick = internalMutation({
  args: { nick: v.string() },
  handler: async (ctx, { nick }) => {
    let profiles = 0
    let submissions = 0

    const ps = await ctx.db
      .query('data_cooked_tmx_profiles')
      .withIndex('by_nick', (q) => q.eq('nick', nick))
      .collect()
    for (const p of ps) {
      await ctx.db.delete(p._id)
      profiles++
    }

    const ss = await ctx.db
      .query('data_raw_tmx_submissions')
      .withIndex('by_nick_inserted', (q) => q.eq('nick', nick))
      .collect()
    for (const s of ss) {
      await ctx.db.delete(s._id)
      submissions++
    }

    return { nick, profiles, submissions }
  },
})
