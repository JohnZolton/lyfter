import type { exerciseSet } from "@prisma/client";
import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import PerformanceWarning from "./performancewarning";


interface SetDisplayProps {
  index: number;
  set: exerciseSet & {
    priorSet?: exerciseSet | null;
  };
  updateSets: (
    set: exerciseSet & {
      priorSet?: exerciseSet | null;
    },
    index: number
  ) => void;
  removeSet: (index: number) => void;
}

function SetDisplay({ index, set, updateSets, removeSet }: SetDisplayProps) {
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
    const newSet: exerciseSet & { priorSet?: exerciseSet | null } = {
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
  if (!priorSet && set && set.priorSet) {
    setPriorSet(set.priorSet);
  }

  return (
    <div className="m-1 rounded-lg bg-slate-800 p-1  shadow-md flex flex-row justify-between">
    <div>
    <div className="flex flex-row items-center gap-x-1">
      
    <select className="p-2 mr-2 bg-gray-700 text-white rounded">
          <option value=""></option>
          {Array.from({ length: 501 }, (_, i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        lbs
        <select className=" p-2 bg-gray-700 text-white rounded">
          <option value=""></option>
          {Array.from({ length: 35  }, (_, i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      reps
    </div>
    </div>

        <div className="mt-1 text-xl">
          <PerformanceWarning priorSet={priorSet} currentSet={set} />
        </div>
    </div>
  );
}

export default SetDisplay;
