import { v4 } from "uuid";
import { Workout, Exercise, exerciseSet } from "@prisma/client";
import { useState } from "react";
import { useEffect } from "react";
import { api } from "~/utils/api";
import SetDisplay from "./setdisplay";
import { Menu, Newspaper } from 'lucide-react';
import { Input } from "../../components/ui/input"




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
    console.log(newData)
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
      reps: null,
      rir: 3,
      lastSetId: null,
      priorSet: null,
    };
    const lastSet = sets[sets.length - 1];
    if (lastSet !== undefined) {
      newSet.rir = lastSet.rir;
      newSet.weight = lastSet.weight;
    }
    const newSets = [...sets, newSet];
    setSets(newSets);
    recordNewSet({ ...newSet });
  }
  function handleAddExercise() {
    recordNewExercise({ workoutId: exercise.workoutId, exerciseNumber:exercise.exerciseOrder });
  }
  function handleRemoveExercise() {
    removeExercise(workoutNumber, exercise.exerciseId);
    deleteExercise({ exerciseId: exercise.exerciseId });
  }
  const { mutate: deleteSet } = api.getWorkouts.removeSet.useMutation({
    onSuccess(data) {
      console.log(data);
    },
  });
  function handleRemoveSet() {
    deleteSet({ setId: sets[sets.length-1]?.setId ?? "" });
    const newSets = sets.slice(0,-1)
    setSets(newSets);
  }
  
  function cascadeWeightChange(index: number, weight:number){
    const newSets = [...sets]
    if (index < newSets.length &&index >=0 && newSets[index]){
      newSets[index]!.weight=weight
      //for every set after current set, update the weight IF there is no weight already
      for (let i=index+1; i<newSets.length; i++){
          newSets[i]!.weight=weight
        }
      }
      console.log(newSets)
      setSets(newSets)
  }
  
  const [editingName, setEditingName]=useState(false)
  function handleEditExercise(){
    setEditingName(true)
  }
  const {mutate: updateDescription}=api.getWorkouts.updateExerciseDescription.useMutation({
    onSuccess(data){console.log(data)}
  })
  function handleSaveExercise(){
    setEditingName(false)
    updateDescription({exerciseId: exercise.exerciseId, description})
  }

  useEffect(() => {
    handleSaveButton();
  }, [sets]);

  if (!exercise) {
    return <div></div>;
  }
  return (
    <div
      key={exercise.description}
      className="mx-1 my-1 rounded-xl bg-slate-700 p-2  w-full shadow-md"
    >
      <div className="flex items-center justify-between px-1">
          {editingName ? 
            <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSaveExercise}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSaveExercise();
              }
            }}
            /> : 
          description}
        <DropdownMenu>
          <DropdownMenuTrigger><Menu/></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={()=>handleAddSet()}>Add Set</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>handleRemoveSet()}>Remove Set</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>handleAddExercise()}>Add Exercise</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>handleRemoveExercise()}>Delete Exercise</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>handleEditExercise()}>Edit Exercise</DropdownMenuItem>
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
              cascadeWeightChange={cascadeWeightChange}
            />
          ))}
      </div>
    </div>
  );
}

export default ExerciseDisplay;
