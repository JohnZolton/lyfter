import type { exerciseSet } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../../components/ui/dialog";
import { Equal, Check, ThumbsDown } from "lucide-react";
import useWorkoutStore from "~/lib/store";
import { api } from "~/utils/api";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

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
  const { handleMissedTarget, workout } = useWorkoutStore();
  const currentExercise = workout?.workout.exercises.find(
    (exercise) => exercise.exerciseId === currentSet?.exerciseId
  );

  console.log(currentExercise?.sets.length);
  console.log(currentSet?.setNumber);
  useEffect(() => {
    if (
      currentSet &&
      currentSet.reps &&
      isRegression() &&
      !deloadDenied &&
      currentExercise?.sets &&
      currentSet.setNumber < currentExercise?.sets?.length - 1
    ) {
      setDeloadTrigger(true);
    }
  }, [currentSet]);

  const [deloadTrigger, setDeloadTrigger] = useState(false);
  const [deloadDenied, setDeloadDenied] = useState(false);
  function handleDeload() {
    setDeloadTrigger(false);
    setDeloadDenied(true);
    if (currentSet) {
      handleMissedTarget(currentSet);
      recordMissedSets({ setId: currentSet.setId });
    }
  }

  if (!currentSet) return null;

  const { weight, reps, priorSet } = currentSet;
  if (!priorSet || priorSet.reps === 0 || priorSet.reps === null) return null;

  const { weight: priorWeight, reps: priorReps } = priorSet;

  function isImprovement() {
    if (!priorSet) return false;
    return (
      (reps !== null && reps > 0 && weight! > priorWeight!) ||
      (weight! >= priorWeight! && reps! > priorReps)
    );
  }

  function isMaintenance() {
    if (!priorReps) return false;
    return weight === priorWeight && reps === priorReps;
  }

  function isRegression() {
    return (
      priorSet &&
      priorSet.weight &&
      weight &&
      reps &&
      reps > 0 &&
      ((priorWeight && weight < priorSet.weight) ||
        (weight === priorWeight && reps < priorReps))
    );
  }
  function greaterWeight() {
    if (
      priorWeight &&
      weight &&
      weight > priorWeight &&
      priorReps &&
      (reps === 0 || reps === null)
    ) {
      return true;
    }
  }
  function equalWeight() {
    if (
      priorWeight &&
      weight &&
      weight === priorWeight &&
      priorReps &&
      (reps === 0 || reps === null)
    ) {
      return true;
    }
  }
  function getPerformanceIcon() {
    if (weight === priorWeight && priorReps && reps === 0) {
      return currentSet?.targetReps;
    }
    if (equalWeight()) {
      return currentSet?.targetReps;
    }
    if (greaterWeight()) {
      return priorReps;
    }
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

  return (
    <div className="flex h-6 w-6 items-center justify-center">
      {getPerformanceIcon()}
      <Dialog open={deloadTrigger && !deloadDenied}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Missed Target, Deload?</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <DialogClose
              asChild
              onBlur={() => {
                setDeloadDenied(true);
                setDeloadTrigger(false);
              }}
            >
              <div className="flex flex-row items-center justify-between">
                <Button variant={"secondary"} onClick={() => handleDeload()}>
                  Take Deload
                </Button>
                <Button type="button" variant="destructive">
                  No thanks, I&apos;m good
                </Button>
              </div>
            </DialogClose>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default PerformanceWarning;
