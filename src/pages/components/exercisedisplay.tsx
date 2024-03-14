import { v4 } from "uuid";
import { Workout, Exercise, exerciseSet } from "@prisma/client";
import { useState } from "react";
import { useEffect } from "react";
import { api } from "~/utils/api";
import SetDisplay from "./setdisplay";
import { Menu } from 'lucide-react';



import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"


function createUniqueId(): string {
  return v4();
}

interface ExerciseDisplayProps {
  exercise: Exercise & {
    sets: (exerciseSet & {
      priorSet?: exerciseSet | null;
    })[];
  };
  workoutNumber: string;
  exerciseNumber: string;
  exerciseIndex: number;
  addExercise: (exerciseIndex: number, exercise: Exercise & {
    sets: exerciseSet[];
}) => void
  
  updatePlan: (
    exercise: Exercise & {
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
    const newData: Exercise & {
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
        addExercise(exerciseIndex, data );
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
    recordNewExercise({ workoutId: exercise.workoutId });
  }
  function handleRemoveExercise() {
    removeExercise(workoutNumber, exercise.exerciseId);
    deleteExercise({ exerciseId: exercise.exerciseId });
  }
  function handleRemoveSet(index: number) {
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


      <div className="flex items-center justify-center gap-x-2">
        <span
          className="cursor-pointer rounded-lg bg-slate-600 px-2 py-1 font-semibold hover:bg-gray-500"
          onClick={handleDescriptionClick}
        >
          {description}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger><Menu/></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={()=>console.log("clicked")}>Add Set</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>console.log("clicked")}>Remove Set</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>console.log("clicked")}>Add Exercise</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>console.log("clicked")}>Delete Exercise</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>console.log("clicked")}>Replace Exercise</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>console.log("clicked")}>Edit Exercise</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
    </div>
  );
}

export default ExerciseDisplay;
