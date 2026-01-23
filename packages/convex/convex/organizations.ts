import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireOrgMember, requireOrgRole, requireUser } from './auth';

// ============================================================================
// ORGANIZATION QUERIES
// ============================================================================

export const get = query({
  args: { id: v.id('organizations') },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.id);
    if (!org) return null;
    await requireOrgMember(ctx, org._id);
    return org;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();
    if (!org) return null;
    await requireOrgMember(ctx, org._id);
    return org;
  },
});

export const listForUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    if (args.userId !== user._id) {
      throw new Error('Not authorized');
    }
    const memberships = await ctx.db
      .query('organizationMembers')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const orgs = await Promise.all(
      memberships.map(async (m) => {
        const org = await ctx.db.get(m.organizationId);
        return org ? { ...org, role: m.role } : null;
      })
    );

    return orgs.filter(Boolean);
  },
});

export const getMembers = query({
  args: { organizationId: v.id('organizations') },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, args.organizationId, ['owner', 'admin']);
    const memberships = await ctx.db
      .query('organizationMembers')
      .withIndex('by_organization', (q) => q.eq('organizationId', args.organizationId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return user ? { ...user, role: m.role, joinedAt: m.joinedAt } : null;
      })
    );

    return members.filter(Boolean);
  },
});

// ============================================================================
// ORGANIZATION MUTATIONS
// ============================================================================

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    primaryLanguage: v.union(v.literal('en'), v.literal('ja'), v.literal('es')),
    timezone: v.string(),
    ownerId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx);
    if (args.ownerId !== user._id) {
      throw new Error('Not authorized');
    }
    const now = Date.now();

    // Check if slug is available
    const existing = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();

    if (existing) {
      throw new Error('Organization slug already exists');
    }

    const orgId = await ctx.db.insert('organizations', {
      name: args.name,
      slug: args.slug,
      primaryLanguage: args.primaryLanguage,
      supportedLanguages: [args.primaryLanguage],
      timezone: args.timezone,
      settings: {
        allowGuestAccess: false,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Add owner as member
    await ctx.db.insert('organizationMembers', {
      organizationId: orgId,
      userId: user._id,
      role: 'owner',
      joinedAt: now,
    });

    return orgId;
  },
});

export const update = mutation({
  args: {
    id: v.id('organizations'),
    name: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    primaryLanguage: v.optional(v.union(v.literal('en'), v.literal('ja'), v.literal('es'))),
    supportedLanguages: v.optional(v.array(v.union(v.literal('en'), v.literal('ja'), v.literal('es')))),
    timezone: v.optional(v.string()),
    settings: v.optional(v.object({
      defaultBibleTranslation: v.optional(v.string()),
      defaultTheme: v.optional(v.string()),
      allowGuestAccess: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, args.id, ['owner', 'admin']);
    const { id, ...updates } = args;
    
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

export const addMember = mutation({
  args: {
    organizationId: v.id('organizations'),
    userId: v.id('users'),
    role: v.union(v.literal('admin'), v.literal('editor'), v.literal('viewer')),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, args.organizationId, ['owner', 'admin']);
    // Check if already a member
    const existing = await ctx.db
      .query('organizationMembers')
      .withIndex('by_org_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .first();

    if (existing) {
      throw new Error('User is already a member');
    }

    return await ctx.db.insert('organizationMembers', {
      organizationId: args.organizationId,
      userId: args.userId,
      role: args.role,
      joinedAt: Date.now(),
    });
  },
});

export const updateMemberRole = mutation({
  args: {
    organizationId: v.id('organizations'),
    userId: v.id('users'),
    role: v.union(v.literal('admin'), v.literal('editor'), v.literal('viewer')),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, args.organizationId, ['owner', 'admin']);
    const membership = await ctx.db
      .query('organizationMembers')
      .withIndex('by_org_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .first();

    if (!membership) {
      throw new Error('User is not a member');
    }

    if (membership.role === 'owner') {
      throw new Error('Cannot change owner role');
    }

    await ctx.db.patch(membership._id, { role: args.role });
  },
});

export const removeMember = mutation({
  args: {
    organizationId: v.id('organizations'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, args.organizationId, ['owner', 'admin']);
    const membership = await ctx.db
      .query('organizationMembers')
      .withIndex('by_org_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .first();

    if (!membership) {
      throw new Error('User is not a member');
    }

    if (membership.role === 'owner') {
      throw new Error('Cannot remove organization owner');
    }

    await ctx.db.delete(membership._id);
  },
});
