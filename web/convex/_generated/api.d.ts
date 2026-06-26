/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as http from "../http.js";
import type * as lib_tmx from "../lib/tmx.js";
import type * as lib_tmx_pricing from "../lib/tmx_pricing.js";
import type * as tables_data_cooked_tmx_profiles from "../tables/data_cooked_tmx_profiles.js";
import type * as tables_data_raw_tmx_submissions from "../tables/data_raw_tmx_submissions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  http: typeof http;
  "lib/tmx": typeof lib_tmx;
  "lib/tmx_pricing": typeof lib_tmx_pricing;
  "tables/data_cooked_tmx_profiles": typeof tables_data_cooked_tmx_profiles;
  "tables/data_raw_tmx_submissions": typeof tables_data_raw_tmx_submissions;
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
