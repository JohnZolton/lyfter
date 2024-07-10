import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import React, { useState } from "react";
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
import { Skeleton } from "../components/ui/skeleton";
import SignedIn, { SignInButton, SignedOut } from "./components/auth";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Liftr</title>
        <meta name="description" content="Nostr Workout Tracker" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <NavBar title="All Workouts" />

        <SignedIn>
          <Content />
        </SignedIn>
        <SignedOut>
          <SignInButton />
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
    return (
      <div className="flex w-full flex-col justify-center gap-y-4 bg-slate-800 p-4 shadow-md">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
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
    <div className="w-full max-w-3xl flex-col">
      {workoutList &&
        Object.keys(workoutList).map((day, idx) => (
          <div key={"base" + idx.toString()}>
            {workoutList[day as keyof typeof workoutList][0]?.description && (
              <div
                key={day}
                className="mb-4 flex flex-col rounded-md bg-slate-800 py-2 shadow-md"
              >
                <div className="mb-4 text-center text-3xl font-bold">{day}</div>
                <div className="mb-4 px-4 text-2xl font-bold">
                  {workoutList[day as keyof typeof workoutList][0]?.description}
                </div>
                <div
                  className="flex items-start overflow-x-auto bg-slate-900 align-top"
                  style={{ maxWidth: "100vw" }}
                >
                  <table className="table-fixed justify-start whitespace-nowrap">
                    <thead>
                      <tr>
                        {workoutList[day as keyof typeof workoutList]
                          .sort((a, b) => a.workoutNumber! - b.workoutNumber!)
                          .map((workout, workoutCount) => (
                            <th colSpan={2} key={workout.workoutId}>
                              Week {workoutCount + 1}
                            </th>
                          ))}
                      </tr>
                      <tr>
                        {workoutList[day as keyof typeof workoutList].map(
                          (workout, workoutCount) => (
                            <React.Fragment key={workoutCount}>
                              <th className="w-1/2">Exercise</th>
                              <th className="w-1/2">Sets</th>
                            </React.Fragment>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="">
                      <tr className="align-top">
                        {workoutList[day as keyof typeof workoutList].map(
                          (workout) => (
                            <td colSpan={2} key={workout.workoutId}>
                              <table className="w-full">
                                <tbody>
                                  {workout.exercises
                                    .sort(
                                      (a, b) =>
                                        a.exerciseOrder - b.exerciseOrder
                                    )
                                    .map((exercise) => (
                                      <tr key={exercise.exerciseId}>
                                        <td className="w-1/2 border p-2 align-top">
                                          {exercise.description}
                                        </td>
                                        <td className="w-1/2 border">
                                          {exercise.sets
                                            .sort(
                                              (a, b) =>
                                                a.setNumber - b.setNumber
                                            )
                                            .map((set, idx) => (
                                              <div
                                                key={idx}
                                                className="flex flex-row justify-between p-1"
                                              >
                                                <div>
                                                  {set.weight || 0} lbs x{" "}
                                                  {set.reps || 0}
                                                </div>
                                                <div className="px-2">
                                                  <PerformanceWarning
                                                    currentSet={set}
                                                  />
                                                </div>
                                              </div>
                                            ))}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </td>
                          )
                        )}
                      </tr>
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
