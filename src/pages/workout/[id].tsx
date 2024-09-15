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
import { format } from "path";

const Home: NextPage = () => {
  const router = useRouter();
  const workoutId = router.query.id as string;
  const { workout, updateWorkout } = useWorkoutStore();

  useEffect(() => {
    function handleRouteChange() {
      updateWorkout(undefined);
    }
    router.events.on("routeChangeStart", handleRouteChange);
    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [router, updateWorkout]);

  const { mutate: getWorkout } = api.getWorkouts.getWorkoutById.useMutation({
    onSuccess: (gotWorkout) => {
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
          <div className="mt-10 flex flex-row items-center justify-center">
            <LoadingSpinner />
          </div>
        </SignedIn>
        <SignedOut>
          <div className="mt-14 flex flex-row items-center justify-center">
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
  const { updateWorkout } = useWorkoutStore();
  function handleEndWorkout() {
    endWorkout({ workoutId: todaysWorkout.workout.workoutId });
    updateWorkout(undefined);
    void router.push("/home");
  }

  function shareToNostr() {
    let formattedString = `Workout Completed!\n\n${
      todaysWorkout.workout.description
    } - Week ${todaysWorkout.workout.workoutNumber ?? ""}\n\n`;
    completedWorkout.forEach((exercise) => {
      formattedString += `${exercise.description}\n`;
      exercise.sets.forEach((set, index) => {
        const goals = set.targetReps !== null && set.targetWeight !== null;
        const metTarget =
          set.reps !== null &&
          set.targetReps !== null &&
          set.targetWeight !== null &&
          set.weight !== null &&
          set.reps !== null &&
          set.reps >= set.targetReps &&
          set.weight >= set.targetWeight;
        if (
          todaysWorkout.workout.workoutNumber &&
          todaysWorkout.workout.workoutNumber > 1
        ) {
          const emoji = metTarget ? "✅" : "❌";
          formattedString += `${set.weight ?? ""} x ${
            set.reps ?? ""
          } ${emoji} (${set.targetWeight ?? ""} x ${set.targetReps ?? ""} 🎯)`;
        } else {
          formattedString += `${set.weight ?? ""} x ${set.reps ?? ""}`;
        }
        formattedString += "\n";
      });
      formattedString += "\n";
    });
    formattedString += "\nliftr.club";
    console.log(formattedString);
    const isLiveMode = process.env.NODE_ENV === "production";
    const baseUrl = "https://www.liftr.club";
    const callbackUrl = `${
      isLiveMode ? baseUrl : window.location.origin
    }/nostr-publish-callback?event=`;

    const event = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      content: formattedString,
    };

    const encodedJson = encodeURIComponent(JSON.stringify(event));
    const signerUrl = `nostrsigner:${encodedJson}?compressionType=none&returnType=event&type=sign_event&callbackUrl=${callbackUrl}`;

    window.open(signerUrl, "_blank");
    void router.push("/home");
  }
  const completedWorkout = todaysWorkout.workout.exercises
    .filter((exercise) =>
      exercise.sets.some((set) => set.reps !== null && set.reps > 0)
    )
    .map((exercise) => ({
      ...exercise,
      sets: exercise.sets.filter((set) => set.reps !== null && set.reps > 0),
    }));

  return (
    <div className="flex flex-col items-center">
      <WorkoutDisplay3 workoutPlan={todaysWorkout.workout} />
      <div className="mt-3">
        {!workoutComplete && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant={"destructive"}>End Workout</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share to Nostr?</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                <div className="flex w-full flex-col items-center justify-center">
                  <div>
                    <div className="">
                      <span className="font-semibold">
                        {todaysWorkout.workout.description}
                      </span>
                      - Week {todaysWorkout.workout.workoutNumber}
                    </div>
                    {completedWorkout.map((exercise) => (
                      <div
                        key={`endDisplay-${exercise.exerciseId}`}
                        className="my-2 flex flex-col"
                      >
                        <div className="font-semibold">
                          {exercise.description}
                        </div>
                        <div>
                          {exercise.sets.map((set) => (
                            <div key={`endSet-${set.setId}`}>
                              {set.weight} lbs x {set.reps} (target:{" "}
                              {set.targetReps} x {set.targetWeight})
                            </div>
                          ))}
                        </div>
                        <div>liftr.club</div>
                      </div>
                    ))}
                  </div>
                  <DialogClose asChild>
                    <div className="flex w-full flex-col items-center justify-center gap-y-4">
                      <div className="flex w-full flex-row items-center justify-between px-10">
                        <Button onClick={() => shareToNostr()}>Share</Button>
                        <Button type="button" variant="destructive">
                          End
                        </Button>
                      </div>
                    </div>
                  </DialogClose>
                </div>
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
