import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, useEffect } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import type {
  ActualWorkout,
  ActualExercise,
  exerciseSet,
} from "@prisma/client";
import { v4 } from "uuid";
import { NavBar } from "~/pages/components/navbar";
import PageLayout from "~/pages/components/pagelayout";
import LoadingSpinner from "./components/loadingspinner";
import SetDisplay from "./components/setdisplay";
import WorkoutDisplay3 from "./components/workoutdisplay";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Lyfter</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <NavBar />
        <div className="">
          <SignedIn>
            <WorkoutUiHandler />
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




function WorkoutUiHandler() {
  const [workoutPlan, setWorkoutPlan] = useState<
    | (ActualWorkout & {
        exercises: (ActualExercise & {
          sets: (exerciseSet & {
            priorSet?: exerciseSet | null;
          })[];
        })[];
      })[]
    | undefined
  >();
  const [todaysWorkout, setTodaysWorkout] = useState<
    | (ActualWorkout & {
        exercises: (ActualExercise & {
          sets: (exerciseSet & {
            priorSet?: exerciseSet | null;
          })[];
        })[];
      })
    | undefined
  >();

  const { data: userWorkouts, isLoading } =
    api.getWorkouts.getUniqueWeekWorkouts.useQuery();


  useEffect(() => {
    if (userWorkouts && !todaysWorkout && !workoutPlan && userWorkouts.workoutPlan) {
      const uniqueWorkouts = new Set();
      const workoutsToDisplay: (ActualWorkout & {
        exercises: (ActualExercise & {
          sets: (exerciseSet & {
            priorSet?: exerciseSet | null;
          })[];
        })[];
      })[] = [];
      userWorkouts.workoutPlan.workouts.map((workout) => {
        console.log(workout);
        if (!uniqueWorkouts.has(workout.originalWorkoutId)) {
          uniqueWorkouts.add(workout.originalWorkoutId);
          workoutsToDisplay.push(workout);
        }
      });

      setWorkoutPlan(sortWorkoutsByNominalDay(workoutsToDisplay));
    }
    if (todaysWorkout && workoutPlan){
      //on todaysWorkout change, need to update parent prop workoutPlan
      const workoutIndex = workoutPlan.findIndex(workout => workout.workoutId === todaysWorkout.workoutId)
      if (workoutIndex !== -1 && workoutPlan){
        const updatedPlan = [
          ...workoutPlan.splice(0, workoutIndex),
          todaysWorkout,
          ...workoutPlan.splice(workoutIndex+1),
        ]
        setWorkoutPlan(updatedPlan)
        console.log("plan prop updated")
      }
    }

  }, [userWorkouts, todaysWorkout]);

  function sortWorkoutsByNominalDay(
    workouts: (ActualWorkout & {
      exercises: (ActualExercise & {
        sets: (exerciseSet & {
          priorSet?: exerciseSet | null;
        })[];
      })[];
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
        <div className="mb-4 text-center text-2xl font-bold">
          Current Workouts:
        </div>
        <SelectDay
          userWorkoutPlan={workoutPlan}
          setTodaysWorkout={setTodaysWorkout}
        />
      </div>
    );
  }
  if (todaysWorkout) {
    return (
      <div className="rounded-lg  shadow-md">
        <WorkoutUi
          endWorkout={endWorkout}
          todaysWorkout={todaysWorkout}
          setTodaysWorkout={setTodaysWorkout}
        />
      </div>
    );
  } else {
    return <div>Something went wrong</div>;
  }
}
interface WorkoutUiProps {
  todaysWorkout: ActualWorkout & {
    exercises: (ActualExercise & {
      sets: (exerciseSet & {
        priorSet?: exerciseSet | null;
      })[];
    })[];
  };
  endWorkout: React.Dispatch<React.SetStateAction<string>>;
  setTodaysWorkout: React.Dispatch<
    React.SetStateAction<
      | (ActualWorkout & {
          exercises: (ActualExercise & {
            sets: (exerciseSet & {
              priorSet?: exerciseSet | null;
            })[];
          })[];
        })
      | undefined
    >
  >;
}

function WorkoutUi({
  todaysWorkout,
  setTodaysWorkout,
  endWorkout,
}: WorkoutUiProps) {
  const today = new Date();

  const { mutate: saveWorkout } =
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

          const newWorkout = {
            ...todaysWorkout,
            date: today,

            priorWorkoutId:
              todaysWorkout.originalWorkoutId !== null
                ? todaysWorkout.originalWorkoutId
                : todaysWorkout.workoutId,

            planId: todaysWorkout.planId ?? "none",
            workoutNumber: todaysWorkout.workoutNumber ? +1 : 0,
            exercises: todaysWorkout.exercises.map((exercise) => ({
              ...exercise,
              description: exercise.description,
            })),
          };
          saveWorkout(newWorkout);
        }
      }
    }
  }, [todaysWorkout]);

  return (
    <div className="flex flex-col items-center rounded-lg  ">
      <WorkoutDisplay3
        workoutPlan={todaysWorkout}
        setWorkoutPlan={setTodaysWorkout}
      />
      <button
        className="mb-4 mt-4 rounded bg-red-600 px-2 py-1 font-bold  hover:bg-red-700"
        onClick={() => endWorkout("")}
      >
        End Workout
      </button>
    </div>
  );
}

interface SelectDayProps {
  setTodaysWorkout: React.Dispatch<
    React.SetStateAction<
      | (ActualWorkout & {
          exercises: (ActualExercise & {
            sets: (exerciseSet & {
              priorSet?: exerciseSet | null;
            })[];
          })[];
        })
      | undefined
    >
  >;

  userWorkoutPlan:
    | (ActualWorkout & {
        exercises: (ActualExercise & {
          sets: (exerciseSet & {
            priorSet?: exerciseSet | null;
          })[];
        })[];
      })[]
    | undefined;
}

function SelectDay({ userWorkoutPlan, setTodaysWorkout }: SelectDayProps) {
  return (
    <div className="rounded-lg bg-slate-800 p-4  shadow-md">
      {userWorkoutPlan &&
        userWorkoutPlan.map((workout) => (
          <div
            key={workout.workoutId}
            className="my-2 flex items-center justify-between"
          >
            <div className="text-lg font-semibold text-slate-100">
              {workout.description}: {workout.nominalDay}
            </div>
            <button
              value={workout.nominalDay}
              className="m-1 inline-flex items-center rounded bg-green-600 px-2 py-1 font-bold  hover:bg-green-500"
              onClick={() => setTodaysWorkout(workout)}
            >
              Begin
            </button>
          </div>
        ))}
    </div>
  );
}

function createUniqueId(): string {
  return v4();
}

const emptySet = { rir: 3, reps: 5, weight: 0 };

