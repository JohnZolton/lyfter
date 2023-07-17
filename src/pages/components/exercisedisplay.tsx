import { v4 } from "uuid";
import { ActualWorkout, ActualExercise, exerciseSet } from "@prisma/client";
import { useState } from "react";
import { useEffect } from "react";
import { api } from "~/utils/api";
import SetDisplay from "./setdisplay";

function createUniqueId(): string {
  return v4();
}

interface ExerciseDisplayProps {
  exercise: ActualExercise & {
    sets: (exerciseSet & {
      priorSet?: exerciseSet | null;
    })[];
  };
  workoutNumber: string;
  exerciseNumber: string;
  exerciseIndex: number;
  addExercise: (workoutNumber: string, exerciseIndex: number) => void;
  updatePlan: (
    exercise: ActualExercise & {
      sets: (exerciseSet & {
        priorSet?: exerciseSet | null;
      })[];
    },
    workoutId: string,
    exerciseId: string
  ) => void;

  removeExercise: (workoutNumber: string, exerciseNumber: string) => void;
}

function ExerciseDisplay({
  removeExercise,
  exercise,
  workoutNumber,
  exerciseNumber,
  exerciseIndex,
  addExercise,
  updatePlan,
}: ExerciseDisplayProps) {
  const [description, setDescription] = useState(
    exercise?.description ?? "none"
  );
  const [sets, setSets] = useState<
    (exerciseSet & {
      priorSet?: exerciseSet | null;
    })[]
  >(exercise?.sets);

  useEffect(() => {
    setDescription(exercise.description);
    setSets(exercise.sets);
  }, [exercise?.description, exercise?.sets]);

  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setDescription(value);
  };

  function handleSetChange(
    set: exerciseSet & { priorSet?: exerciseSet | null },
    index: number
  ) {
    const newSets = [...sets];
    newSets[index] = set;
    setSets(newSets);
  }
  function handleSaveButton() {
    const newData: ActualExercise & {
      sets: (exerciseSet & { priorSet?: exerciseSet | null })[];
    } = {
      ...exercise,
      sets: sets,
      description: description,
    };

    updatePlan(newData, workoutNumber, exerciseNumber);
  }
  const { mutate: recordNewExercise } =
    api.getWorkouts.addNewExercise.useMutation({
      onSuccess(data) {
        console.log(data);
      },
    });
  const { mutate: deleteExercise } = api.getWorkouts.deleteExercise.useMutation(
    {
      onSuccess(data) {
        console.log(data);
      },
    }
  );
  const { mutate: recordUpdatedDescription } =
    api.getWorkouts.updateExerciseDescription.useMutation({
      onSuccess(data) {
        console.log(data);
      },
    });

  const { mutate: recordNewSet } = api.getWorkouts.createSet.useMutation({
    onSuccess(data) {
      console.log(data);
    },
  });

  function handleAddSet() {
    const newSet: exerciseSet & { priorSet?: null } = {
      date: new Date(),
      exerciseId: exercise.exerciseId,
      setId: createUniqueId(),
      weight: 0,
      reps: 5,
      rir: 3,
      lastSetId: null,
      priorSet: null,
    };
    const lastSet = sets[sets.length - 1];
    if (lastSet !== undefined) {
      newSet.reps = lastSet.reps;
      newSet.rir = lastSet.rir;
      newSet.weight = lastSet.weight;
    }
    const newSets = [...sets, newSet];
    setSets(newSets);
    recordNewSet({ ...newSet });
  }
  function handleAddExercise() {
    addExercise(workoutNumber, exerciseIndex);
    recordNewExercise({ workoutId: exercise.workoutId });
  }
  function handleRemoveExercise() {
    removeExercise(workoutNumber, exercise.exerciseId);
    deleteExercise({ exerciseId: exercise.exerciseId });
  }
  function handleRemoveSet(index: number) {
    console.log("remove set");
    const newSets = [...sets];
    if (index >= 0 && index < newSets.length) {
      newSets.splice(index, 1);
    }
    console.log(newSets);
    setSets(newSets);
  }
  const [descriptionInputActive, setDescriptionInputActive] = useState(false);
  const handleBlur = () => {
    if (description.length > 0) {
      setDescriptionInputActive(false);
    }
    recordUpdatedDescription({
      exerciseId: exercise.exerciseId,
      description: description,
    });
  };
  const handleDescriptionClick = () => {
    setDescriptionInputActive(true);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "Escape") {
      handleBlur();
    }
  };
  useEffect(() => {
    handleSaveButton();
  }, [sets, description]);

  if (!exercise) {
    return <div></div>;
  }
  return (
    <div
      key={exercise.description}
      className="mx-1 my-1 rounded-lg bg-slate-900 p-2  shadow-md"
    >
      <div className="flex items-center justify-center">
        {descriptionInputActive ? (
          <input
            type="text"
            value={description}
            onChange={handleDescriptionChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="rounded-lg bg-slate-700 px-2 py-1  focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            className="cursor-pointer rounded-lg bg-slate-600 px-2 py-1 font-semibold hover:bg-gray-500"
            onClick={handleDescriptionClick}
          >
            {description}
          </span>
        )}
        <button
          onClick={handleRemoveExercise}
          className="m-1 inline-flex items-center rounded bg-red-600 px-2 py-1 font-bold  hover:bg-red-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
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
      </div>
      <div>
        {sets &&
          sets.map((set, index) => (
            <SetDisplay
              key={index}
              set={set}
              index={index}
              removeSet={handleRemoveSet}
              updateSets={handleSetChange}
            />
          ))}
      </div>
      <div className="flex justify-center">
        <button
          onClick={handleAddSet}
          className="m-1 rounded bg-blue-600 px-2 py-1 font-bold  hover:bg-blue-700"
        >
          Add Set
        </button>
        <button
          onClick={handleAddExercise}
          className="m-1 rounded bg-blue-600 px-2 py-1 font-bold  hover:bg-blue-700"
        >
          Add Exercise
        </button>
      </div>
    </div>
  );
}

export default ExerciseDisplay;
