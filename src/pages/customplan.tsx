import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, useRef, useEffect } from "react";

import { v4 } from "uuid";
import { NavBar } from "~/pages/components/navbar";
import PageLayout from "~/pages/components/pagelayout";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "~/components/ui/dialog";
import { useRouter } from "next/router";
import SignedIn, { SignInButton, SignedOut } from "./components/auth";
import {
  CardHeader,
  Card,
  CardContent,
  CardDescription,
} from "~/components/ui/card";

type ExerciseTemplate = {
  id: string;
  description: string;
  sets: number;
  muscleGroup: string;
};

type WorkoutTemplate = {
  description: string;
  nominalDay: string;
  workoutId: string;
  exercises: ExerciseTemplate[];
};

type WorkoutPlan = {
  description: string | undefined;
  workouts: WorkoutTemplate[];
};
const emptyWorkoutPlan: WorkoutPlan = {
  description: "",
  workouts: [
    {
      description: "",
      nominalDay: "",
      workoutId: createUniqueId(),
      exercises: [
        {
          id: createUniqueId(),
          description: "",
          sets: 0,
          muscleGroup: "",
        },
      ],
    },
  ],
};

const Home: NextPage = () => {
  return (
    <>
      <PageLayout>
        <NavBar title="New Custom Plan" />
        <div className="w-full">
          <SignedIn>
            <WorkoutPlanForm />
          </SignedIn>
          <SignedOut>
            <div className="mt-14 flex flex-row items-center justify-center">
              <SignInButton />
            </div>
          </SignedOut>
        </div>
      </PageLayout>
    </>
  );
};

export default Home;

function createUniqueId(): string {
  return v4();
}

function WorkoutPlanForm() {
  const utils = api.useContext();
  const router = useRouter();
  const [planDescription, setPlanDescription] = useState("");
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan>(emptyWorkoutPlan);
  const [isReady, setIsReady] = useState(false);
  const { mutate: savePlan } = api.getWorkouts.newTestPlanTwo.useMutation({
    onSuccess: async () => {
      await utils.getWorkouts.getUniqueWeekWorkouts.invalidate();
      void router.push({
        pathname: "/home",
        query: { refetch: true },
      });
    },
  });

  useEffect(() => {
    setIsReady(isPlanReady(workoutPlan));
  }, [workoutPlan]);
  useEffect(() => {
    setWorkoutPlan((prevPlan) => {
      return {
        ...prevPlan,
        description: planDescription,
      };
    });
  }, [planDescription]);

  function isPlanReady(plan: WorkoutPlan): boolean {
    if (!planDescription || planDescription.trim() === "") {
      return false;
    }

    for (const workout of plan.workouts) {
      if (!workout.description || workout.description.trim() === "") {
        return false;
      }
      if (!workout.nominalDay || workout.nominalDay.trim() === "") {
        return false;
      }
      for (const exercise of workout.exercises) {
        if (!exercise.description || exercise.description.trim() === "") {
          return false;
        }
        if (exercise.sets <= 0 || Number.isNaN(exercise.sets)) {
          return false;
        }
        if (!exercise.muscleGroup || exercise.muscleGroup.trim() === "") {
          return false;
        }
      }
    }
    return true;
  }

  const inputRef = useRef<HTMLInputElement | null>(null);

  function addWorkout() {
    const newWorkout: WorkoutTemplate = {
      description: "",
      nominalDay: "",
      workoutId: createUniqueId(),
      exercises: [
        {
          id: createUniqueId(),
          description: "",
          sets: 0,
          muscleGroup: "",
        },
      ],
    };
    setWorkoutPlan((prevPlan) => {
      if (prevPlan) {
        return {
          ...prevPlan,
          workouts: [...prevPlan.workouts, newWorkout],
        };
      } else {
        return {
          description: planDescription,
          workouts: [newWorkout],
        };
      }
    });
  }

  function updateWorkoutDescription(
    workoutId: string,
    description: string,
    nominalDay: string
  ) {
    setWorkoutPlan((prevPlan) => {
      if (prevPlan) {
        const updatedWorkouts = prevPlan.workouts.map((workout) => {
          if (workout.workoutId === workoutId) {
            return { ...workout, description, nominalDay };
          }
          return workout;
        });
        return { ...prevPlan, workouts: updatedWorkouts };
      }
      return prevPlan;
    });
  }

  function addExercise(workoutId: string) {
    const newExercise: ExerciseTemplate = {
      id: createUniqueId(),
      description: "",
      sets: 1,
      muscleGroup: "",
    };

    setWorkoutPlan((prevPlan) => {
      if (prevPlan) {
        const updatedWorkouts = prevPlan.workouts.map((workout) => {
          if (workout.workoutId === workoutId) {
            return {
              ...workout,
              exercises: [...workout.exercises, newExercise],
            };
          }
          return workout;
        });
        return { ...prevPlan, workouts: updatedWorkouts };
      }
      return prevPlan;
    });
  }
  function removeWorkout(workoutId: string) {
    setWorkoutPlan((prevPlan) => {
      if (prevPlan) {
        const updatedWorkouts = prevPlan.workouts.filter(
          (workout) => workout.workoutId !== workoutId
        );
        return { ...prevPlan, workouts: updatedWorkouts };
      }
      return prevPlan;
    });
  }
  function removeExercise(workoutId: string, exerciseId: string) {
    setWorkoutPlan((prevPlan) => {
      if (prevPlan) {
        const updatedWorkouts = prevPlan.workouts.map((workout) => {
          if (workout.workoutId === workoutId) {
            const updatedExercises = workout.exercises.filter(
              (exercise) => exercise.id !== exerciseId
            );
            return { ...workout, exercises: updatedExercises };
          }
          return workout;
        });
        return { ...prevPlan, workouts: updatedWorkouts };
      }
      return prevPlan;
    });
  }
  function updateExercise(
    workoutId: string,
    exerciseId: string,
    updatedExercise: ExerciseTemplate
  ) {
    setWorkoutPlan((prevPlan) => {
      if (prevPlan) {
        const updatedWorkouts = prevPlan.workouts.map((workout) => {
          if (workout.workoutId === workoutId) {
            const updatedExercises = workout.exercises.map((exercise) => {
              if (exercise.id === exerciseId) {
                return updatedExercise;
              }
              return exercise;
            });
            return { ...workout, exercises: updatedExercises };
          }
          return workout;
        });
        return { ...prevPlan, workouts: updatedWorkouts };
      }
      return prevPlan;
    });
  }

  return (
    <div className="mt-5 flex w-full flex-col items-center justify-center gap-y-2">
      <Card className="">
        <CardHeader>
          <Input
            required
            ref={inputRef}
            value={planDescription}
            onChange={(event) => setPlanDescription(event.target.value)}
            placeholder="Plan Title"
          ></Input>
        </CardHeader>
      </Card>
      <div className=" w-full flex-col gap-x-4 md:flex md:flex-row">
        {workoutPlan?.workouts.map((workout, index) => (
          <WorkoutDisplay
            workout={workout}
            key={workout.workoutId}
            onDescriptionChange={(description, nominalDay) =>
              updateWorkoutDescription(
                workout.workoutId,
                description,
                nominalDay
              )
            }
            onDeleteWorkout={(workoutId) => removeWorkout(workoutId)}
            onRemoveExercise={(exerciseId) =>
              removeExercise(workout.workoutId, exerciseId)
            }
            onExerciseChange={(exerciseId, updatedExercise) =>
              updateExercise(workout.workoutId, exerciseId, updatedExercise)
            }
            onAddExercise={() => addExercise(workout.workoutId)}
          />
        ))}
      </div>
      <div className="mt-3 flex max-w-xl flex-row justify-between gap-x-4 px-3">
        <Button onClick={addWorkout}>Add Workout</Button>
        <Button disabled={!isReady} onClick={() => savePlan(workoutPlan)}>
          Save Plan
        </Button>
      </div>
    </div>
  );
}

interface WorkoutDisplayProps {
  workout: WorkoutTemplate;
  onDescriptionChange: (description: string, nominalDay: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onDeleteWorkout: (workoutId: string) => void;
  onAddExercise: () => void;
  onExerciseChange: (
    exerciseId: string,
    updatedExercise: ExerciseTemplate
  ) => void;
}
function WorkoutDisplay({
  workout,
  onDescriptionChange,
  onAddExercise,
  onExerciseChange,
  onDeleteWorkout,
  onRemoveExercise,
}: WorkoutDisplayProps) {
  const [workoutDay, setWorkoutDay] = useState("");

  return (
    <Card className="">
      <CardHeader>
        <Input
          value={workout.description}
          onChange={(event) =>
            onDescriptionChange(event.target.value, workoutDay)
          }
          className=""
          type="text"
          placeholder="Workout Title"
        />
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-row items-center justify-between gap-x-2">
          <Select
            required
            onValueChange={(value) => {
              setWorkoutDay(value);
              onDescriptionChange(workout.description, value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Day" />
            </SelectTrigger>
            <SelectContent
              ref={(ref) => {
                if (!ref) return;
                ref.ontouchstart = (e) => {
                  e.preventDefault();
                };
              }}
            >
              <SelectGroup>
                <SelectLabel>Day</SelectLabel>
                <SelectItem value="Monday">Monday</SelectItem>
                <SelectItem value="Tuesday">Tuesday</SelectItem>
                <SelectItem value="Wednesday">Wednesday</SelectItem>
                <SelectItem value="Thursday">Thursday</SelectItem>
                <SelectItem value="Friday">Friday</SelectItem>
                <SelectItem value="Saturday">Saturday</SelectItem>
                <SelectItem value="Sunday">Sunday</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        {workout.exercises.map((exercise) => (
          <ExerciseForm
            exercise={exercise}
            key={exercise.id}
            workoutId={workout.workoutId}
            onRemoveExercise={(exerciseId) => onRemoveExercise(exerciseId)}
            onExerciseChange={(updatedExercise) =>
              onExerciseChange(exercise.id, updatedExercise)
            }
          />
        ))}
        <div className="flex flex-row justify-between pt-4 md:gap-x-4">
          <Button onClick={onAddExercise}>Add Exercise</Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant={"destructive"}>Delete Workout</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Workout?</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                <div className="flex flex-row items-center justify-between gap-y-3 px-10">
                  <Button
                    variant={"destructive"}
                    onClick={() => onDeleteWorkout(workout.workoutId)}
                  >
                    Delete Workout
                  </Button>
                  <DialogClose>
                    <Button>Cancel</Button>
                  </DialogClose>
                </div>
              </DialogDescription>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

interface ExerciseFormProps {
  exercise: ExerciseTemplate;
  onExerciseChange: (updatedExercise: ExerciseTemplate) => void;
  onRemoveExercise: (exerciseId: string) => void;
  workoutId: string;
}

function ExerciseForm({
  exercise,
  workoutId,
  onExerciseChange,
  onRemoveExercise,
}: ExerciseFormProps) {
  const [numSets, setNumSets] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");

  function handleExerciseChange(
    description: string,
    setNumber: string,
    muscle: string
  ) {
    onExerciseChange({
      ...exercise,
      description,
      sets: parseInt(setNumber),
      muscleGroup: muscle,
    });
  }
  return (
    <div key={exercise.id} className="flex flex-col gap-y-1">
      <div className="my-1 flex flex-row items-center gap-x-2">
        <Input
          value={exercise.description}
          onChange={(event) =>
            handleExerciseChange(event.target.value, numSets, muscleGroup)
          }
          className=""
          type="text"
          placeholder="Exercise Title"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant={"destructive"}>Delete</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Exercise?</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              <div className="flex flex-row items-center justify-between gap-y-3 px-10">
                <Button
                  variant={"destructive"}
                  onClick={() => onRemoveExercise(exercise.id)}
                >
                  Delete
                </Button>
                <DialogClose>
                  <Button>Cancel</Button>
                </DialogClose>
              </div>
            </DialogDescription>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-row justify-between gap-x-2">
        <Select
          required
          onValueChange={(value) => {
            setNumSets(value);
            handleExerciseChange(exercise.description, value, muscleGroup);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="# of sets" />
          </SelectTrigger>
          <SelectContent
            ref={(ref) => {
              if (!ref) return;
              ref.ontouchstart = (e) => {
                e.preventDefault();
              };
            }}
          >
            <SelectGroup>
              <SelectLabel>Sets</SelectLabel>
              <SelectItem value="1">1 set</SelectItem>
              <SelectItem value="2">2 sets</SelectItem>
              <SelectItem value="3">3 sets</SelectItem>
              <SelectItem value="4">4 sets</SelectItem>
              <SelectItem value="5">5 sets</SelectItem>
              <SelectItem value="6">6 sets</SelectItem>
              <SelectItem value="7">7 sets</SelectItem>
              <SelectItem value="8">8 sets</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          required
          onValueChange={(value) => {
            setMuscleGroup(value);
            handleExerciseChange(exercise.description, numSets, value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Muscle Group" />
          </SelectTrigger>
          <SelectContent
            ref={(ref) => {
              if (!ref) return;
              ref.ontouchstart = (e) => {
                e.preventDefault();
              };
            }}
          >
            <SelectGroup>
              <SelectLabel>Muscle Group</SelectLabel>
              <SelectItem value="Chest">Chest</SelectItem>
              <SelectItem value="Triceps">Triceps</SelectItem>
              <SelectItem value="Back">Back</SelectItem>
              <SelectItem value="Biceps">Biceps</SelectItem>
              <SelectItem value="Shoulders">Shoulders</SelectItem>
              <SelectItem value="Abs">Abs</SelectItem>
              <SelectItem value="Quads">Quads</SelectItem>
              <SelectItem value="Glutes">Glutes</SelectItem>
              <SelectItem value="Hamstrings">Hamstrings</SelectItem>
              <SelectItem value="Calves">Calves</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
