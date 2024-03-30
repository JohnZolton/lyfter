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
import LoadingSpinner from "./components/loadingspinner";
import SetDisplay from "./components/setdisplay";
import WorkoutDisplay3 from "./components/workoutdisplay";
import ExerciseDisplay from "./components/exercisedisplay";
import { Button } from "../components/ui/button";
import { useRouter } from "next/router";
import { UserRound } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const Home: NextPage = () => {
  const session = useSession();
  const [workoutTitle, setWorkoutTitle] = useState<string | undefined>();
  console.log(session.data?.user);
  return (
    <>
      <Head>
        <title>Liftr</title>
        <meta name="description" content="Nostr Workout Tracker" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <div className="mx-auto mt-4 flex max-w-6xl flex-row items-center justify-between gap-x-20 text-2xl font-semibold">
          <div className="ml-6">{workoutTitle ?? "Current Workouts"}</div>
          <NavBar />
        </div>
        <div className="">
          <WorkoutUiHandler setTitle={setWorkoutTitle} />
          {/* Signed out users get sign in button */}
        </div>
      </PageLayout>
    </>
  );
};

export default Home;

interface UiHandlerProps {
  setTitle: React.Dispatch<SetStateAction<string | undefined>>;
}
function WorkoutUiHandler({ setTitle }: UiHandlerProps) {
  const [workoutPlan, setWorkoutPlan] = useState<
    (Workout & { exercises: Exercise[] })[] | undefined
  >();
  const [todaysWorkout, setTodaysWorkout] = useState<
    | (Workout & {
        exercises: Exercise[];
      })
    | undefined
  >();

  const { data: userWorkouts, isLoading } =
    api.getWorkouts.getUniqueWeekWorkouts.useQuery();

  useEffect(() => {
    setTitle(
      todaysWorkout
        ? `${todaysWorkout?.description}: ${todaysWorkout?.nominalDay}`
        : undefined
    );
  }, [todaysWorkout]);

  useEffect(() => {
    if (
      userWorkouts &&
      !todaysWorkout &&
      !workoutPlan &&
      userWorkouts.workoutPlan
    ) {
      const uniqueWorkouts = new Set();
      const workoutsToDisplay: (Workout & {
        exercises: Exercise[];
      })[] = [];
      userWorkouts.workoutPlan.workouts.map((workout) => {
        console.log(workout);
        if (
          !uniqueWorkouts.has(workout.originalWorkoutId) &&
          workout.exercises.length > 0
        ) {
          uniqueWorkouts.add(workout.originalWorkoutId);
          workoutsToDisplay.push(workout);
        }
      });

      setWorkoutPlan(sortWorkoutsByNominalDay(workoutsToDisplay));
    }
  }, [userWorkouts, todaysWorkout]);

  function sortWorkoutsByNominalDay(
    workouts: (Workout & {
      exercises: Exercise[];
    })[]
  ) {
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    workouts.sort((a, b) => {
      const dayA = daysOfWeek.indexOf(a.nominalDay);
      const dayB = daysOfWeek.indexOf(b.nominalDay);
      return dayA - dayB;
    });
    return workouts;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <LoadingSpinner />
      </div>
    );
  }
  function endWorkout() {
    setTodaysWorkout(undefined);
  }

  if (!todaysWorkout) {
    return (
      <div
        style={{ maxWidth: "600px", margin: "0 auto" }}
        className="rounded-lg p-4"
      >
        <div className="rounded-lg bg-slate-800 p-4  shadow-md">
          {workoutPlan &&
            workoutPlan.map((workout) => (
              <div
                key={workout.workoutId}
                className="my-2 flex items-center justify-between"
              >
                <div className="text-lg font-semibold text-slate-100">
                  {workout.description}: {workout.nominalDay}
                </div>
                <Button asChild>
                  <Link href={`/workout/${workout.workoutId}`} prefetch>
                    Begin
                  </Link>
                </Button>
              </div>
            ))}
        </div>
      </div>
    );
  }
  return <div>Something went wrong</div>;
}
