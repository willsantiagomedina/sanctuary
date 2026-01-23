import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireIdentity, requireUser } from './auth';

export const createOrGet = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    authId: v.string(),
    preferredLanguage: v.union(v.literal('en'), v.literal('ja'), v.literal('es')),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    if (args.authId !== identity.subject) {
      throw new Error('Not authorized');
    }
    if (identity.email && identity.email !== args.email) {
      throw new Error('Not authorized');
    }

    const now = Date.now();

    let existing = await ctx.db
      .query('users')
      .withIndex('by_auth_id', (q) => q.eq('authId', identity.subject))
      .first();

    if (!existing && args.email) {
      existing = await ctx.db
        .query('users')
        .withIndex('by_email', (q) => q.eq('email', args.email))
        .first();
    }

    if (existing) {
      const updates: {
        email?: string;
        name?: string;
        authId?: string;
        lastActiveAt: number;
      } = { lastActiveAt: now };
      const nextEmail = identity.email ?? args.email;
      if (nextEmail && existing.email !== nextEmail) {
        updates.email = nextEmail;
      }
      const nextName = identity.name ?? args.name;
      if (nextName && existing.name !== nextName) {
        updates.name = nextName;
      }
      if (existing.authId !== identity.subject) {
        updates.authId = identity.subject;
      }
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    // Create new user
    const email = identity.email ?? args.email;
    if (!email) {
      throw new Error('Email is required');
    }
    const name = identity.name ?? args.name;
    const userId = await ctx.db.insert('users', {
      email,
      name,
      authId: identity.subject,
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
    const identity = await requireIdentity(ctx);
    if (!identity.email || identity.email !== args.email) {
      throw new Error('Not authorized');
    }
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();
  },
});

export const get = query({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    if (args.id !== user._id) {
      throw new Error('Not authorized');
    }
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
    const { user } = await requireUser(ctx);
    if (args.id !== user._id) {
      throw new Error('Not authorized');
    }
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
    const { user } = await requireUser(ctx);
    if (args.userId !== user._id) {
      throw new Error('Not authorized');
    }
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
    const { user } = await requireUser(ctx);
    if (args.userId !== user._id) {
      throw new Error('Not authorized');
    }
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
