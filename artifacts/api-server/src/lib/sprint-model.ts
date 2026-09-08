export interface SprintStepState {
  kind: string;
  status?: string;
}

export function sprintStatusFromSteps(
  steps: SprintStepState[],
): "active" | "complete" {
  const tasks = steps.filter((step) => step.kind === "task");
  return tasks.length > 0 && tasks.every((step) => step.status === "complete")
    ? "complete"
    : "active";
}
