import type {
  User,
  Workout,
  WorkoutPlan,
  ActualWorkout,
  ActualExercise,
  exerciseSet,
  WorkoutPlanTwo,
} from "@prisma/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThumbsDown,
  faCheck,
  faNetworkWired,
} from "@fortawesome/free-solid-svg-icons";

interface PerformanceWarningProps {
  priorSet: exerciseSet | undefined | null;
  currentSet: exerciseSet | undefined;
}

function PerformanceWarning({ priorSet, currentSet }: PerformanceWarningProps) {
  if (!priorSet || !currentSet) {
    return <div></div>;
  }

  if (priorSet.weight > currentSet.weight || priorSet.reps > currentSet.reps) {
    return (
      <div className="text-red-500">
        <FontAwesomeIcon icon={faThumbsDown} />
      </div>
    );
  }
  if (priorSet.weight < currentSet.weight || priorSet.reps < currentSet.reps) {
    return (
      <div className="text-green-500">
        <FontAwesomeIcon icon={faCheck} />
      </div>
    );
  } else {
    return <div></div>;
  }
}

export default PerformanceWarning