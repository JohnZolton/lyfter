import type { exerciseSet } from "@prisma/client";
import { Equal, Check, ThumbsDown } from "lucide-react";
import useWorkoutStore from "~/lib/store";
import { api } from "~/utils/api";
import { useEffect } from "react";

interface PerformanceWarningProps {
  currentSet:
    | (exerciseSet & {
        priorSet?: exerciseSet | null;
      })
    | undefined;
}

function PerformanceWarning({ currentSet }: PerformanceWarningProps) {
  const { mutate: recordMissedSets } =
    api.getWorkouts.recordMissedTarget.useMutation();
  const { handleMissedTarget } = useWorkoutStore();
  useEffect(() => {
    if (currentSet && currentSet.reps && isRegression()) {
      handleMissedTarget(currentSet);
      recordMissedSets({ setId: currentSet.setId });
    }
  }, [currentSet]);

  if (!currentSet) return null;

  const { weight, reps, priorSet } = currentSet;
  if (!priorSet || priorSet.reps === 0 || priorSet.reps === null) return null;

  const { weight: priorWeight, reps: priorReps } = priorSet;

  function isImprovement() {
    if (!priorSet) return false;
    return (
      (reps !== 0 && weight! > priorWeight!) ||
      (weight! >= priorWeight! && reps! > priorReps)
    );
  }
  function isMaintenance() {
    if (!priorReps) return false;
    return weight === priorWeight && reps === priorReps;
  }
  function isRegression() {
    if (!priorSet || !reps) return false;
    return (
      weight! < priorWeight! || (weight === priorWeight && reps < priorReps)
    );
  }
  function getPerformanceIcon() {
    if (isImprovement()) {
      return <Check className="text-green-500" />;
    }
    if (isMaintenance()) {
      return <Equal className="text-yellow-500" />;
    }
    if (isRegression()) {
      return <ThumbsDown className="text-red-500" />;
    }
    return null;
  }

  return <div className="h-6 w-6">{getPerformanceIcon()}</div>;
}
export default PerformanceWarning;
