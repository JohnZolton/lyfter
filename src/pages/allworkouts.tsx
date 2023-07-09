import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";
import React, {
  useState,
  useTransition,
  useRef,
  useEffect,
  HtmlHTMLAttributes,
} from "react";
import {
  ClerkProvider,
  RedirectToOrganizationProfile,
  RedirectToSignIn,
  useUser,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { userAgent } from "next/server";
import { userInfo } from "os";
import { boolean, record } from "zod";
import type {
  User,
  Workout,
  WorkoutPlan,
  ActualWorkout,
  ActualExercise,
  exerciseSet,
  WorkoutPlanTwo,
} from "@prisma/client";
import { prisma } from "~/server/db";
import { empty } from "@prisma/client/runtime";
import { SourceTextModule } from "vm";
import { v4 } from "uuid";
import { existsSync } from "fs";
import { create } from "domain";
import { useRouter } from "next/router";
import { describe } from "node:test";
import { TEMPORARY_REDIRECT_STATUS } from "next/dist/shared/lib/constants";
import { faSortNumericDown } from "@fortawesome/free-solid-svg-icons";
import { NavBar } from "~/pages/components/navbar";
import { PageLayout } from "~/pages/components/pagelayout";
import LoadingSpinner from "./components/loadingspinner";

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
  const user = useUser();

  return (
    <div>
      <Workouts />
    </div>
  );
}

function Workouts() {
  const { data: workoutPlans, isLoading: workoutsLoading } =
    api.getWorkouts.getPlanByUserId.useQuery();

  const [selectedPlan, setSelectedPlan] = useState<
    WorkoutPlanTwo & {
      workouts: (ActualWorkout & {
        exercises: (ActualExercise & {
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
    plan: WorkoutPlanTwo & {
      workouts: (ActualWorkout & {
        exercises: (ActualExercise & {
          sets: (exerciseSet & { priorSet: exerciseSet | null })[];
        })[];
      })[];
    }
  ) => {
    setSelectedPlan(plan);
  };

  return (
    <div className="flex flex-wrap">
      <DisplayPlan plan={selectedPlan} />
      <div>
        {!selectedPlan &&
          workoutPlans.map((plan) => (
            <div key={plan.planId}>
              <h2>
                {plan.description}{" "}
                <button onClick={() => handleButtonClick(plan)}>Select</button>
              </h2>
            </div>
          ))}
      </div>
    </div>
  );
}

interface DisplayPlanProps {
  plan:
    | (WorkoutPlanTwo & {
        workouts: (ActualWorkout & {
          exercises: (ActualExercise & {
            sets: (exerciseSet & { priorSet: exerciseSet | null })[];
          })[];
        })[];
      })
    | undefined;
}

interface SortedWorkouts {
  Sunday: (ActualWorkout & {
    exercises: (ActualExercise & {
      sets: (exerciseSet & { priorSet: exerciseSet | null })[];
    })[];
  })[];
  Monday: (ActualWorkout & {
    exercises: (ActualExercise & {
      sets: (exerciseSet & { priorSet: exerciseSet | null })[];
    })[];
  })[];
  Tuesday: (ActualWorkout & {
    exercises: (ActualExercise & {
      sets: (exerciseSet & { priorSet: exerciseSet | null })[];
    })[];
  })[];
  Wednesday: (ActualWorkout & {
    exercises: (ActualExercise & {
      sets: (exerciseSet & { priorSet: exerciseSet | null })[];
    })[];
  })[];
  Thursday: (ActualWorkout & {
    exercises: (ActualExercise & {
      sets: (exerciseSet & { priorSet: exerciseSet | null })[];
    })[];
  })[];
  Friday: (ActualWorkout & {
    exercises: (ActualExercise & {
      sets: (exerciseSet & { priorSet: exerciseSet | null })[];
    })[];
  })[];
  Saturday: (ActualWorkout & {
    exercises: (ActualExercise & {
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
    workouts: (ActualWorkout & {
      exercises: (ActualExercise & {
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
    <div className="mx-auto flex max-w-4xl flex-col">
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
                                className="border px-4 py-2"
                                key={workout.workoutId}
                              >
                                {workout.exercises[index]?.sets.map(
                                  (set, setIndex) => (
                                    <div
                                      key={set.setId}
                                      className={
                                        (set.priorSet &&
                                          set.priorSet?.weight > set.weight) ||
                                        (set.priorSet &&
                                          set.priorSet?.reps > set.reps)
                                          ? "bg-red-500"
                                          : ""
                                      }
                                    >
                                      <p>
                                        Set {setIndex + 1}: {set.weight}lbs x{" "}
                                        {set.reps} @ {set.rir} RIR
                                      </p>
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
