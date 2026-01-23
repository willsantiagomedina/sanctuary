import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireOrgMember, requirePresentationAccess, requirePresentationRole } from './auth';

// ============================================================================
// LIVE SESSION QUERIES
// ============================================================================

export const getActiveSession = query({
  args: { presentationId: v.id('presentations') },
  handler: async (ctx, args) => {
    await requirePresentationAccess(ctx, args.presentationId);
    return await ctx.db
      .query('liveSessions')
      .withIndex('by_presentation', (q) => q.eq('presentationId', args.presentationId))
      .filter((q) => q.eq(q.field('isLive'), true))
      .first();
  },
});

export const listActiveSessions = query({
  args: { organizationId: v.id('organizations') },
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.organizationId);
    return await ctx.db
      .query('liveSessions')
      .withIndex('by_organization_live', (q) =>
        q.eq('organizationId', args.organizationId).eq('isLive', true)
      )
      .collect();
  },
});

// ============================================================================
// LIVE SESSION MUTATIONS
// ============================================================================

export const startSession = mutation({
  args: {
    presentationId: v.id('presentations'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePresentationRole(ctx, args.presentationId, [
      'owner',
      'admin',
      'editor',
    ]);
    if (args.userId !== user._id) {
      throw new Error('Not authorized');
    }
    // Check if session already exists
    const existing = await ctx.db
      .query('liveSessions')
      .withIndex('by_presentation', (q) => q.eq('presentationId', args.presentationId))
      .first();

    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) throw new Error('Presentation not found');

    if (existing) {
      // Reactivate existing session
      await ctx.db.patch(existing._id, {
        isLive: true,
        startedAt: Date.now(),
        startedBy: user._id,
        currentSlideIndex: 0,
        viewerIds: [],
      });
      return existing._id;
    }

    // Create new session
    return await ctx.db.insert('liveSessions', {
      presentationId: args.presentationId,
      organizationId: presentation.organizationId,
      currentSlideIndex: 0,
      isLive: true,
      startedAt: Date.now(),
      startedBy: user._id,
      viewerIds: [],
    });
  },
});

export const stopSession = mutation({
  args: { presentationId: v.id('presentations') },
  handler: async (ctx, args) => {
    await requirePresentationRole(ctx, args.presentationId, ['owner', 'admin', 'editor']);
    const session = await ctx.db
      .query('liveSessions')
      .withIndex('by_presentation', (q) => q.eq('presentationId', args.presentationId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        isLive: false,
        viewerIds: [],
      });
    }
  },
});

export const goToSlide = mutation({
  args: {
    presentationId: v.id('presentations'),
    slideIndex: v.number(),
  },
  handler: async (ctx, args) => {
    await requirePresentationRole(ctx, args.presentationId, ['owner', 'admin', 'editor']);
    const session = await ctx.db
      .query('liveSessions')
      .withIndex('by_presentation', (q) => q.eq('presentationId', args.presentationId))
      .first();

    if (session && session.isLive) {
      await ctx.db.patch(session._id, {
        currentSlideIndex: args.slideIndex,
      });
    }
  },
});

export const nextSlide = mutation({
  args: { presentationId: v.id('presentations') },
  handler: async (ctx, args) => {
    await requirePresentationRole(ctx, args.presentationId, ['owner', 'admin', 'editor']);
    const session = await ctx.db
      .query('liveSessions')
      .withIndex('by_presentation', (q) => q.eq('presentationId', args.presentationId))
      .first();

    if (!session || !session.isLive) return;

    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) return;

    const maxIndex = presentation.slideOrder.length - 1;
    if (session.currentSlideIndex < maxIndex) {
      await ctx.db.patch(session._id, {
        currentSlideIndex: session.currentSlideIndex + 1,
      });
    }
  },
});

export const prevSlide = mutation({
  args: { presentationId: v.id('presentations') },
  handler: async (ctx, args) => {
    await requirePresentationRole(ctx, args.presentationId, ['owner', 'admin', 'editor']);
    const session = await ctx.db
      .query('liveSessions')
      .withIndex('by_presentation', (q) => q.eq('presentationId', args.presentationId))
      .first();

    if (session && session.isLive && session.currentSlideIndex > 0) {
      await ctx.db.patch(session._id, {
        currentSlideIndex: session.currentSlideIndex - 1,
      });
    }
  },
});

export const joinSession = mutation({
  args: {
    presentationId: v.id('presentations'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePresentationAccess(ctx, args.presentationId);
    if (args.userId !== user._id) {
      throw new Error('Not authorized');
    }
    const session = await ctx.db
      .query('liveSessions')
      .withIndex('by_presentation', (q) => q.eq('presentationId', args.presentationId))
      .first();

    if (session && session.isLive && !session.viewerIds.includes(user._id)) {
      await ctx.db.patch(session._id, {
        viewerIds: [...session.viewerIds, user._id],
      });
    }
  },
});

export const leaveSession = mutation({
  args: {
    presentationId: v.id('presentations'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePresentationAccess(ctx, args.presentationId);
    if (args.userId !== user._id) {
      throw new Error('Not authorized');
    }
    const session = await ctx.db
      .query('liveSessions')
      .withIndex('by_presentation', (q) => q.eq('presentationId', args.presentationId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        viewerIds: session.viewerIds.filter((id) => id !== user._id),
      });
    }
  },
});

// ============================================================================
// PRESENCE QUERIES & MUTATIONS
// ============================================================================

export const getPresence = query({
  args: { presentationId: v.id('presentations') },
  handler: async (ctx, args) => {
    await requirePresentationAccess(ctx, args.presentationId);
    const records = await ctx.db
      .query('presence')
      .withIndex('by_presentation', (q) => q.eq('presentationId', args.presentationId))
      .collect();

    // Filter out stale presence (older than 30 seconds)
    const now = Date.now();
    return records.filter((r) => now - r.lastSeen < 30000);
  },
});

export const updatePresence = mutation({
  args: {
    presentationId: v.id('presentations'),
    userId: v.id('users'),
    slideId: v.optional(v.id('slides')),
    cursor: v.optional(v.object({ x: v.number(), y: v.number() })),
    selection: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePresentationAccess(ctx, args.presentationId);
    if (args.userId !== user._id) {
      throw new Error('Not authorized');
    }
    const existing = await ctx.db
      .query('presence')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('presentationId'), args.presentationId))
      .first();

    const data = {
      presentationId: args.presentationId,
      userId: user._id,
      slideId: args.slideId,
      cursor: args.cursor,
      selection: args.selection,
      lastSeen: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert('presence', data);
    }
  },
});

export const removePresence = mutation({
  args: {
    presentationId: v.id('presentations'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePresentationAccess(ctx, args.presentationId);
    if (args.userId !== user._id) {
      throw new Error('Not authorized');
    }
    const existing = await ctx.db
      .query('presence')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('presentationId'), args.presentationId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
