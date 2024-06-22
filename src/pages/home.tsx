import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import React, { useState, useEffect, SetStateAction, useReducer } from "react";
import type { Workout, Exercise } from "@prisma/client";
import { NavBar } from "~/pages/components/navbar";
import PageLayout from "~/pages/components/pagelayout";
import LoadingSpinner from "./components/loadingspinner";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

const Home: NextPage = () => {
  const [workoutTitle, setWorkoutTitle] = useState<string | undefined>();
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const storedToken = sessionStorage.getItem("authHeader");
    console.log("TOOOKEN: ", storedToken);
    setToken(storedToken);
  });

  return (
    <>
      <Head>
        <title>Liftr</title>
        <meta name="description" content="Workout Tracker" />
        <link rel="icon" href="/favicon.ico" />
        <meta
          http-equiv="Content-Security-Policy"
          content="script-src 'self' 'unsafe-inline' 'unsafe-eval' chrome-extension:;"
        />
      </Head>
      <PageLayout>
        <div className="mt-4 flex max-w-6xl flex-row items-center justify-between px-8 text-2xl font-semibold">
          <div className="">{workoutTitle ?? "Current Workouts"}</div>
          <NavBar />
        </div>
        <div className="">
          <WorkoutUiHandler setTitle={setWorkoutTitle} />
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

  const { data: userWorkouts, isLoading } =
    api.getWorkouts.getUniqueWeekWorkouts.useQuery();

  const router = useRouter();
  const refetchQuery = router.query.refetch;

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

  if (isLoading) {
    return (
      <div className="max-w-600 flex flex-col justify-center gap-y-4 bg-slate-800 p-4 shadow-md">
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
                <WorkoutButton workoutId={workout.workoutId} />
              </div>
            ))}
        </div>
      </div>
    );
  }
  return <div className="flex items-center justify-center">No Workouts</div>;
}

interface WorkoutButtonProps {
  workoutId: string;
}
function WorkoutButton({ workoutId }: WorkoutButtonProps) {
  const router = useRouter();
  const { mutate: sendToWorkout, isLoading: workoutLoading } =
    api.getWorkouts.startOrCreateNewWorkoutFromPrevious.useMutation({
      onSuccess(workoutId) {
        void router.push(`/workout/${workoutId}`);
      },
    });

  if (workoutLoading) {
    return (
      <div className=" mx-4 flex items-center justify-between">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <Button onClick={() => sendToWorkout({ priorWorkoutId: workoutId })}>
      Begin
    </Button>
  );
}
