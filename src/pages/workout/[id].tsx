import { type NextPage } from "next";
import { api } from "~/utils/api";

import React, { useState, useEffect } from "react";

import type { Workout, Exercise, exerciseSet } from "@prisma/client";
import { NavBar } from "~/pages/components/navbar";
import LoadingSpinner from "../components/loadingspinner";
import WorkoutDisplay3 from "../components/workoutdisplay";
import { Button } from "../../components/ui/button";
import { useRouter } from "next/router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "~/components/ui/dialog";
import SignedIn, { SignInButton, SignedOut } from "../components/auth";
import useWorkoutStore, { fullWorkout } from "~/lib/store";

const Home: NextPage = () => {
  const router = useRouter();
  const workoutId = router.query.id as string;
  const { workout, updateWorkout, addExercise, removeWorkout } =
    useWorkoutStore();

  const { mutate: getWorkout } = api.getWorkouts.getWorkoutById.useMutation({
    onSuccess: (gotWorkout) => {
      console.log("got workout");
      console.log(gotWorkout);
      updateWorkout({ workout: gotWorkout.workout });
    },
  });

  useEffect(() => {
    getWorkout({ workoutId: workoutId });
  }, [workoutId, getWorkout]);

  function updateTitleDay(description: string, newDay: string) {
    if (workout) {
      const newWorkout = {
        ...workout,
        description: description,
        nominalDay: newDay,
      };
      updateWorkout(newWorkout);
    }
  }

  if (!workout || workout === undefined) {
    return (
      <>
        <NavBar
          workout={workout}
          title="Workout"
          updateTitleDay={updateTitleDay}
        />
        <SignedIn>
          <div className="mt-8 flex flex-row items-center justify-center">
            <LoadingSpinner />
          </div>
        </SignedIn>
        <SignedOut>
          <div className="mt-10 flex flex-row items-center justify-center">
            <SignInButton />
          </div>
        </SignedOut>
      </>
    );
  }

  return (
    <>
      <NavBar
        workout={workout}
        title={workout.workout.description}
        subtitle={workout.workout.nominalDay}
        updateTitleDay={updateTitleDay}
      />
      <SignedIn>
        <WorkoutUi todaysWorkout={workout} setTodaysWorkout={updateWorkout} />
      </SignedIn>
      <div className="mt-10 flex flex-row items-center justify-center">
        <SignedOut>
          <Button>Sign in</Button>
        </SignedOut>
      </div>
    </>
  );
};
interface WorkoutUiProps {
  todaysWorkout: fullWorkout;
  setTodaysWorkout: (workout: fullWorkout) => void;
}

function WorkoutUi({ todaysWorkout, setTodaysWorkout }: WorkoutUiProps) {
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const router = useRouter();
  const { mutate: endWorkout } = api.getWorkouts.endWorkout.useMutation();
  function handleEndWorkout() {
    endWorkout({ workoutId: todaysWorkout.workout.workoutId });
    void router.push("/home");
  }
  const { workout, updateWorkout, addExercise, removeWorkout } =
    useWorkoutStore();

  return (
    <div className="flex flex-col items-center pb-8">
      <WorkoutDisplay3 workoutPlan={todaysWorkout.workout} />
      <div className="mt-3">
        {!workoutComplete && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant={"destructive"}>End Workout</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>End Workout</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                <DialogClose asChild>
                  <div className="flex w-full flex-col items-center justify-center gap-y-4">
                    <div className="flex w-full flex-row items-center justify-between px-10">
                      <Button
                        variant={"destructive"}
                        onClick={() => handleEndWorkout()}
                      >
                        Confirm
                      </Button>
                      <Button type="button" variant="secondary">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogClose>
              </DialogDescription>
            </DialogContent>
          </Dialog>
        )}
        {workoutComplete && (
          <Button variant={"destructive"} onClick={() => handleEndWorkout()}>
            End Workout
          </Button>
        )}
      </div>
    </div>
  );
}

export default Home;
