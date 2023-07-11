import type {
  exerciseSet,
} from "@prisma/client";
import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import PerformanceWarning from "./performancewarning";


interface SetDisplayProps {
  index: number;
  set: exerciseSet & {
    priorSet: exerciseSet | null;
  };
  updateSets: (
    set: exerciseSet & {
      priorSet: exerciseSet | null;
    },
    index: number
  ) => void;
  removeSet: (index: number) => void;
}

function SetDisplay({
  index,
  set,
  updateSets,
  removeSet,
}: SetDisplayProps) {
  const [weight, setWeight] = useState(set?.weight || 0);
  const [reps, setReps] = useState(set?.reps || 0);
  const [rir, setRir] = useState(set?.rir || 0);

  const { mutate: recordSet } = api.getWorkouts.updateSets.useMutation({
    onSuccess(data) {
      console.log(data);
    },
  });
  const { mutate: deleteSet } = api.getWorkouts.removeSet.useMutation({
    onSuccess(data) {
      console.log(data);
    },
  });

  const handleWeightClick = () => {
    setWeightInputActive(true);
  };
  const handleRepsClick = () => {
    setRepsInputActive(true);
  };
  const handleRirClick = () => {
    setRirInputActive(true);
  };
  const handleBlur = () => {
    setWeightInputActive(false);
    setRepsInputActive(false);
    setRirInputActive(false);
    const newSet: exerciseSet & { priorSet: exerciseSet | null } = {
      date: new Date(),
      setId: set.setId,
      exerciseId: set.exerciseId,
      weight: weight,
      reps: reps,
      rir: rir,
      lastSetId: set.lastSetId,
      priorSet: set.priorSet,
    };
    updateSets(newSet, index);
    recordSet({ ...newSet });
  };

  useEffect(() => {
    setWeight(set?.weight || 0);
    setReps(set?.reps || 0);
    setRir(set?.rir || 0);
  }, [set?.weight, set?.reps, set?.rir]);

  const handleWeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setWeight(value);
    }
  };

  const handleRepsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setReps(parseInt(event.target.value));
    }
  };

  const handleRirChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setRir(parseInt(event.target.value));
    }
  };

  function handleRemoveSet() {
    removeSet(index);
    deleteSet({ setId: set.setId });
  }
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "esc") {
      handleBlur();
    }
  };

  const [weightInputActive, setWeightInputActive] = useState(false);
  const [repsInputActive, setRepsInputActive] = useState(false);
  const [rirInputActive, setRirInputActive] = useState(false);

  const [priorSet, setPriorSet] = useState<exerciseSet | undefined>();
  if (!priorSet && set && set.priorSet){
    setPriorSet(set.priorSet)
  }

  return (
    <div className="m-1 rounded-lg bg-slate-800 p-1  shadow-md">
      {set && set.priorSet && (
        <div className="mb-2 text-center font-semibold ">
          Last time: {set.priorSet?.weight} lbs x {set.priorSet?.reps} reps @{" "}
          {set.priorSet?.rir}RIR
        </div>
      )}
      <div className="flex flex-auto justify-center space-x-2">
        {weightInputActive ? (
          <input
            type="number"
            value={weight}
            onChange={handleWeightChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-14 rounded-lg bg-slate-700 text-center  focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            className="mx-2 cursor-pointer rounded-lg bg-slate-600 px-2  py-1 hover:bg-gray-500"
            onClick={handleWeightClick}
          >
            {weight} lbs
          </span>
        )}{" "}
        x{" "}
        {repsInputActive ? (
          <input
            type="number"
            value={reps}
            onKeyDown={handleKeyDown}
            onChange={handleRepsChange}
            onBlur={handleBlur}
            className="w-14 rounded-lg bg-slate-700 text-center  focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            className="cursor-pointer rounded-lg bg-slate-600 px-2 py-1 hover:bg-gray-500"
            onClick={handleRepsClick}
          >
            {reps} reps
          </span>
        )}
        <div className="w-.75 inline-block" />@
        {rirInputActive ? (
          <input
            type="number"
            value={rir}
            onChange={handleRirChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-14 rounded-lg bg-slate-700 text-center  focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            className="cursor-pointer rounded-lg bg-slate-600 px-2 py-1 hover:bg-gray-500"
            onClick={handleRirClick}
          >
            {rir} RIR
          </span>
        )}
        <button
          onClick={handleRemoveSet}
          className="mx-1 justify-center rounded bg-red-600 px-1 font-bold   hover:bg-red-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 11.414L15.657 17.071l1.414-1.414L11.414 10l5.657-5.657L15.657 2.93 10 8.586 4.343 2.93 2.93 4.343 8.586 10l-5.657 5.657 1.414 1.414L10 11.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div className="mt-1 text-xl">
          <PerformanceWarning priorSet={priorSet} currentSet={set} />
        </div>
      </div>
    </div>
  );
}

export default SetDisplay