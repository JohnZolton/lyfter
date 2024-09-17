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
import { Textarea } from "~/components/ui/textarea";
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
    const isLiveMode = process.env.NODE_ENV === "production";
    const baseUrl = "https://www.liftr.club";
    const callbackUrl = `${
      isLiveMode ? baseUrl : window.location.origin
    }/nostr-publish-callback?event=`;

    const event = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      content: sharedText,
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

  function formatWorkoutString() {
    let formattedString = `Workout Completed!\n${
      todaysWorkout.workout.description
    } - Week ${
      todaysWorkout.workout.workoutNumber
        ? todaysWorkout.workout.workoutNumber + 1
        : 1
    }\n\n`;

    completedWorkout.forEach((exercise) => {
      formattedString += `${exercise.description}\n`;
      exercise.sets.forEach((set) => {
        const metTarget =
          set.reps !== null &&
          set.priorSet &&
          set.priorSet.reps !== null &&
          set.priorSet.weight !== null &&
          set.weight !== null &&
          set.reps !== null &&
          set.reps >= set.priorSet.reps &&
          set.weight >= set.priorSet.weight;

        if (
          todaysWorkout.workout.workoutNumber &&
          todaysWorkout.workout.workoutNumber >= 1
        ) {
          const emoji = metTarget ? "✅" : "❌";
          formattedString += `${set.weight ?? 0} x ${
            set.reps ?? ""
          } ${emoji} (${set.priorSet?.weight ?? 0} x ${
            set.priorSet?.reps ?? ""
          } 🎯)`;
        } else {
          formattedString += `${set.weight ?? ""} x ${set.reps ?? ""}`;
        }
        formattedString += "\n";
      });
      formattedString += "\n";
    });

    formattedString += "liftr.club";
    return formattedString;
  }

  const [sharedText, setSharedText] = useState("");

  useEffect(() => {
    setSharedText(formatWorkoutString());
  }, [todaysWorkout, completedWorkout]);

  return (
    <div className="flex flex-col items-center">
      <WorkoutDisplay3 workoutPlan={todaysWorkout.workout} />
      <div className="mt-3">
        {!workoutComplete && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant={"destructive"}>End Workout</Button>
            </DialogTrigger>
            <DialogContent className="min-h-full">
              <div className="flex h-full flex-col">
                <DialogHeader>
                  <DialogTitle>Share to Nostr?</DialogTitle>
                </DialogHeader>
                <DialogDescription className="flex-grow overflow-hidden">
                  <div className="flex h-full flex-col p-6">
                    <Textarea
                      readOnly
                      className="mb-6 flex-grow overflow-auto"
                      value={sharedText}
                    />
                    <DialogClose asChild>
                      <div className="flex w-full flex-col items-center justify-center gap-y-4">
                        <div className="flex w-full flex-row items-center justify-between px-10">
                          <Button onClick={() => shareToNostr()}>Share</Button>
                          <Button type="button" variant="destructive">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogClose>
                  </div>
                </DialogDescription>
              </div>
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
