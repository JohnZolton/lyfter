import type { exerciseSet } from "@prisma/client";
import { Equal, Check, ThumbsDown } from "lucide-react";

interface PerformanceWarningProps {
  currentSet:
    | (exerciseSet & {
        priorSet?: exerciseSet | null;
      })
    | undefined;
}

function PerformanceWarning({ currentSet }: PerformanceWarningProps) {
  if (currentSet === undefined) {
    return <div></div>;
  }
  const { weight, priorSet } = currentSet;
  if (
    weight !== undefined &&
    weight !== null &&
    priorSet?.weight !== undefined &&
    priorSet.weight !== null &&
    priorSet?.reps &&
    !currentSet.reps
  ) {
    return (
      <div className="flex w-full flex-row items-center justify-center  px-2">
        {weight > priorSet.weight ? priorSet.reps : priorSet.reps + 1}
      </div>
    );
  }
  if (!currentSet.reps && priorSet?.reps) {
    return <div>{priorSet?.reps + 1 ?? 5}</div>;
  }

  function isImprovement(
    currentSet: exerciseSet,
    priorSet: exerciseSet | null | undefined
  ) {
    if (!priorSet) return false;
    return (
      currentSet.weight! > priorSet.weight! ||
      (currentSet.weight! >= priorSet.weight! &&
        currentSet.reps! > priorSet.reps!)
    );
  }

  function isMaintenance(
    currentSet: exerciseSet,
    priorSet: exerciseSet | null | undefined
  ) {
    if (!priorSet) return false;
    return (
      currentSet.weight === priorSet.weight && currentSet.reps === priorSet.reps
    );
  }

  function isRegression(
    currentSet: exerciseSet,
    priorSet: exerciseSet | null | undefined
  ) {
    if (!priorSet) return false;
    return (
      currentSet.weight! <= priorSet.weight! &&
      currentSet.reps! <= priorSet.reps!
    );
  }

  if (isImprovement(currentSet, currentSet.priorSet)) {
    return (
      <div className="flex w-full flex-row items-center justify-center px-2  text-green-500">
        <Check />
      </div>
    );
  }
  if (isMaintenance(currentSet, currentSet.priorSet)) {
    return (
      <div className="flex w-full flex-row items-center justify-center  px-2 text-yellow-500">
        <Equal />
      </div>
    );
  }
  if (isRegression(currentSet, currentSet.priorSet)) {
    return (
      <div className="flex w-full flex-row items-center justify-center  px-2 text-red-500">
        <ThumbsDown />
      </div>
    );
  }

  return <div className="h-6 w-6"></div>;
}
export default PerformanceWarning;
