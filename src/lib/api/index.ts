/**
 * The single place backends are selected. Components and feature hooks import
 * `api` from here and never know whether they are talking to the mock or the
 * real backend. Flip backends by setting `VITE_API_BASE_URL`.
 */
import { env } from "@/lib/config/env";
import { httpApi } from "./http-api";
import { mockApi } from "./mock-api";
import type { WorkbenchApi } from "./types";

export const api: WorkbenchApi = env.useMockApi ? mockApi : httpApi;

export type * from "./types";
