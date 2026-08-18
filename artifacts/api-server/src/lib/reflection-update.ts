export type ReflectionUpdateInput = {
  whatMoved?: string | null;
  whatLearned?: string | null;
  nextContinuation?: string | null;
};

export function buildReflectionUpdate(
  input: ReflectionUpdateInput,
): ReflectionUpdateInput {
  return {
    ...(Object.hasOwn(input, "whatMoved")
      ? { whatMoved: input.whatMoved ?? null }
      : {}),
    ...(Object.hasOwn(input, "whatLearned")
      ? { whatLearned: input.whatLearned ?? null }
      : {}),
    ...(Object.hasOwn(input, "nextContinuation")
      ? { nextContinuation: input.nextContinuation ?? null }
      : {}),
  };
}
