export * from "./generated/api";
export * from "./generated/api.schemas";
// The continuity wrappers below preserve the legacy raw-body mutation shape
// while the generated client supplies all shared query helpers and types.
export {
  usePutEvidenceShelf,
  usePutTodayContext,
  usePutWeeklyReflection,
} from "./continuity-api";
export * from "./rhythms-api";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";
