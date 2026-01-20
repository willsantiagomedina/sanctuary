import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// ============================================================================
// PRESENTATION QUERIES
// ============================================================================

export const list = query({
  args: {
    organizationId: v.id('organizations'),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const presentations = await ctx.db
      .query('presentations')
      .withIndex('by_org_archived', (q) => 
        q.eq('organizationId', args.organizationId)
         .eq('isArchived', args.includeArchived ?? false)
      )
      .order('desc')
      .collect();
    
    return presentations;
  },
});

export const get = query({
  args: { id: v.id('presentations') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithSlides = query({
  args: { id: v.id('presentations') },
  handler: async (ctx, args) => {
    const presentation = await ctx.db.get(args.id);
    if (!presentation) return null;

    const slides = await Promise.all(
      presentation.slideOrder.map((slideId) => ctx.db.get(slideId))
    );

    return {
      ...presentation,
      slides: slides.filter(Boolean),
    };
  },
});

export const search = query({
  args: {
    organizationId: v.id('organizations'),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('presentations')
      .withSearchIndex('search_title', (q) =>
        q.search('title', args.query).eq('organizationId', args.organizationId)
      )
      .take(20);
  },
});

// ============================================================================
// PRESENTATION MUTATIONS
// ============================================================================

export const create = mutation({
  args: {
    organizationId: v.id('organizations'),
    title: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const presentationId = await ctx.db.insert('presentations', {
      organizationId: args.organizationId,
      title: args.title,
      description: args.description,
      createdBy: args.createdBy,
      slideOrder: [],
      isArchived: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
    });

    // Create a default title slide
    const slideId = await ctx.db.insert('slides', {
      presentationId,
      type: 'title',
      content: {
        title: args.title,
        subtitle: args.description,
      },
      background: {
        type: 'gradient',
        value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        opacity: 1,
      },
      transition: {
        type: 'fade',
        duration: 300,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Update presentation with slide order
    await ctx.db.patch(presentationId, {
      slideOrder: [slideId],
    });

    return presentationId;
  },
});

export const update = mutation({
  args: {
    id: v.id('presentations'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const archive = mutation({
  args: { id: v.id('presentations') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isArchived: true,
      updatedAt: Date.now(),
    });
  },
});

export const updateSlideOrder = mutation({
  args: {
    id: v.id('presentations'),
    slideOrder: v.array(v.id('slides')),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      slideOrder: args.slideOrder,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id('presentations') },
  handler: async (ctx, args) => {
    const presentation = await ctx.db.get(args.id);
    if (!presentation) return;

    // Delete all slides
    for (const slideId of presentation.slideOrder) {
      await ctx.db.delete(slideId);
    }

    // Delete presence data
    const presenceRecords = await ctx.db
      .query('presence')
      .withIndex('by_presentation', (q) => q.eq('presentationId', args.id))
      .collect();
    
    for (const record of presenceRecords) {
      await ctx.db.delete(record._id);
    }

    // Delete the presentation
    await ctx.db.delete(args.id);
  },
});
