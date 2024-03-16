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
  cascadeWeightChange: (index: number, weight: number)=>void;
}

function SetDisplay({ index, set, updateSets, removeSet, cascadeWeightChange }: SetDisplayProps) {
  const [weight, setWeight] = useState(set?.weight || null);
  const [reps, setReps] = useState(set?.reps || null);
  const [rir, setRir] = useState(set?.rir || null);

  const { mutate: recordSet } = api.getWorkouts.updateSets.useMutation({
    onSuccess(data) {
      console.log(data);
    },
  });


  useEffect(() => {
    setWeight(set?.weight);
    setReps(set?.reps);
    setRir(set?.rir);
  }, [set?.weight, set?.reps, set?.rir]);
  

  const handleWeightChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value) ?? null;
    if (value!==null && value >= 0) {
      setWeight(value);
      recordSet({
        setId: set.setId,
        weight: value ?? 0,
        reps: reps ?? 0,
        rir: rir ?? 3
      })
      cascadeWeightChange(index, value)
    }
  };

  const handleRepsChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value) ?? null;
    if (value!==null && value >= 0) {
      setReps(parseInt(event.target.value));
      recordSet({
        setId: set.setId,
        weight: weight ?? 0,
        reps: value ?? 0,
        rir: rir ?? 3
      })
    }
  };

  const [priorSet, setPriorSet] = useState<exerciseSet | undefined>();
  if (!priorSet && set && set.priorSet) {
    setPriorSet(set.priorSet);
  }

  return (
    <div className="m-1 rounded-lg bg-slate-800 p-1  shadow-md flex flex-row items-center justify-center">
    <div className="flex flex-row items-center gap-x-1">
    Weight  
    <select className="p-2 mr-2 bg-gray-700 text-white rounded text-center"
    value={weight ?? ""}
    onChange={handleWeightChange}
    >
          <option value={""}></option>
          {Array.from({ length: 501 }, (_, i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      Reps
        <select className=" p-2 bg-gray-700 text-white rounded text-center"
        onChange={handleRepsChange}
        value={reps ?? ""}
        >
          <option value={""}></option>
          {Array.from({ length: 35  }, (_, i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
    </div>
        <div className="ml-2  text-xl w-10 h-8 flex flex-row items-center justify-center ">
          <PerformanceWarning priorSet={priorSet} currentSet={set} />
        </div>

    </div>
  );
}

export default SetDisplay;
