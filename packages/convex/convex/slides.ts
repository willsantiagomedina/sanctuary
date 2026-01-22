import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// ============================================================================
// SLIDE QUERIES
// ============================================================================

export const get = query({
  args: { id: v.id('slides') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByPresentation = query({
  args: { presentationId: v.id('presentations') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('slides')
      .withIndex('by_presentation', (q) => q.eq('presentationId', args.presentationId))
      .collect();
  },
});

// ============================================================================
// SLIDE MUTATIONS
// ============================================================================

const slideContentValidator = v.object({
  title: v.optional(v.string()),
  subtitle: v.optional(v.string()),
  body: v.optional(v.string()),
  bibleReference: v.optional(v.object({
    book: v.string(),
    chapter: v.number(),
    verseStart: v.number(),
    verseEnd: v.optional(v.number()),
    translationId: v.optional(v.string()),
  })),
  lyrics: v.optional(v.object({
    songId: v.optional(v.id('songs')),
    verse: v.number(),
    text: v.string(),
    label: v.optional(v.string()),
  })),
  mediaId: v.optional(v.id('mediaAssets')),
});

const slideBackgroundValidator = v.object({
  type: v.union(v.literal('color'), v.literal('gradient'), v.literal('image'), v.literal('video')),
  value: v.string(),
  opacity: v.optional(v.number()),
  blur: v.optional(v.number()),
});

const slideTransitionValidator = v.object({
  type: v.union(v.literal('none'), v.literal('fade'), v.literal('slide'), v.literal('zoom'), v.literal('flip')),
  duration: v.number(),
  direction: v.optional(v.union(v.literal('left'), v.literal('right'), v.literal('up'), v.literal('down'))),
});

export const create = mutation({
  args: {
    presentationId: v.id('presentations'),
    type: v.union(
      v.literal('blank'),
      v.literal('title'),
      v.literal('bible'),
      v.literal('lyrics'),
      v.literal('image'),
      v.literal('video'),
      v.literal('announcement')
    ),
    content: v.optional(slideContentValidator),
    background: v.optional(slideBackgroundValidator),
    insertAfter: v.optional(v.id('slides')),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const slideId = await ctx.db.insert('slides', {
      presentationId: args.presentationId,
      type: args.type,
      content: args.content ?? {},
      background: args.background ?? {
        type: 'color',
        value: '#1a1a2e',
        opacity: 1,
      },
      transition: {
        type: 'fade',
        duration: 300,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Update presentation slide order
    const presentation = await ctx.db.get(args.presentationId);
    if (presentation) {
      let newOrder: typeof presentation.slideOrder;
      
      if (args.insertAfter) {
        const insertIndex = presentation.slideOrder.indexOf(args.insertAfter);
        newOrder = [
          ...presentation.slideOrder.slice(0, insertIndex + 1),
          slideId,
          ...presentation.slideOrder.slice(insertIndex + 1),
        ];
      } else {
        newOrder = [...presentation.slideOrder, slideId];
      }

      await ctx.db.patch(args.presentationId, {
        slideOrder: newOrder,
        updatedAt: now,
      });
    }

    return slideId;
  },
});

export const update = mutation({
  args: {
    id: v.id('slides'),
    content: v.optional(slideContentValidator),
    background: v.optional(slideBackgroundValidator),
    transition: v.optional(slideTransitionValidator),
    notes: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

export const duplicate = mutation({
  args: { id: v.id('slides') },
  handler: async (ctx, args) => {
    const slide = await ctx.db.get(args.id);
    if (!slide) throw new Error('Slide not found');

    const now = Date.now();
    const { _id, _creationTime, ...slideData } = slide;
    const newSlideId = await ctx.db.insert('slides', {
      ...slideData,
      createdAt: now,
      updatedAt: now,
    });

    // Update presentation slide order
    const presentation = await ctx.db.get(slide.presentationId);
    if (presentation) {
      const insertIndex = presentation.slideOrder.indexOf(args.id);
      const newOrder = [
        ...presentation.slideOrder.slice(0, insertIndex + 1),
        newSlideId,
        ...presentation.slideOrder.slice(insertIndex + 1),
      ];
      
      await ctx.db.patch(slide.presentationId, {
        slideOrder: newOrder,
        updatedAt: now,
      });
    }

    return newSlideId;
  },
});

export const remove = mutation({
  args: { id: v.id('slides') },
  handler: async (ctx, args) => {
    const slide = await ctx.db.get(args.id);
    if (!slide) return;

    // Remove from presentation slide order
    const presentation = await ctx.db.get(slide.presentationId);
    if (presentation) {
      await ctx.db.patch(slide.presentationId, {
        slideOrder: presentation.slideOrder.filter((id) => id !== args.id),
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.id);
  },
});
