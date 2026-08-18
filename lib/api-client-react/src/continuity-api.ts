import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { customFetch, type ErrorType } from "./custom-fetch";

export interface ActivityLogReflectionInput {
  whatMoved?: string | null;
  whatLearned?: string | null;
  nextContinuation?: string | null;
}

export interface ReflectionEntry {
  id: number;
  activityId: number;
  activityName: string;
  activityColor: string;
  durationMinutes: number;
  recallNote: string | null;
  whatMoved: string | null;
  whatLearned: string | null;
  nextContinuation: string | null;
  logDate: string;
  createdAt: string;
}

export interface DailyContext {
  id: number;
  contextDate: string;
  focusActivityId: number | null;
  focusActivityName: string | null;
  focusActivityColor: string | null;
  intention: string | null;
  externalUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyContextInput {
  focusActivityId?: number | null;
  intention?: string | null;
  externalUrl?: string | null;
}

export type EvidenceKind = "Learned" | "Moved" | "Continuation" | "Recall";

export interface KeptEvidence {
  id: number;
  activityId: number;
  activityName: string;
  activityColor: string;
  logDate: string;
  text: string;
  kind?: EvidenceKind;
  savedAt: string;
}

export interface WeeklyReflection {
  id: number;
  weekStart: string;
  notice: string;
  carry: string;
  evidenceIds: string[];
  keptEvidenceIds: number[];
  savedAt: string;
  updatedAt: string;
}

export interface WeeklyReflectionInput {
  weekStart: string;
  notice: string;
  carry: string;
  evidenceIds: string[];
  keptEvidenceIds: number[];
}

export const getListReflectionsQueryKey = () => ["/api/reflections"] as const;
export const getGetTodayContextQueryKey = () => ["/api/context/today"] as const;
export const getGetEvidenceShelfQueryKey = () =>
  ["/api/evidence-shelf"] as const;
export const getListWeeklyReflectionsQueryKey = () =>
  ["/api/weekly-reflections"] as const;

export function useListReflections<TData = ReflectionEntry[]>(options?: {
  query?: UseQueryOptions<ReflectionEntry[], ErrorType, TData>;
}) {
  return useQuery({
    queryKey: getListReflectionsQueryKey(),
    queryFn: () => customFetch<ReflectionEntry[]>("/api/reflections"),
    ...options?.query,
  });
}

export function useUpdateLogReflection(options?: {
  mutation?: UseMutationOptions<
    unknown,
    ErrorType,
    { id: number; data: ActivityLogReflectionInput }
  >;
}) {
  return useMutation({
    mutationFn: ({ id, data }) =>
      customFetch(`/api/logs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        responseType: "json",
      }),
    ...options?.mutation,
  });
}

export function useGetTodayContext<TData = DailyContext | null>(options?: {
  query?: UseQueryOptions<DailyContext | null, ErrorType, TData>;
}) {
  return useQuery({
    queryKey: getGetTodayContextQueryKey(),
    queryFn: () => customFetch<DailyContext | null>("/api/context/today"),
    ...options?.query,
  });
}

export function usePutTodayContext(options?: {
  mutation?: UseMutationOptions<DailyContext, ErrorType, DailyContextInput>;
}) {
  return useMutation({
    mutationFn: (data) =>
      customFetch<DailyContext>("/api/context/today", {
        method: "PUT",
        body: JSON.stringify(data),
        responseType: "json",
      }),
    ...options?.mutation,
  });
}

export function useGetEvidenceShelf<TData = KeptEvidence[]>(options?: {
  query?: UseQueryOptions<KeptEvidence[], ErrorType, TData>;
}) {
  return useQuery({
    queryKey: getGetEvidenceShelfQueryKey(),
    queryFn: () => customFetch<KeptEvidence[]>("/api/evidence-shelf"),
    ...options?.query,
  });
}

export function usePutEvidenceShelf(options?: {
  mutation?: UseMutationOptions<
    KeptEvidence[],
    ErrorType,
    { activityLogIds: number[] }
  >;
}) {
  return useMutation({
    mutationFn: (data) =>
      customFetch<KeptEvidence[]>("/api/evidence-shelf", {
        method: "PUT",
        body: JSON.stringify(data),
        responseType: "json",
      }),
    ...options?.mutation,
  });
}

export function useListWeeklyReflections<TData = WeeklyReflection[]>(options?: {
  query?: UseQueryOptions<WeeklyReflection[], ErrorType, TData>;
}) {
  return useQuery({
    queryKey: getListWeeklyReflectionsQueryKey(),
    queryFn: () => customFetch<WeeklyReflection[]>("/api/weekly-reflections"),
    ...options?.query,
  });
}

export function usePutWeeklyReflection(options?: {
  mutation?: UseMutationOptions<
    WeeklyReflection,
    ErrorType,
    WeeklyReflectionInput
  >;
}) {
  return useMutation({
    mutationFn: (data) =>
      customFetch<WeeklyReflection>("/api/weekly-reflections", {
        method: "PUT",
        body: JSON.stringify(data),
        responseType: "json",
      }),
    ...options?.mutation,
  });
}
