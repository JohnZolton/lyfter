import type { exerciseSet } from "@prisma/client";
import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import PerformanceWarning from "./performancewarning";
import { setTimeout } from "timers";
import useWorkoutStore from "~/lib/store";

interface SetDisplayProps {
  index: number;
  set: exerciseSet & {
    priorSet?: exerciseSet | null;
  };
  startSurvey: () => void;
  feedbackLogged: boolean;
}

function SetDisplay({
  index,
  set,
  startSurvey,
  feedbackLogged,
}: SetDisplayProps) {
  const { updateSet, handleMissedTarget } = useWorkoutStore();

  const currentSet = useWorkoutStore((state) =>
    state.workout?.workout?.exercises
      .find((exercise) => exercise.exerciseId === set.exerciseId)
      ?.sets.find((s) => s.setId === set.setId)
  );

  const { mutate: recordSet } = api.getWorkouts.updateSets.useMutation();
  const handleWeightChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value) ?? null;
    if (!feedbackLogged) {
      setTimeout(() => 200);
      startSurvey();
    }
    if (value !== null) {
      const updatedSet = { ...set, weight: value };
      console.log("updated: ", updatedSet);
      updateSet(set.exerciseId, updatedSet);
      recordSet(updatedSet);
    }
  };

  const handleRepsChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value) ?? null;
    if (!feedbackLogged) {
      startSurvey();
    }
    if (value !== null && value >= 0) {
      const updatedSet = { ...set, reps: value };
      updateSet(set.exerciseId, updatedSet);
      recordSet(updatedSet);
      if (
        set.priorSet &&
        set.priorSet.reps &&
        set.reps &&
        set.reps < set.priorSet.reps &&
        set.weight !== undefined &&
        set.weight !== null &&
        set.priorSet.weight &&
        set.weight < set.priorSet.weight
      ) {
        handleMissedTarget(set.exerciseId, index);
      }
    }
  };

  return (
    <div
      className={`m-1 flex flex-row items-center  justify-between rounded-lg bg-slate-800 p-1 px-2 shadow-md
    `}
    >
      <div className="flex max-w-full flex-row items-center gap-x-1">
        <select
          className="mr-2 rounded bg-gray-700 p-2 px-3 text-center text-sm text-white "
          value={currentSet?.weight ?? 0}
          onChange={handleWeightChange}
        >
          {Array.from({ length: 701 }, (_, i) => i - 200).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select
          className=" rounded bg-gray-700 p-2 px-3 text-center text-sm text-white"
          onChange={handleRepsChange}
          value={currentSet?.reps ?? 0}
        >
          <option value={0}>0</option>
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
