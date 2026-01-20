import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const createOrGet = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    authId: v.string(),
    preferredLanguage: v.union(v.literal('en'), v.literal('ja'), v.literal('es')),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();

    if (existing) {
      // Update last active
      await ctx.db.patch(existing._id, { lastActiveAt: Date.now() });
      return existing._id;
    }

    // Create new user
    const now = Date.now();
    const userId = await ctx.db.insert('users', {
      email: args.email,
      name: args.name,
      authId: args.authId,
      preferredLanguage: args.preferredLanguage,
      createdAt: now,
      lastActiveAt: now,
    });

    // Create default preferences
    await ctx.db.insert('userPreferences', {
      userId,
      theme: 'system',
      fontSize: 16,
      fontFamily: 'Inter',
      keyboardShortcutsEnabled: true,
      reducedMotion: false,
    });

    return userId;
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();
  },
});

export const get = query({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id('users'),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    preferredLanguage: v.optional(v.union(v.literal('en'), v.literal('ja'), v.literal('es'))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, { ...filtered, lastActiveAt: Date.now() });
  },
});

export const getPreferences = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('userPreferences')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();
  },
});

export const updatePreferences = mutation({
  args: {
    userId: v.id('users'),
    theme: v.optional(v.union(v.literal('light'), v.literal('dark'), v.literal('system'))),
    defaultBibleTranslation: v.optional(v.string()),
    fontSize: v.optional(v.number()),
    fontFamily: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    const existing = await ctx.db
      .query('userPreferences')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (existing) {
      const filtered = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await ctx.db.patch(existing._id, filtered);
    }
  },
});
