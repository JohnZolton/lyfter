import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, useRef, useEffect, SetStateAction } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import type {
  Workout,
  Exercise,
  exerciseSet,
} from "@prisma/client";
import { v4 } from "uuid";
import { NavBar } from "~/pages/components/navbar";
import PageLayout from "~/pages/components/pagelayout";
import SetDisplay from "./components/setdisplay";
import WorkoutDisplay3 from "./components/workoutdisplay";
import ExerciseDisplay from "./components/exercisedisplay";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { 
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "~/components/ui/select";
import { Label } from "@radix-ui/react-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "~/components/ui/dialog"


type ExerciseTemplate = {
  id: string;
  description: string;
  sets: number;
  muscleGroup: string;
};


type WorkoutTemplate = {
  description: string;
  nominalDay: string;
  workoutId: string;
  exercises: (ExerciseTemplate)[];
};

type WorkoutPlan = {
  description: string | undefined;
  workouts: WorkoutTemplate[];
};
const emptyWorkoutPlan: WorkoutPlan = {
  description: "",
  workouts: [
    {
      description: "",
      nominalDay: "",
      workoutId: createUniqueId(),
      exercises: [
        {
          id: createUniqueId(),
          description: "",
          sets: 0,
          muscleGroup: ""
        },
      ],
    },
  ],
};

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Lyfter</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
      <div className="flex flex-row items-center justify-between mx-2 mt-4 text-2xl font-semibold">
        <div className="ml-6">New Custom Plan</div>
        <NavBar />
      </div>
        <div className="w-full">
          <SignedIn>
            <WorkoutPlanForm/>
            <br></br>
            <div></div>
          </SignedIn>
          <SignedOut>
            {/* Signed out users get sign in button */}
            <SignInButton redirectUrl="home">
              <button className="rounded-full bg-gray-700 p-3 text-xl text-white hover:bg-gray-600">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </PageLayout>
    </>
  );
};

export default Home;

function createUniqueId(): string {
  return v4();
}


function WorkoutPlanForm() {
  const [planDescription, setPlanDescription] = useState("")
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan>(emptyWorkoutPlan)
  const [isReady, setIsReady]=useState(false)
  const { mutate: savePlan } = api.getWorkouts.newTestPlanTwo.useMutation({
    onSuccess: (gotWorkout)=>{
        console.log(gotWorkout)
    },
  })
  
  useEffect(()=>{
    setIsReady(isPlanReady(workoutPlan))
  }, [workoutPlan])
  useEffect(()=>{
    setWorkoutPlan((prevPlan)=>{
        return {
          ...prevPlan,
          description: planDescription
        }
    })
  }, [planDescription])
  
  function isPlanReady(plan: WorkoutPlan):boolean{
    if (!planDescription || planDescription.trim()===""){
      return false
    }
    
    for (const workout of plan.workouts){
      if (!workout.description || workout.description.trim()===""){
        return false
      }
      if (!workout.nominalDay || workout.nominalDay.trim()===""){
        return false
      }
      for (const exercise of workout.exercises){
        if (!exercise.description || exercise.description.trim()===""){
          return false
        }
        if (exercise.sets <=0 || Number.isNaN(exercise.sets)){
          return false
        }
        if (!exercise.muscleGroup || exercise.muscleGroup.trim() === ""){
          return false
        }
      }
    }
    return true
  }
  

  const inputRef = useRef<HTMLInputElement | null>(null);
  
  function addWorkout(){
    const newWorkout: WorkoutTemplate ={
      description: "",
      nominalDay: "",
      workoutId: createUniqueId(),
      exercises: [
        {
          id: createUniqueId(),
          description: "",
          sets: 0,
          muscleGroup: ""
        },
      ],
    }
    setWorkoutPlan((prevPlan)=>{
      if (prevPlan){
        return {
          ...prevPlan,
          workouts: [...prevPlan.workouts, newWorkout]
        }
      } else {
        return {
          description: planDescription,
          workouts: [newWorkout]
        }
      }
    })
  }
  
  function updateWorkoutDescription(workoutId: string, description: string, nominalDay: string) {
    setWorkoutPlan((prevPlan) => {
      if (prevPlan) {
        const updatedWorkouts = prevPlan.workouts.map((workout) => {
          if (workout.workoutId === workoutId) {
            return { ...workout, description, nominalDay};
          }
          return workout;
        });
        return { ...prevPlan, workouts: updatedWorkouts };
      }
      return prevPlan;
    });
  }

  function addExercise(workoutId: string) {
    const newExercise: ExerciseTemplate = {
      id: createUniqueId(),
      description: "",
      sets: 1,
      muscleGroup: ""
    };

    setWorkoutPlan((prevPlan) => {
      if (prevPlan) {
        const updatedWorkouts = prevPlan.workouts.map((workout) => {
          if (workout.workoutId === workoutId) {
            return { ...workout, exercises: [...workout.exercises, newExercise] };
          }
          return workout;
        });
        return { ...prevPlan, workouts: updatedWorkouts };
      }
      return prevPlan;
    });
  }
  function removeWorkout(workoutId: string) {
    setWorkoutPlan((prevPlan) => {
      if (prevPlan) {
        const updatedWorkouts = prevPlan.workouts.filter((workout) => workout.workoutId!==workoutId);
        return { ...prevPlan, workouts: updatedWorkouts };
      }
      return prevPlan;
    });
  }
  function removeExercise(workoutId: string, exerciseId: string) {
    setWorkoutPlan((prevPlan) => {
      if (prevPlan) {
        const updatedWorkouts = prevPlan.workouts.map((workout) => {
          if (workout.workoutId === workoutId) {
            const updatedExercises = workout.exercises.filter((exercise) => exercise.id!==exerciseId);
            return { ...workout, exercises: updatedExercises };
          }
          return workout;
        });
        return { ...prevPlan, workouts: updatedWorkouts };
      }
      return prevPlan;
    });
  }
  function updateExercise(workoutId: string, exerciseId: string, updatedExercise: ExerciseTemplate) {
    setWorkoutPlan((prevPlan) => {
      if (prevPlan) {
        const updatedWorkouts = prevPlan.workouts.map((workout) => {
          if (workout.workoutId === workoutId) {
            const updatedExercises = workout.exercises.map((exercise) => {
              if (exercise.id === exerciseId) {
                return updatedExercise;
              }
              return exercise;
            });
            return { ...workout, exercises: updatedExercises };
          }
          return workout;
        });
        return { ...prevPlan, workouts: updatedWorkouts };
      }
      return prevPlan;
    });
  }


  return (
    <div className="flex flex-col items-center justify-center w-full ">
        <div className="space-y-5">
          <div className="rounded-lg bg-gray-900 p-5 w-full">
        <div className="flex flex-row justify-between w-full items-center gap-x-2">
            <Input
              required
              ref={inputRef}
              value={planDescription}
              onChange={(event) => setPlanDescription(event.target.value)}
              placeholder="Plan Title"
            ></Input>
          </div>
          </div>
        </div>
      <div className="w-full flex flex-col md:flex-row md: gap-x-4">
          {workoutPlan?.workouts.map((workout, index)=>
            <WorkoutDisplay workout={workout} 
            key={workout.workoutId}
            onDescriptionChange={(description, nominalDay)=>
              updateWorkoutDescription(workout.workoutId, description, nominalDay)
            }
            onDeleteWorkout={(workoutId)=>removeWorkout(workoutId)}
            onRemoveExercise={(exerciseId)=>removeExercise(workout.workoutId, exerciseId)}
            onExerciseChange={(exerciseId, updatedExercise)=>
              updateExercise(workout.workoutId, exerciseId, updatedExercise)
            }
            onAddExercise={()=>addExercise(workout.workoutId)}
            />
          )}
      </div>
      <div className="flex flex-row max-w-xl justify-between px-3 mt-3 gap-x-4">
        <Button onClick={addWorkout}>Add Workout</Button>
        <Button disabled={!isReady} onClick={()=>savePlan(workoutPlan)} >Save Plan</Button>
        </div>
    </div>
  );
}

interface WorkoutDisplayProps {
  workout: WorkoutTemplate;
  onDescriptionChange: (description: string, nominalDay:string) => void;
  onRemoveExercise: (exerciseId: string)=>void;
  onDeleteWorkout: (workoutId: string)=>void;
  onAddExercise: () => void;
  onExerciseChange: (exerciseId: string, updatedExercise: ExerciseTemplate) => void;
}
function WorkoutDisplay({workout, onDescriptionChange, onAddExercise, onExerciseChange, onDeleteWorkout, onRemoveExercise}:WorkoutDisplayProps){
  const [workoutDay, setWorkoutDay] = useState("")

  return(
    <div className="rounded-lg bg-gray-900 p-5 w-full my-2">
    <div className="flex flex-col space-y-2 w-full">
    <div className="flex flex-row items-center justify-between gap-x-2 mb-3">
      <Input
        value={workout.description}
        onChange={(event) => onDescriptionChange(event.target.value, workoutDay)}
        className=""
        type="text"
        placeholder="Workout Title"
      />
              <Select
              required
              onValueChange={(value)=>{
                setWorkoutDay(value);
                onDescriptionChange(workout.description, value)
              }
              }
              >
              <SelectTrigger>
                <SelectValue placeholder="Select Day"/>
              </SelectTrigger>
              <SelectContent>
              <SelectGroup 
              >
                <SelectLabel>Day</SelectLabel>
                <SelectItem value="Monday"
                >Monday</SelectItem>
                <SelectItem value="Tuesday">Tuesday</SelectItem>
                <SelectItem value="Wednesday">Wednesday</SelectItem>
                <SelectItem value="Thursday">Thursday</SelectItem>
                <SelectItem value="Friday">Friday</SelectItem>
                <SelectItem value="Saturday">Saturday</SelectItem>
                <SelectItem value="Sunday">Sunday</SelectItem>
              </SelectGroup>
              </SelectContent>
              </Select>
    </div>
      {workout.exercises.map((exercise) => (
        <ExerciseForm 
        exercise={exercise} 
        key={exercise.id}
        workoutId={workout.workoutId}
        onRemoveExercise={(exerciseId)=>onRemoveExercise(exerciseId)}
        onExerciseChange={(updatedExercise)=>onExerciseChange(exercise.id,updatedExercise)}
        />
      ))}
      <div className="flex flex-row justify-between md:gap-x-4">
      <Button onClick={onAddExercise}>Add Exercise</Button>
        <Dialog>
        <DialogTrigger asChild>
          <Button variant={"destructive"}>Delete Workout</Button>
        </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Workout?</DialogTitle>
            </DialogHeader>
            <DialogDescription>
            <div className="flex flex-row gap-y-3 items-center justify-between px-10">
              <Button variant={"destructive"} onClick={()=>onDeleteWorkout(workout.workoutId)}>Delete Workout</Button>
              <DialogClose>
              <Button >Cancel</Button>
              </DialogClose>
            </div>
            </DialogDescription>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </div>
  )
}

interface ExerciseFormProps{
  exercise: ExerciseTemplate
  onExerciseChange: (updatedExercise: ExerciseTemplate)=>void;
  onRemoveExercise: (exerciseId: string)=>void;
  workoutId: string
}

function ExerciseForm({exercise, workoutId, onExerciseChange, onRemoveExercise}:ExerciseFormProps){
  const [numSets, setNumSets] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  
  function handleExerciseChange(description:string, setNumber: string, muscle: string){
    onExerciseChange({
      ...exercise,
      description,
      sets: parseInt(setNumber),
      muscleGroup: muscle
    })
  }
  return(
      <div key={exercise.id} className="flex flex-col gap-y-1">
      <div className="flex flex-row items-center gap-x-2 my-1">
      <Input
        value={exercise.description}
        onChange={(event) => handleExerciseChange(event.target.value, numSets, muscleGroup)}
        className=""
        type="text"
        placeholder="Exercise Title"
      />
        <Dialog>
        <DialogTrigger asChild>
          <Button variant={"destructive"}>Delete</Button>
        </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Exercise?</DialogTitle>
            </DialogHeader>
            <DialogDescription>
            <div className="flex flex-row gap-y-3 items-center justify-between px-10">
              <Button variant={"destructive"} onClick={()=>(onRemoveExercise(exercise.id))}>Delete</Button>
              <DialogClose>
              <Button >Cancel</Button>
              </DialogClose>
            </div>
            </DialogDescription>
          </DialogContent>
        </Dialog>

      </div>
      <div className="flex flex-row justify-between gap-x-2">
              <Select
              required
              onValueChange={(value)=>{
                setNumSets(value)
                handleExerciseChange(exercise.description, value, muscleGroup)
              }}
              >
              <SelectTrigger>
                <SelectValue placeholder="# of sets"/>
              </SelectTrigger>
              <SelectContent>
              <SelectGroup 
              >
                <SelectLabel>Sets</SelectLabel>
                <SelectItem value="1"
                >1 set</SelectItem>
                <SelectItem value="2">2 sets</SelectItem>
                <SelectItem value="3">3 sets</SelectItem>
                <SelectItem value="4">4 sets</SelectItem>
                <SelectItem value="5">5 sets</SelectItem>
                <SelectItem value="6">6 sets</SelectItem>
                <SelectItem value="7">7 sets</SelectItem>
                <SelectItem value="8">8 sets</SelectItem>
              </SelectGroup>
              </SelectContent>
              </Select>
              <Select
              required
              onValueChange={(value)=>{
                setMuscleGroup(value)
                handleExerciseChange(exercise.description, numSets, value)
              }}
              >
              <SelectTrigger>
                <SelectValue placeholder="Muscle Group"/>
              </SelectTrigger>
              <SelectContent>
              <SelectGroup 
              >
                <SelectLabel>Muscle Group</SelectLabel>
                <SelectItem value="Chest">Chest</SelectItem>
                <SelectItem value="Triceps">Triceps</SelectItem>
                <SelectItem value="Back">Back</SelectItem>
                <SelectItem value="Biceps">Biceps</SelectItem>
                <SelectItem value="Shoulders">Shoulders</SelectItem>
                <SelectItem value="Abs">Abs</SelectItem>
                <SelectItem value="Quads">Quads</SelectItem>
                <SelectItem value="Glutes">Glutes</SelectItem>
                <SelectItem value="Hamstrings">Hamstrings</SelectItem>
                <SelectItem value="Calves">Calves</SelectItem>
              </SelectGroup>
              </SelectContent>
              </Select>

      </div>
        </div>

  )
}