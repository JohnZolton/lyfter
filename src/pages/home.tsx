import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import React, { useState, useEffect, SetStateAction, useReducer } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import type { Workout, Exercise } from "@prisma/client";
import { NavBar } from "~/pages/components/navbar";
import PageLayout from "~/pages/components/pagelayout";
import LoadingSpinner from "./components/loadingspinner";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/router";

const Home: NextPage = () => {
  const [workoutTitle, setWorkoutTitle] = useState<string | undefined>();
  return (
    <>
      <Head>
        <title>Liftr</title>
        <meta name="description" content="Workout Tracker" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <div className="mt-4 flex max-w-6xl flex-row items-center justify-between px-8 text-2xl font-semibold">
          <div className="">{workoutTitle ?? "Current Workouts"}</div>
          <NavBar />
        </div>
        <div className="">
          <SignedIn>
            <WorkoutUiHandler setTitle={setWorkoutTitle} />
          </SignedIn>
          <SignedOut>
            {/* Signed out users get sign in button */}
            <SignInButton redirectUrl="home">
              <button className="rounded-full bg-slate-700 p-3 text-xl  hover:bg-gray-600">
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

interface UiHandlerProps {
  setTitle: React.Dispatch<SetStateAction<string | undefined>>;
}
function WorkoutUiHandler({ setTitle }: UiHandlerProps) {
  const [workoutPlan, setWorkoutPlan] = useState<Workout[] | undefined>();
  const [todaysWorkout, setTodaysWorkout] = useState<
    | (Workout & {
        exercises: Exercise[];
      })
    | undefined
  >();

  const {
    data: userWorkouts,
    isLoading,
    refetch,
  } = api.getWorkouts.getUniqueWeekWorkouts.useQuery();

  const router = useRouter();
  const refetchQuery = router.query.refetch;

  useEffect(() => {
    setTitle(
      todaysWorkout
        ? `${todaysWorkout?.description}: ${todaysWorkout?.nominalDay}`
        : undefined
    );
  }, [todaysWorkout]);

  useEffect(() => {
    if (userWorkouts && !todaysWorkout && !workoutPlan) {
      setWorkoutPlan(sortWorkoutsByNominalDay(userWorkouts.filteredPlan));
    }
  }, [userWorkouts, todaysWorkout]);

  function sortWorkoutsByNominalDay(workouts: Workout[]) {
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
  const { mutate: sendToWorkout } =
    api.getWorkouts.startOrCreateNewWorkoutFromPrevious.useMutation({
      onSuccess(workoutId) {
        void router.push(`/workout/${workoutId}`);
      },
    });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center gap-y-4 bg-slate-800 p-4 shadow-md">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (workoutPlan && workoutPlan.length > 0) {
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
                <div className="text-slate-100">
                  <div className="text-ls font-semibold">
                    {workout.description}
                  </div>
                  <div>{workout.nominalDay}</div>
                </div>
                <Button
                  onClick={() =>
                    sendToWorkout({ priorWorkoutId: workout.workoutId })
                  }
                >
                  Begin
                </Button>
              </div>
            ))}
        </div>
      </div>
    );
  }
  return <div>Something went wrong</div>;
}
