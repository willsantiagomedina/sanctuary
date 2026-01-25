import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";

const AUTH_MODELS = new Set([
  "user",
  "session",
  "account",
  "verification",
  "jwks",
  "oauthApplication",
  "oauthAccessToken",
  "oauthConsent",
]);

const whereClause = v.object({
  field: v.string(),
  value: v.any(),
  operator: v.optional(
    v.union(
      v.literal("eq"),
      v.literal("ne"),
      v.literal("gt"),
      v.literal("gte"),
      v.literal("lt"),
      v.literal("lte"),
      v.literal("in"),
      v.literal("not_in"),
      v.literal("contains"),
      v.literal("starts_with"),
      v.literal("ends_with")
    )
  ),
  connector: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
});

const sortByClause = v.object({
  field: v.string(),
  direction: v.union(v.literal("asc"), v.literal("desc")),
});

type WhereClause = {
  field: string;
  value: unknown;
  operator?: string;
  connector?: string;
};

type SortByClause = {
  field: string;
  direction: "asc" | "desc";
};

type AnyRecord = Record<string, unknown>;

function assertAuthModel(model: string): asserts model is string {
  if (!AUTH_MODELS.has(model)) {
    throw new Error(`Unknown auth model: ${model}`);
  }
}

function stripConvexFields<T extends AnyRecord>(record: T): Omit<T, "_id" | "_creationTime"> {
  const { _id, _creationTime, ...rest } = record;
  return rest;
}

function evaluateClause(record: AnyRecord, clause: WhereClause): boolean {
  const value = record[clause.field];
  const target = clause.value;
  const operator = clause.operator ?? "eq";

  switch (operator) {
    case "in":
      return Array.isArray(target) && target.includes(value);
    case "not_in":
      return Array.isArray(target) && !target.includes(value);
    case "contains":
      if (typeof value === "string" && typeof target === "string") {
        return value.includes(target);
      }
      if (Array.isArray(value)) {
        return value.includes(target);
      }
      return false;
    case "starts_with":
      return typeof value === "string" && typeof target === "string"
        ? value.startsWith(target)
        : false;
    case "ends_with":
      return typeof value === "string" && typeof target === "string"
        ? value.endsWith(target)
        : false;
    case "ne":
      return value !== target;
    case "gt":
      return typeof value === "number" && typeof target === "number" && value > target;
    case "gte":
      return typeof value === "number" && typeof target === "number" && value >= target;
    case "lt":
      return typeof value === "number" && typeof target === "number" && value < target;
    case "lte":
      return typeof value === "number" && typeof target === "number" && value <= target;
    default:
      return value === target;
  }
}

function matchesWhere(record: AnyRecord, where?: WhereClause[]): boolean {
  if (!where || where.length === 0) {
    return true;
  }

  let result = evaluateClause(record, where[0]!);

  for (const clause of where.slice(1)) {
    const clauseResult = evaluateClause(record, clause);
    result = clause.connector === "OR" ? result || clauseResult : result && clauseResult;
  }

  return result;
}

function sortRecords<T extends AnyRecord>(records: T[], sortBy?: SortByClause): T[] {
  if (!sortBy) {
    return records;
  }

  const direction = sortBy.direction === "asc" ? 1 : -1;

  return [...records].sort((a, b) => {
    const aValue = a[sortBy.field];
    const bValue = b[sortBy.field];

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return -1 * direction;
    if (bValue == null) return 1 * direction;

    if (typeof aValue === "string" && typeof bValue === "string") {
      return aValue.localeCompare(bValue) * direction;
    }
    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * direction;
    }
    if (typeof aValue === "boolean" && typeof bValue === "boolean") {
      return (aValue === bValue ? 0 : aValue ? 1 : -1) * direction;
    }

    return String(aValue).localeCompare(String(bValue)) * direction;
  });
}

async function collectMatching(
  ctx: QueryCtx | MutationCtx,
  model: string,
  where?: WhereClause[]
): Promise<Array<AnyRecord & { _id: any }>> {
  const records = await (ctx.db.query(model as any) as any).collect();
  return records.filter((record: AnyRecord) => matchesWhere(record, where));
}

export const create = internalMutation({
  args: {
    model: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    assertAuthModel(args.model);
    await ctx.db.insert(args.model as any, args.data);
    return args.data;
  },
});

export const findOne = internalQuery({
  args: {
    model: v.string(),
    where: v.array(whereClause),
  },
  handler: async (ctx, args) => {
    assertAuthModel(args.model);
    const records = await collectMatching(ctx, args.model, args.where);

    if (!records.length) {
      return null;
    }

    return stripConvexFields(records[0]!);
  },
});

export const findMany = internalQuery({
  args: {
    model: v.string(),
    where: v.optional(v.array(whereClause)),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sortBy: v.optional(sortByClause),
  },
  handler: async (ctx, args) => {
    assertAuthModel(args.model);

    let records = await collectMatching(ctx, args.model, args.where);
    records = sortRecords(records, args.sortBy);

    if (typeof args.offset === "number") {
      records = records.slice(args.offset);
    }
    if (typeof args.limit === "number") {
      records = records.slice(0, args.limit);
    }

    return records.map((record) => stripConvexFields(record));
  },
});

export const count = internalQuery({
  args: {
    model: v.string(),
    where: v.optional(v.array(whereClause)),
  },
  handler: async (ctx, args) => {
    assertAuthModel(args.model);
    const records = await collectMatching(ctx, args.model, args.where);
    return records.length;
  },
});

export const update = internalMutation({
  args: {
    model: v.string(),
    where: v.array(whereClause),
    update: v.any(),
  },
  handler: async (ctx, args) => {
    assertAuthModel(args.model);
    const records = await collectMatching(ctx, args.model, args.where);

    if (!records.length) {
      return null;
    }

    const record = records[0]!;
    await ctx.db.patch(record._id, args.update);

    return stripConvexFields({ ...record, ...args.update });
  },
});

export const updateMany = internalMutation({
  args: {
    model: v.string(),
    where: v.array(whereClause),
    update: v.any(),
  },
  handler: async (ctx, args) => {
    assertAuthModel(args.model);
    const records = await collectMatching(ctx, args.model, args.where);

    for (const record of records) {
      await ctx.db.patch(record._id, args.update);
    }

    return records.length;
  },
});

export const deleteOne = internalMutation({
  args: {
    model: v.string(),
    where: v.array(whereClause),
  },
  handler: async (ctx, args) => {
    assertAuthModel(args.model);
    const records = await collectMatching(ctx, args.model, args.where);

    if (!records.length) {
      return;
    }

    await ctx.db.delete(records[0]!._id);
  },
});

export const deleteMany = internalMutation({
  args: {
    model: v.string(),
    where: v.array(whereClause),
  },
  handler: async (ctx, args) => {
    assertAuthModel(args.model);
    const records = await collectMatching(ctx, args.model, args.where);

    for (const record of records) {
      await ctx.db.delete(record._id);
    }

    return records.length;
  },
});
