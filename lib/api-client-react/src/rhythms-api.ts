import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { customFetch, type ErrorType } from "./custom-fetch";

export type MilestonePeriod = "week" | "month" | "custom";
export type MilestoneStatus = "open" | "complete" | "archived";
export type DojoCabinetKind = "link" | "note";

export interface Milestone {
  id: number;
  title: string;
  detail: string | null;
  period: MilestonePeriod;
  dueDate: string;
  status: MilestoneStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface MilestoneInput {
  title: string;
  detail?: string | null;
  period: MilestonePeriod;
  dueDate: string;
  status?: MilestoneStatus;
}

export type SprintStatus = "active" | "complete" | "archived";
export type SprintStepStatus = "pending" | "complete";

export interface SprintStep {
  id: number;
  sprintId: number;
  title: string;
  plannedDate: string;
  position: number;
  status: SprintStepStatus;
  completedAt: string | null;
}

export interface Sprint {
  id: number;
  activityId: number | null;
  activityName: string | null;
  title: string;
  outcome: string;
  startDate: string;
  dueDate: string;
  status: SprintStatus;
  createdAt: string;
  completedAt: string | null;
  steps: SprintStep[];
}

export interface SprintInput {
  activityId?: number | null;
  title: string;
  outcome?: string;
  startDate: string;
  dueDate: string;
  steps: Array<{ title: string; plannedDate: string }>;
}

export interface PeriodReflection {
  id: number;
  milestoneId: number;
  notice: string;
  carry: string;
  savedAt: string;
  updatedAt: string;
}

export interface PeriodReflectionInput {
  notice: string;
  carry: string;
}

export interface DojoCabinetItem {
  id: number;
  periodReflectionId: number | null;
  title: string;
  url: string | null;
  note: string;
  kind: DojoCabinetKind;
  position: number;
  createdAt: string;
}

export interface DojoCabinetItemInput {
  periodReflectionId?: number | null;
  title: string;
  url?: string | null;
  note?: string;
  kind?: DojoCabinetKind;
  position?: number;
}

export const getListMilestonesQueryKey = () => ["/api/milestones"] as const;
export const getListSprintsQueryKey = () => ["/api/sprints"] as const;
export const getListDojoCabinetQueryKey = () => ["/api/dojo-cabinet"] as const;
export const getPeriodReflectionQueryKey = (milestoneId: number) =>
  ["/api/milestones", milestoneId, "reflection"] as const;

export function useListMilestones<TData = Milestone[]>(options?: {
  query?: UseQueryOptions<Milestone[], ErrorType, TData>;
}) {
  return useQuery({
    queryKey: getListMilestonesQueryKey(),
    queryFn: () => customFetch<Milestone[]>("/api/milestones"),
    ...options?.query,
  });
}

export function useCreateMilestone(options?: {
  mutation?: UseMutationOptions<Milestone, ErrorType, MilestoneInput>;
}) {
  return useMutation({
    mutationFn: (data) =>
      customFetch<Milestone>("/api/milestones", {
        method: "POST",
        body: JSON.stringify(data),
        responseType: "json",
      }),
    ...options?.mutation,
  });
}

export function useUpdateMilestone(options?: {
  mutation?: UseMutationOptions<
    Milestone,
    ErrorType,
    { id: number; data: Partial<MilestoneInput> }
  >;
}) {
  return useMutation({
    mutationFn: ({ id, data }) =>
      customFetch<Milestone>(`/api/milestones/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        responseType: "json",
      }),
    ...options?.mutation,
  });
}

export function useDeleteMilestone(options?: {
  mutation?: UseMutationOptions<void, ErrorType, { id: number }>;
}) {
  return useMutation({
    mutationFn: ({ id }) =>
      customFetch<void>(`/api/milestones/${id}`, {
        method: "DELETE",
        responseType: "json",
      }),
    ...options?.mutation,
  });
}

export function useListSprints<TData = Sprint[]>(options?: {
  query?: UseQueryOptions<Sprint[], ErrorType, TData>;
}) {
  return useQuery({
    queryKey: getListSprintsQueryKey(),
    queryFn: () => customFetch<Sprint[]>("/api/sprints"),
    ...options?.query,
  });
}

export function useCreateSprint(options?: {
  mutation?: UseMutationOptions<Sprint, ErrorType, SprintInput>;
}) {
  return useMutation({
    mutationFn: (data) =>
      customFetch<Sprint>("/api/sprints", {
        method: "POST",
        body: JSON.stringify(data),
        responseType: "json",
      }),
    ...options?.mutation,
  });
}

export function useUpdateSprint(options?: {
  mutation?: UseMutationOptions<
    Sprint,
    ErrorType,
    { id: number; data: Partial<Pick<Sprint, "title" | "outcome" | "dueDate" | "status">> }
  >;
}) {
  return useMutation({
    mutationFn: ({ id, data }) =>
      customFetch<Sprint>(`/api/sprints/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        responseType: "json",
      }),
    ...options?.mutation,
  });
}

export function useUpdateSprintStep(options?: {
  mutation?: UseMutationOptions<
    Sprint,
    ErrorType,
    { sprintId: number; stepId: number; status: SprintStepStatus }
  >;
}) {
  return useMutation({
    mutationFn: ({ sprintId, stepId, status }) =>
      customFetch<Sprint>(`/api/sprints/${sprintId}/steps/${stepId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        responseType: "json",
      }),
    ...options?.mutation,
  });
}

export function useDeleteSprint(options?: {
  mutation?: UseMutationOptions<void, ErrorType, { id: number }>;
}) {
  return useMutation({
    mutationFn: ({ id }) =>
      customFetch<void>(`/api/sprints/${id}`, {
        method: "DELETE",
        responseType: "json",
      }),
    ...options?.mutation,
  });
}

export function usePeriodReflection<TData = PeriodReflection | null>(
  milestoneId: number | null,
  options?: {
    query?: UseQueryOptions<PeriodReflection | null, ErrorType, TData>;
  },
) {
  return useQuery({
    queryKey: getPeriodReflectionQueryKey(milestoneId ?? 0),
    queryFn: () =>
      customFetch<PeriodReflection | null>(
        `/api/milestones/${milestoneId}/reflection`,
      ),
    enabled: Boolean(milestoneId),
    ...options?.query,
  });
}

export function usePutPeriodReflection(options?: {
  mutation?: UseMutationOptions<
    PeriodReflection,
    ErrorType,
    { milestoneId: number; data: PeriodReflectionInput }
  >;
}) {
  return useMutation({
    mutationFn: ({ milestoneId, data }) =>
      customFetch<PeriodReflection>(
        `/api/milestones/${milestoneId}/reflection`,
        {
          method: "PUT",
          body: JSON.stringify(data),
          responseType: "json",
        },
      ),
    ...options?.mutation,
  });
}

export function useListDojoCabinet<TData = DojoCabinetItem[]>(options?: {
  query?: UseQueryOptions<DojoCabinetItem[], ErrorType, TData>;
}) {
  return useQuery({
    queryKey: getListDojoCabinetQueryKey(),
    queryFn: () => customFetch<DojoCabinetItem[]>("/api/dojo-cabinet"),
    ...options?.query,
  });
}

export function useCreateDojoCabinetItem(options?: {
  mutation?: UseMutationOptions<
    DojoCabinetItem,
    ErrorType,
    DojoCabinetItemInput
  >;
}) {
  return useMutation({
    mutationFn: (data) =>
      customFetch<DojoCabinetItem>("/api/dojo-cabinet", {
        method: "POST",
        body: JSON.stringify(data),
        responseType: "json",
      }),
    ...options?.mutation,
  });
}

export function useUpdateDojoCabinetItem(options?: {
  mutation?: UseMutationOptions<
    DojoCabinetItem,
    ErrorType,
    { id: number; data: Partial<DojoCabinetItemInput> }
  >;
}) {
  return useMutation({
    mutationFn: ({ id, data }) =>
      customFetch<DojoCabinetItem>(`/api/dojo-cabinet/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        responseType: "json",
      }),
    ...options?.mutation,
  });
}

export function useDeleteDojoCabinetItem(options?: {
  mutation?: UseMutationOptions<void, ErrorType, { id: number }>;
}) {
  return useMutation({
    mutationFn: ({ id }) =>
      customFetch<void>(`/api/dojo-cabinet/${id}`, {
        method: "DELETE",
        responseType: "json",
      }),
    ...options?.mutation,
  });
}
