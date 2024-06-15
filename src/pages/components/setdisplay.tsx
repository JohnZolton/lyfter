import type { exerciseSet } from "@prisma/client";
import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import PerformanceWarning from "./performancewarning";
import { setTimeout } from "timers";

interface SetDisplayProps {
  index: number;
  activeSet: number;
  set: exerciseSet & {
    priorSet?: exerciseSet | null;
  };
  updateSets: (
    set: exerciseSet & {
      priorSet?: exerciseSet | null;
    },
    index: number
  ) => void;
  handleMissedTarget: (index: number) => void;
  cascadeWeightChange: (index: number, weight: number) => void;
  startSurvey: () => void;
  feedbackLogged: boolean;
}

function SetDisplay({
  index,
  activeSet,
  set,
  updateSets,
  handleMissedTarget,
  cascadeWeightChange,
  startSurvey,
  feedbackLogged,
}: SetDisplayProps) {
  const [weight, setWeight] = useState(set?.targetWeight || null);
  const [reps, setReps] = useState(set?.reps || null);
  const [rir, setRir] = useState(set?.rir || null);

  const { mutate: recordSet } = api.getWorkouts.updateSets.useMutation();

  useEffect(() => {
    if (set.weight) {
      setWeight(set?.weight);
    }
    setReps(set?.reps);
    setRir(set?.rir);
  }, [set]);

  const handleWeightChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value) ?? null;
    if (!feedbackLogged) {
      setTimeout(() => 200);
      startSurvey();
    }
    if (value !== null) {
      const updatedSet = { ...set, weight: value };
      setWeight(value);
      updateSets(updatedSet, index);
      recordSet({
        setId: set.setId,
        weight: value ?? 0,
        reps: reps ?? 0,
        rir: rir ?? 3,
      });
      cascadeWeightChange(index, value);
    }
  };

  const handleRepsChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value) ?? null;
    if (!feedbackLogged) {
      startSurvey();
    }
    if (value !== null && value >= 0) {
      const updatedSet = { ...set, reps: value };
      updateSets(updatedSet, index);
      setReps(parseInt(event.target.value));
      setWeight(weight);
      recordSet({
        setId: set.setId,
        weight: weight ?? 0,
        reps: value ?? 0,
        rir: rir ?? 3,
      });
      if (
        reps !== undefined &&
        reps !== null &&
        set.targetReps !== undefined &&
        set.targetReps !== null &&
        set.priorSet &&
        set.priorSet.reps &&
        reps < set.targetReps &&
        set.priorSet &&
        reps < set.priorSet.reps &&
        weight !== undefined &&
        weight !== null &&
        set.targetWeight !== undefined &&
        set.targetWeight !== null &&
        set.priorSet &&
        set.priorSet.weight &&
        (weight < set.targetWeight ||
          (set.priorSet && weight < set.priorSet.weight))
      ) {
        handleMissedTarget(index);
      }
    }
  };

  return (
    <div
      className={`m-1 flex flex-row items-center  justify-between rounded-lg bg-slate-800 p-1 px-2 shadow-md
      ${activeSet === index ? "border-2 border-slate-600" : ""}
    `}
    >
      <div className="flex max-w-full flex-row items-center gap-x-1">
        <select
          className="mr-2 rounded bg-gray-700 p-2 px-3 text-center text-sm text-white "
          value={weight ?? 0}
          onChange={handleWeightChange}
        >
          <option value={""}></option>
          {Array.from({ length: 701 }, (_, i) => (
            <option key={i - 200} value={i - 200}>
              {i - 200}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select
          className=" rounded bg-gray-700 p-2 px-3 text-center text-sm text-white"
          onChange={handleRepsChange}
          value={reps ?? ""}
        >
          <option value={""}></option>
          {Array.from({ length: 35 }, (_, i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>
      <div className="ml-2  flex h-8 w-16 flex-row items-center justify-center text-xl ">
        <PerformanceWarning currentSet={set} />
      </div>
    </div>
  );
}

export default SetDisplay;
