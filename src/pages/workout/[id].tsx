
import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, useEffect, SetStateAction } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import type {
  WorkoutPlan,
  Workout,
  Exercise,
  exerciseSet,
} from "@prisma/client";
import { v4 } from "uuid";
import { NavBar } from "~/pages/components/navbar";
import PageLayout from "~/pages/components/pagelayout";
import LoadingSpinner from "../components/loadingspinner";
import SetDisplay from "../components/setdisplay";
import WorkoutDisplay3 from "../components/workoutdisplay";
import ExerciseDisplay from "../components/exercisedisplay";
import { Button } from "../../components/ui/button"
import { useRouter } from 'next/router';
import { UserRound } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "~/components/ui/dialog"

  
const Home: NextPage = () => {

  const [workout, setWorkout]=useState<
    (Workout & {
        exercises: (Exercise & {
            sets: (exerciseSet & {
                priorSet?: exerciseSet | null;
            })[];
        })[];
    }) | undefined
>()
  const router = useRouter()
  const workoutId = router.query.id as string
  console.log("reportId: ",workoutId)
  
  const { mutate: getWorkout } = api.getWorkouts.getWorkoutById.useMutation({
    onSuccess: (gotWorkout)=>{
        console.log(gotWorkout)
        setWorkout(gotWorkout.workout)
    },
  })
  
  useEffect(()=>{
    getWorkout({workoutId: workoutId})
  }, [workoutId])

  if (!workout || workout===undefined){
    return(
    <>
      <Head>
        <title>Liftr</title>
        <meta name="description" content="Nostr Workout Tracker"/>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-row justify-between  p-2 mt-2 mx-1 items-center ml-5">
      <div className="font-semibold text-2xl">Workout</div>
        <NavBar />
      </div>
          <SignedIn>
        <div className="flex flex-row items-center justify-center mt-8">
            <LoadingSpinner/>
        </div>
          </SignedIn>
          <SignedOut>
            {/* Signed out users get sign in button */}
            <div className="flex flex-row items-center justify-center mt-10">
            <SignInButton redirectUrl="home">
              <Button >Sign in</Button>
            </SignInButton>
            </div>
          </SignedOut>
    </>
    )
  }
  
  
  return (
    <>
      <Head>
        <title>Lifstr</title>
        <meta name="description" content=""/>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-row justify-between  p-2 mt-2 mx-1 items-center ml-5">
      <div className="font-semibold text-2xl">{workout.nominalDay}: {workout.description}</div>
        <NavBar />
      </div>
          <SignedIn>
            <WorkoutUi todaysWorkout={workout} setTodaysWorkout={setWorkout}/>
          </SignedIn>
          <SignedOut>
            {/* Signed out users get sign in button */}
            <div className="flex flex-row items-center justify-center mt-10">
            <SignInButton redirectUrl="home">
              <Button >Sign in</Button>
            </SignInButton>
            </div>
          </SignedOut>
    </>
  );
};
interface WorkoutUiProps {
  todaysWorkout: Workout & {
    exercises: (Exercise & {
      sets: (exerciseSet & {
        priorSet?: exerciseSet | null;
      })[];
    })[];
  };
  setTodaysWorkout:
  React.Dispatch<React.SetStateAction<(Workout & {
    exercises: (Exercise & {
        sets: (exerciseSet & {
            priorSet?: exerciseSet | null;
        })[];
    })[];
}) | undefined>>
}

function WorkoutUi({
  todaysWorkout,
  setTodaysWorkout,
}: WorkoutUiProps) {
  const today = new Date();

  const { mutate: makeNewWorkout } =
    api.getWorkouts.createNewWorkoutFromPrevious.useMutation({
      onSuccess(data) {
        setTodaysWorkout(data);
      },
    });

  let isNewWorkoutCreated = false; //flag variable to avoid firing multiple times
  useEffect(() => {
    if (todaysWorkout) {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (today.getTime() - todaysWorkout.date.getTime() > oneWeek) {
        if (!isNewWorkoutCreated) {
          isNewWorkoutCreated = true;
          console.log("need new workout");

          makeNewWorkout({priorWorkoutId: todaysWorkout.workoutId});
        }
      }
    }
  }, [todaysWorkout]);

  useEffect(() => {
    if (todaysWorkout) {
      const allSetsCompleted = todaysWorkout.exercises.every((exercise)=>
      exercise.sets.every((set)=>set.reps!==undefined && set.reps!==0 && set.reps!==null))
      setWorkoutComplete(allSetsCompleted)
      console.log(todaysWorkout)
    }
  }, [todaysWorkout]);
  const [workoutComplete, setWorkoutComplete] = useState(false)
  
  function handleEndWorkout(){
    console.log("todo")
  }

  return (
    <div className="flex flex-col items-center pb-8">
      <WorkoutDisplay3
        workoutPlan={todaysWorkout}
        setWorkoutPlan={setTodaysWorkout}
      />
      <div className="mt-3">
      {!workoutComplete && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant={"destructive"}
                >End Workout</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>End Workout</DialogTitle>
                </DialogHeader>
                  <DialogDescription>
                      <DialogClose asChild>
                      <div className="flex flex-col items-center justify-center w-full gap-y-4">
                        <div className="flex flex-row justify-between items-center w-full px-10">
                          <Button variant={'destructive'} onClick={()=>handleEndWorkout()}>Confirm</Button>
                          <Button type="button" variant="secondary">Cancel</Button>
                        </div></div>
                      </DialogClose>
                  </DialogDescription>
              </DialogContent>
            </Dialog>
      )}
      {workoutComplete && (
        <Button variant={'destructive'} onClick={()=>handleEndWorkout()}>End Workout</Button>
      )}
      </div>
    </div>
  );
}

export default Home;
