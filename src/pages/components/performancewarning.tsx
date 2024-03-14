import type { exerciseSet } from "@prisma/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsDown, faCheck } from "@fortawesome/free-solid-svg-icons";

interface PerformanceWarningProps {
  priorSet: exerciseSet | undefined | null;
  currentSet: exerciseSet | undefined;
}

function PerformanceWarning({ priorSet, currentSet }: PerformanceWarningProps) {
  if (!priorSet || !currentSet) {
    return <div className="w-6 h-6"></div>;
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
    return <div className="w-6 h-6"></div>;
  }
}

export default PerformanceWarning;
