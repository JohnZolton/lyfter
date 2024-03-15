import type { exerciseSet } from "@prisma/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsDown, faCheck } from "@fortawesome/free-solid-svg-icons";

interface PerformanceWarningProps {
  priorSet: exerciseSet | undefined | null;
  currentSet: exerciseSet | undefined;
}

function PerformanceWarning({ priorSet, currentSet }: PerformanceWarningProps) {
  if (!priorSet || !currentSet) {
    return (
      <div className="w-6 h-6"></div>
    )
  }

  const priorWeight = priorSet.weight ?? 0;
  const priorReps = priorSet.reps ?? 0;
  const currentWeight = currentSet.weight ?? 0;
  const currentReps = currentSet.reps ?? 0;

  if (priorWeight > currentWeight || priorReps > currentReps) {
    return (
      <div className="text-red-500">
        <FontAwesomeIcon icon={faThumbsDown} />
      </div>
    );
  }
  if (priorWeight < currentWeight || priorReps < currentReps) {
    return (
      <div className="text-green-500">
        <FontAwesomeIcon icon={faCheck} />
      </div>
    );
  } else {
    return <div className="w-6 h-6"></div>;
  }
}

export default PerformanceWarning;
