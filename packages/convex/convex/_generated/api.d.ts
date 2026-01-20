/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bible from "../bible.js";
import type * as bibleImport from "../bibleImport.js";
import type * as live from "../live.js";
import type * as organizations from "../organizations.js";
import type * as presentations from "../presentations.js";
import type * as seed from "../seed.js";
import type * as slides from "../slides.js";
import type * as songs from "../songs.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bible: typeof bible;
  bibleImport: typeof bibleImport;
  live: typeof live;
  organizations: typeof organizations;
  presentations: typeof presentations;
  seed: typeof seed;
  slides: typeof slides;
  songs: typeof songs;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
