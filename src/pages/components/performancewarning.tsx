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
  const { handleTakeDeload, setDeloadDenied, workout } = useWorkoutStore();
  const currentExercise = workout?.workout.exercises.find(
    (exercise) => exercise.exerciseId === currentSet?.exerciseId
  );

  const deloadDenied = useWorkoutStore((state) =>
    state.workout?.workout?.exercises.find(
      (exercise) => exercise.exerciseId === currentSet?.exerciseId
    )
  )?.deloadDenied;

  useEffect(() => {
    if (
      currentSet &&
      currentSet.reps &&
      isRegression({ currentSet }) &&
      !deloadDenied &&
      currentExercise?.sets &&
      currentSet.setNumber < currentExercise?.sets?.length - 1
    ) {
      setDeloadTrigger(true);
    }
  }, [currentSet]);

  const [deloadTrigger, setDeloadTrigger] = useState(false);
  function handleDeload() {
    if (currentSet) {
      setDeloadTrigger(false);
      setDeloadDenied(currentSet);
      handleTakeDeload(currentSet);
      recordMissedSets({ setId: currentSet.setId });
    }
  }

  if (!currentSet) return null;

  function isImprovement({ currentSet }: PerformanceWarningProps) {
    if (!currentSet || !currentSet.priorSet) return false;
    return (
      (currentSet.priorSet.weight !== null &&
        currentSet.priorSet.reps !== null &&
        currentSet.reps !== null &&
        currentSet.reps > 0 &&
        currentSet.weight! > currentSet.priorSet.weight) ||
      (currentSet.weight! >= currentSet.priorSet.weight! &&
        currentSet.priorSet.reps !== null &&
        currentSet.reps !== null &&
        currentSet.reps > currentSet.priorSet.reps)
    );
  }

  function isMaintenance({ currentSet }: PerformanceWarningProps) {
    if (!currentSet?.priorSet) return false;
    return (
      currentSet.weight === currentSet.priorSet.weight &&
      currentSet.reps === currentSet.priorSet.reps &&
      currentSet.reps !== null &&
      currentSet.reps > 0
    );
  }

  function isRegression({ currentSet }: PerformanceWarningProps) {
    return (
      currentSet?.priorSet &&
      currentSet?.priorSet.weight &&
      currentSet.weight &&
      currentSet.reps &&
      currentSet.reps > 0 &&
      ((currentSet.priorSet.weight &&
        currentSet.weight < currentSet.priorSet.weight) ||
        (currentSet.weight === currentSet.priorSet.weight &&
          currentSet.priorSet.reps !== null &&
          currentSet.reps < currentSet?.priorSet?.reps))
    );
  }
  function greaterWeight({ currentSet }: PerformanceWarningProps) {
    if (
      currentSet?.priorSet?.weight &&
      currentSet.weight &&
      currentSet.weight > currentSet.priorSet.weight &&
      (currentSet.reps === 0 || currentSet.reps === null)
    ) {
      return true;
    }
  }
  function equalWeight({ currentSet }: PerformanceWarningProps) {
    if (
      currentSet?.priorSet?.weight &&
      currentSet.weight &&
      currentSet.weight === currentSet.priorSet.weight &&
      currentSet.priorSet.reps &&
      (currentSet.reps === 0 || currentSet.reps === null)
    ) {
      return true;
    }
  }
  function getPerformanceIcon() {
    if (!currentSet || currentSet === undefined || currentSet === null)
      return null;

    if (
      currentSet &&
      currentSet.weight === currentSet.priorSet?.weight &&
      currentSet.reps === 0
    ) {
      return currentSet?.targetReps;
    }
    if (equalWeight({ currentSet })) {
      return currentSet.targetReps;
    }
    if (greaterWeight({ currentSet })) {
      return currentSet?.priorSet?.reps;
    }
    if (isImprovement({ currentSet })) {
      return <Check className="text-green-500" />;
    }
    if (isMaintenance({ currentSet })) {
      return <Equal className="text-yellow-500" />;
    }
    if (isRegression({ currentSet })) {
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
                setDeloadDenied(currentSet);
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
