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
  console.log("Currnet Set: ");
  console.log(currentSet);
  if (currentSet === undefined) {
    return <div></div>;
  }
  if (!currentSet.reps && currentSet.targetReps) {
    return (
      <div className="flex w-full flex-row items-center justify-center  px-2">
        {currentSet.targetReps}
      </div>
    );
  }
  if (!currentSet.reps) {
    return <div></div>;
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
