import type { exerciseSet } from "@prisma/client";
import { Target, Equal, Check, ThumbsDown } from "lucide-react";

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
  if (!currentSet.reps && currentSet.targetReps !== null) {
    return (
      <div className="flex flex-row items-center gap-x-1">
        {currentSet.targetReps} <Target />
      </div>
    );
  }
  if (!currentSet.reps) {
    return <div></div>;
  }
  const { weight, reps, targetWeight, targetReps, priorSet } = currentSet;

  if (weight! >= targetWeight! && reps >= targetReps!) {
    return (
      <div className="text-green-500">
        {currentSet.targetReps} <Check />
      </div>
    );
  }

  function isImprovement(
    currentSet: exerciseSet,
    priorSet: exerciseSet | null | undefined
  ) {
    if (!priorSet) return false;
    return (
      currentSet.weight! > priorSet.weight! ||
      (currentSet.weight === priorSet.weight &&
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
      currentSet.weight! < priorSet.weight! ||
      (currentSet.weight === priorSet.weight &&
        currentSet.reps! <= priorSet.reps!)
    );
  }

  if (isImprovement(currentSet, currentSet.priorSet)) {
    return (
      <div className="text-green-500">
        {currentSet.targetReps} <Check />
      </div>
    );
  }
  if (isMaintenance(currentSet, currentSet.priorSet)) {
    return (
      <div className="text-yellow-500">
        {currentSet.targetReps} <Equal />
      </div>
    );
  }
  if (isRegression(currentSet, currentSet.priorSet)) {
    return (
      <div className="text-red-500">
        {currentSet.targetReps} <ThumbsDown />
      </div>
    );
  }

  return <div className="h-6 w-6"></div>;
}
export default PerformanceWarning;
