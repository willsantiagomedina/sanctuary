import { MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

type AuthCtx = QueryCtx | MutationCtx;
type OrgRole = "owner" | "admin" | "editor" | "viewer";

export async function requireIdentity(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
}

export async function requireUser(ctx: AuthCtx) {
  const identity = await requireIdentity(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
    .first();
  if (!user) {
    throw new Error("User record not found");
  }
  return { identity, user };
}

export async function requireOrgMember(ctx: AuthCtx, organizationId: Id<"organizations">) {
  const { user } = await requireUser(ctx);
  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_org_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", user._id)
    )
    .first();
  if (!membership) {
    throw new Error("Not authorized");
  }
  return { user, membership };
}

export async function requireOrgRole(
  ctx: AuthCtx,
  organizationId: Id<"organizations">,
  roles: OrgRole[]
) {
  const { user, membership } = await requireOrgMember(ctx, organizationId);
  if (!roles.includes(membership.role)) {
    throw new Error("Not authorized");
  }
  return { user, membership };
}

export async function requirePresentation(ctx: AuthCtx, presentationId: Id<"presentations">) {
  const presentation = await ctx.db.get(presentationId);
  if (!presentation) {
    throw new Error("Presentation not found");
  }
  return presentation;
}

export async function requirePresentationAccess(
  ctx: AuthCtx,
  presentationId: Id<"presentations">
) {
  const presentation = await requirePresentation(ctx, presentationId);
  const { user, membership } = await requireOrgMember(ctx, presentation.organizationId);
  return { presentation, user, membership };
}

export async function requirePresentationRole(
  ctx: AuthCtx,
  presentationId: Id<"presentations">,
  roles: OrgRole[]
) {
  const presentation = await requirePresentation(ctx, presentationId);
  const { user, membership } = await requireOrgRole(ctx, presentation.organizationId, roles);
  return { presentation, user, membership };
}

export async function requireSlide(ctx: AuthCtx, slideId: Id<"slides">) {
  const slide = await ctx.db.get(slideId);
  if (!slide) {
    throw new Error("Slide not found");
  }
  return slide;
}

export async function requireSlideAccess(ctx: AuthCtx, slideId: Id<"slides">) {
  const slide = await requireSlide(ctx, slideId);
  const { presentation, user, membership } = await requirePresentationAccess(
    ctx,
    slide.presentationId
  );
  return { slide, presentation, user, membership };
}

export async function requireSlideRole(
  ctx: AuthCtx,
  slideId: Id<"slides">,
  roles: OrgRole[]
) {
  const slide = await requireSlide(ctx, slideId);
  const { presentation, user, membership } = await requirePresentationRole(
    ctx,
    slide.presentationId,
    roles
  );
  return { slide, presentation, user, membership };
}
