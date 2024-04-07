import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import React, { useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import type {
  Workout,
  Exercise,
  exerciseSet,
  WorkoutPlan,
} from "@prisma/client";
import { NavBar } from "~/pages/components/navbar";
import PageLayout from "~/pages/components/pagelayout";
import LoadingSpinner from "./components/loadingspinner";
import MenuLayout from "./components/menulayout";
import PerformanceWarning from "./components/performancewarning";
import { Button } from "~/components/ui/button";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Liftr</title>
        <meta name="description" content="Nostr Workout Tracker" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <div className="mx-auto mt-4 flex max-w-6xl flex-row items-center justify-between gap-x-20 text-2xl font-semibold">
          <div className="ml-6">All Workouts</div>
          <NavBar />
        </div>

        <SignedIn>
          <br></br>
          <Content />
          <br></br>
          <div></div>
        </SignedIn>
        <SignedOut>
          {/* Signed out users get sign in button */}
          <SignInButton redirectUrl="home">
            <button className="rounded-full bg-white p-3 text-xl text-black">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </PageLayout>
    </>
  );
};

export default Home;

function Content() {
  return (
    <div className="flex w-full flex-col items-center">
      <Workouts />
    </div>
  );
}

function Workouts() {
  const { data: workoutPlans, isLoading: workoutsLoading } =
    api.getWorkouts.getPlanByUserId.useQuery();

  const [selectedPlan, setSelectedPlan] = useState<
    WorkoutPlan & {
      workouts: (Workout & {
        exercises: (Exercise & {
          sets: (exerciseSet & { priorSet: exerciseSet | null })[];
        })[];
      })[];
    }
  >();

  if (workoutsLoading) {
    return <LoadingSpinner />;
  }

  if (!workoutPlans || workoutPlans === undefined) {
    return <div>No Workout History</div>;
  }

  const handleButtonClick = (
    plan: WorkoutPlan & {
      workouts: (Workout & {
        exercises: (Exercise & {
          sets: (exerciseSet & { priorSet: exerciseSet | null })[];
        })[];
      })[];
    }
  ) => {
    setSelectedPlan(plan);
  };

  return (
    <div className="flex w-full flex-wrap pt-5">
      {selectedPlan && <DisplayPlan plan={selectedPlan} />}
      <div className="w-full">
        {!selectedPlan && (
          <div className="mb-4 text-center text-2xl font-bold ">
            Workout Plans:{" "}
          </div>
        )}
        {!selectedPlan && (
          <MenuLayout>
            {!selectedPlan &&
              workoutPlans.map((plan) => (
                <div
                  key={plan.planId}
                  className="my-2 flex w-full flex-row items-center justify-between px-4"
                >
                  <div className="text-lg font-semibold text-slate-100">
                    {plan.description}
                  </div>
                  <Button onClick={() => handleButtonClick(plan)}>
                    Select
                  </Button>
                </div>
              ))}
          </MenuLayout>
        )}

        {selectedPlan && (
          <div className="flex w-full items-center justify-center pb-10">
            <Button onClick={() => setSelectedPlan(undefined)}>Back</Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface DisplayPlanProps {
  plan:
    | (WorkoutPlan & {
        workouts: (Workout & {
          exercises: (Exercise & {
            sets: (exerciseSet & { priorSet: exerciseSet | null })[];
          })[];
        })[];
      })
    | undefined;
}

interface SortedWorkouts {
  Sunday: (Workout & {
    exercises: (Exercise & {
      sets: (exerciseSet & { priorSet: exerciseSet | null })[];
    })[];
  })[];
  Monday: (Workout & {
    exercises: (Exercise & {
      sets: (exerciseSet & { priorSet: exerciseSet | null })[];
    })[];
  })[];
  Tuesday: (Workout & {
    exercises: (Exercise & {
      sets: (exerciseSet & { priorSet: exerciseSet | null })[];
    })[];
  })[];
  Wednesday: (Workout & {
    exercises: (Exercise & {
      sets: (exerciseSet & { priorSet: exerciseSet | null })[];
    })[];
  })[];
  Thursday: (Workout & {
    exercises: (Exercise & {
      sets: (exerciseSet & { priorSet: exerciseSet | null })[];
    })[];
  })[];
  Friday: (Workout & {
    exercises: (Exercise & {
      sets: (exerciseSet & { priorSet: exerciseSet | null })[];
    })[];
  })[];
  Saturday: (Workout & {
    exercises: (Exercise & {
      sets: (exerciseSet & { priorSet: exerciseSet | null })[];
    })[];
  })[];
}

function DisplayPlan({ plan }: DisplayPlanProps) {
  const [workoutList, setWorkoutList] = useState<SortedWorkouts>();
  if (!plan) {
    return <div></div>;
  }

  function sortWorkoutsByDay(
    workouts: (Workout & {
      exercises: (Exercise & {
        sets: (exerciseSet & { priorSet: exerciseSet | null })[];
      })[];
    })[]
  ): SortedWorkouts {
    const sortedWorkouts: SortedWorkouts = {
      Sunday: [],
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    };
    for (const workout of workouts) {
      sortedWorkouts[workout.nominalDay as keyof SortedWorkouts].push(workout);
    }
    return sortedWorkouts;
  }

  if (!workoutList) {
    setWorkoutList(sortWorkoutsByDay(plan.workouts));
  }

  return (
    <div className="mx-auto max-w-3xl flex-col">
      {workoutList &&
        Object.keys(workoutList).map((day, idx) => (
          <div key={"base" + idx.toString()}>
            {workoutList[day as keyof typeof workoutList][0]?.description && (
              <div
                key={day}
                className="mb-4 flex flex-col rounded-md bg-slate-800 p-4 shadow-md"
              >
                <div className="mb-4 text-center text-3xl font-bold">{day}</div>
                <div
                  className="overflow-x-auto bg-slate-900"
                  style={{ maxWidth: "100vw" }}
                >
                  <table className="table-fixed whitespace-nowrap">
                    <thead>
                      <tr>
                        <th className="w-1/4">
                          {
                            workoutList[day as keyof typeof workoutList][0]
                              ?.description
                          }
                        </th>
                        {workoutList[day as keyof typeof workoutList].map(
                          (workout, workoutCount) => (
                            <th className="w-1/4" key={workout.workoutId}>
                              Week {workoutCount + 1}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {workoutList[
                        day as keyof typeof workoutList
                      ][0]?.exercises.map((exercise, index) => (
                        <tr key={index}>
                          <td className="border px-4 py-2">
                            {exercise.description}
                          </td>
                          {workoutList[day as keyof typeof workoutList].map(
                            (workout) => (
                              <td
                                className="border px-3 py-2"
                                key={workout.workoutId}
                              >
                                {workout.exercises[index]?.sets.map(
                                  (set, setIndex) => (
                                    <div
                                      className="flex items-center justify-between"
                                      key={set.setId}
                                    >
                                      <div>
                                        Set {setIndex + 1}: {set.weight}lbs x{" "}
                                        {set.reps} @ {set.rir} RIR
                                      </div>
                                      <div className="pl-2">
                                        <PerformanceWarning currentSet={set} />
                                      </div>
                                    </div>
                                  )
                                )}
                              </td>
                            )
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
