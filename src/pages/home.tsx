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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsDown, faCheck } from "@fortawesome/free-solid-svg-icons";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Lyfter</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-gradient-to-b from-gray-900 to-gray-700 text-white">
        <nav className="flex items-center justify-between">
          <SignedIn>
            <div className="m-2 flex flex-col text-white">
              <UserButton
                appearance={{
                  elements: { userButtonAvatarBox: { width: 45, height: 45 } },
                }}
              />
            </div>
          </SignedIn>
          <div className="flex space-x-6 pr-4">
            <Link
              href="home"
              className="text-gray-300 hover:text-white hover:underline"
            >
              Home
            </Link>
            <Link
              href="makeplan"
              className="text-gray-300 hover:text-white hover:underline"
            >
              Edit Plan
            </Link>
            <Link
              href="allworkouts"
              className="text-gray-300 hover:text-white hover:underline"
            >
              History
            </Link>
          </div>
        </nav>
        <div className="">
          <SignedIn>
            <WorkoutUiHandler />
          </SignedIn>
          <SignedOut>
            {/* Signed out users get sign in button */}
            <SignInButton redirectUrl="home">
              <button className="rounded-full bg-gray-700 p-3 text-xl text-white hover:bg-gray-600">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </main>
    </>
  );
};

export default Home;

function WorkoutUiHandler() {
  const [workoutId, setWorkoutId] = useState("");

  if (!workoutId) {
    return (
      <div
        style={{ maxWidth: "600px", margin: "0 auto" }}
        className="rounded-lg p-4 text-white"
      >
        <div className="mb-4 text-center text-2xl font-bold text-slate-300">
          Current Workouts:
        </div>
        <SelectDay setWorkoutId={setWorkoutId} />
      </div>
    );
  } else {
    return (
      <div className="rounded-lg text-white shadow-md">
        <WorkoutUi endWorkout={setWorkoutId} workoutId={workoutId} />
      </div>
    );
  }
}
interface WorkoutUiProps {
  workoutId: string;
  endWorkout: React.Dispatch<React.SetStateAction<string>>;
}

function WorkoutUi({ workoutId, endWorkout }: WorkoutUiProps) {
  //for now, just show todays workout today===nominalDay
  const [todaysWorkout, setTodaysWorkout] = useState<
    | (ActualWorkout & {
        exercises: (ActualExercise & {
          sets: exerciseSet[];
        })[];
      })[]
    | undefined
  >();

  const today = new Date();
  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const todayName = weekdays[today.getDay()];

  const [lastSetsArray, setLastSetsArray] = useState<exerciseSet[]>();

  const { mutate: saveWorkout, isLoading } =
    api.getWorkouts.createNewWorkoutFromPrevious.useMutation({
      onSuccess(data, variables, context) {
        setTodaysWorkout([data]);
      },
    });
  const { data: priorWorkout, isLoading: workoutsLoading } =
    api.getWorkouts.getWorkoutByWorkoutId.useQuery({
      workoutId: workoutId,
    });

  if (workoutId) {
    const priorSetsArray: exerciseSet[] = [];
    if (priorWorkout && !todaysWorkout && priorSetsArray.length === 0) {
      priorWorkout.exercises.map((exercise) => {
        exercise.sets.map((set) => {
          priorSetsArray.push(set);
        });
      });
      setLastSetsArray(priorSetsArray);
    }

    if (priorWorkout && priorWorkout && !todaysWorkout) {
      setTodaysWorkout([priorWorkout]);
      console.log(priorWorkout.date);
      const oneWeek = 6 * 24 * 60 * 60 * 1000;
      let isNewWorkoutCreated = false;
      if (today.getTime() - priorWorkout.date.getTime() > oneWeek) {
        if (!isNewWorkoutCreated) {
          //flag variable to avoid firing multiple times
          isNewWorkoutCreated = true;
          console.log("need new workout"); // i think its refreshing too fast and making double entries
          console.log(priorWorkout.date);
          console.log(today);

          const newWorkout = {
            ...priorWorkout,
            date: today,
            exercises: priorWorkout.exercises.map((exercise) => ({
              ...exercise,
              description: exercise.description,
            })),
          };
          saveWorkout(newWorkout);
        }
      }
    }
  }

  return (
    <div className=" flex flex-col items-center rounded-lg text-white">
      <WorkoutDisplay3
        priorSetsArray={lastSetsArray}
        workoutPlan={todaysWorkout}
        setWorkoutPlan={setTodaysWorkout}
      />
      <button
        className="mb-4 mt-4 rounded bg-red-600 px-2 py-1 font-bold text-white hover:bg-red-700"
        onClick={() => endWorkout("")}
      >
        End Workout
      </button>
    </div>
  );
}

interface SelectDayProps {
  setWorkoutId: React.Dispatch<React.SetStateAction<string>>;
}

function SelectDay({ setWorkoutId }: SelectDayProps) {
  const { data: userWorkoutPlan, isLoading } =
    api.getWorkouts.getUniqueWeekWorkouts.useQuery();
  function handleSelectWorkout(workoutId: string) {
    if (workoutId !== "none") {
      setWorkoutId(workoutId);
    }
  }
  function sortWorkoutsByNominalDay(workouts: ActualWorkout[]) {
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

  return (
    <div className="rounded-lg bg-gray-900 p-4 text-white shadow-md">
      {userWorkoutPlan &&
        sortWorkoutsByNominalDay(userWorkoutPlan).map((workout) => (
          <div
            key={workout.workoutId}
            className="my-2 flex items-center justify-between"
          >
            <div className="text-lg font-semibold text-gray-300">
              {workout.description}: {workout.nominalDay}
            </div>
            <button
              value={workout.nominalDay}
              className="m-1 inline-flex items-center rounded bg-green-600 px-2 py-1 font-bold text-white hover:bg-green-500"
              onClick={() =>
                handleSelectWorkout(
                  workout.workoutId ? workout.workoutId : "none"
                )
              }
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

type ExerciseTemplate = {
  id: string;
  description: string;
  sets: SetTemplate[];
};

type SetTemplate = {
  weight: number;
  reps: number;
  rir: number;
};

const emptySet = { rir: 3, reps: 5, weight: 0 };

interface display3Props {
  workoutPlan:
    | (ActualWorkout & {
        exercises: (ActualExercise & {
          sets: exerciseSet[];
        })[];
      })[]
    | undefined;
  setWorkoutPlan: React.Dispatch<
    React.SetStateAction<
      | (ActualWorkout & {
          exercises: (ActualExercise & {
            sets: exerciseSet[];
          })[];
        })[]
      | undefined
    >
  >;
  priorSetsArray: exerciseSet[] | undefined;
}
function WorkoutDisplay3({
  workoutPlan,
  setWorkoutPlan,
  priorSetsArray,
}: display3Props) {
  console.log("workoutplan: ");
  console.log(workoutPlan);

  function updateWorkoutPlan(
    exercise: ActualExercise & { sets: exerciseSet[] },
    workoutId: string,
    exerciseId: string
  ) {
    if (workoutPlan) {
      //exercise in workout to update
      setWorkoutPlan((prevWorkoutPlan) => {
        const newWorkoutPlan = [...(prevWorkoutPlan ?? [])];
        const workoutIndex = newWorkoutPlan.findIndex(
          (workout) => workout.workoutId === workoutId
        );
        if (workoutIndex !== -1) {
          const workout = newWorkoutPlan[workoutIndex];
          if (workout && newWorkoutPlan[workoutIndex] !== undefined) {
            const exerciseIndex = workout.exercises.findIndex(
              (oldExercise) => oldExercise.exerciseId === exerciseId
            );
            if (exerciseIndex !== -1) {
              newWorkoutPlan[workoutIndex]!.exercises[exerciseIndex] = exercise;
            }
          }
        }
        return newWorkoutPlan;
      });
    }
  }

  function removeExercise(workoutNumber: string, exerciseId: string) {
    setWorkoutPlan((prevWorkoutPlan) => {
      const updateWorkoutPlan = prevWorkoutPlan?.map((workout) => {
        const updatedExercises = workout.exercises.filter(
          (exercise) => exercise.exerciseId !== exerciseId
        );
        return { ...workout, exercises: updatedExercises };
      });
      console.log(updateWorkoutPlan);
      return updateWorkoutPlan;
    });
  }

  function addExercise(workoutNumber: string, exerciseIndex: number) {
    console.log("workout", workoutNumber);
    console.log("exercise", exerciseIndex);
    const tempExerciseId = createUniqueId();
    const newExercise: ActualExercise & { sets: exerciseSet[] } = {
      description: "New Exercise",
      exerciseId: tempExerciseId,
      date: new Date(),
      workoutId:
        workoutPlan && workoutPlan[0] ? workoutPlan[0].workoutId : "none",
      previousExerciseId: null,
      nextExerciseId: null,
      sets: [
        {
          date: new Date(),
          exerciseId: tempExerciseId,
          setId: createUniqueId(),
          weight: 0,
          reps: 0,
          rir: 3,
          lastSetId: null,
        },
      ],
    };

    setWorkoutPlan((prevWorkoutPlan) => {
      const updatedWorkoutPlan = [...(prevWorkoutPlan ?? [])];
      const workoutIndex = updatedWorkoutPlan.findIndex(
        (workout) => workout.workoutId === workoutNumber
      );
      if (workoutIndex !== -1) {
        const workout = updatedWorkoutPlan[workoutIndex];
        if (workout) {
          const newExercises = [
            ...workout.exercises.slice(0, exerciseIndex + 1),
            newExercise,
            ...workout.exercises.slice(exerciseIndex + 1),
          ];
          updatedWorkoutPlan[workoutIndex] = {
            ...workout,
            exercises: newExercises,
          };
        }
      }
      return updatedWorkoutPlan;
    });
  }

  return (
    <div className="flex flex-col items-center rounded-lg text-white">
      {workoutPlan &&
        workoutPlan.map((workout, workoutNumber) => (
          <div key={"w" + workoutNumber.toString()} className="w-full">
            <div>
              <div className=" pt-1  text-center text-2xl font-semibold text-gray-300">
                {workout.description}: {workout.nominalDay}
              </div>
            </div>
            <div className="flex flex-col items-center">
              {workout.exercises &&
                workout.exercises.map((exercise, exerciseNumber) => (
                  <div
                    className=" rounded-lg p-1"
                    key={exercise.exerciseId.toString()}
                  >
                    <ExerciseDisplay
                      removeExercise={removeExercise}
                      workoutNumber={workout.workoutId}
                      exerciseNumber={exercise.exerciseId}
                      exerciseIndex={exerciseNumber}
                      priorSetsArray={priorSetsArray}
                      updatePlan={updateWorkoutPlan}
                      addExercise={addExercise}
                      key={workoutNumber.toString() + exerciseNumber.toString()}
                      exercise={exercise}
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}
    </div>
  );
}
interface ExerciseDisplayProps {
  exercise: ActualExercise & {
    sets: exerciseSet[];
  };
  workoutNumber: string;
  exerciseNumber: string;
  exerciseIndex: number;
  addExercise: (workoutNumber: string, exerciseIndex: number) => void;
  updatePlan: (
    exercise: ActualExercise & {
      sets: exerciseSet[];
    },
    workoutId: string,
    exerciseId: string
  ) => void;
  priorSetsArray: exerciseSet[] | undefined;
  removeExercise: (workoutNumber: string, exerciseNumber: string) => void;
}

function ExerciseDisplay({
  removeExercise,
  exercise,
  workoutNumber,
  exerciseNumber,
  exerciseIndex,
  priorSetsArray,
  addExercise,
  updatePlan,
}: ExerciseDisplayProps) {
  const [description, setDescription] = useState(exercise.description);
  const [sets, setSets] = useState(exercise.sets);

  useEffect(() => {
    setDescription(exercise.description);
    setSets(exercise.sets);
  }, [exercise.description, exercise.sets]);

  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setDescription(value);
  };

  function handleSetChange(set: exerciseSet, index: number) {
    const newSets = [...sets];
    newSets[index] = set;
    setSets(newSets);
  }
  function handleSaveButton() {
    const newData: ActualExercise & { sets: exerciseSet[] } = {
      ...exercise,
      sets: sets,
      description: description,
    };

    updatePlan(newData, workoutNumber, exerciseNumber);
  }
  const { mutate: recordNewExercise } =
    api.getWorkouts.addNewExercise.useMutation({
      onSuccess(data) {
        console.log(data);
      },
    });
  const { mutate: deleteExercise } = api.getWorkouts.deleteExercise.useMutation(
    {
      onSuccess(data) {
        console.log(data);
      },
    }
  );
  const { mutate: recordUpdatedDescription } =
    api.getWorkouts.updateExerciseDescription.useMutation({
      onSuccess(data) {
        console.log(data);
      },
    });

  const { mutate: recordNewSet } = api.getWorkouts.createSet.useMutation({
    onSuccess(data) {
      console.log(data);
    },
  });

  function handleAddSet() {
    const newSet: exerciseSet = {
      date: new Date(),
      exerciseId: exercise.exerciseId,
      setId: createUniqueId(),
      weight: 0,
      reps: 5,
      rir: 3,
      lastSetId: null,
    };
    const lastSet = sets[sets.length - 1];
    if (lastSet !== undefined) {
      newSet.reps = lastSet.reps;
      newSet.rir = lastSet.rir;
      newSet.weight = lastSet.weight;
    }
    const newSets = [...sets, newSet];
    setSets(newSets);
    recordNewSet({ ...newSet });
  }
  function handleAddExercise() {
    addExercise(workoutNumber, exerciseIndex);
    recordNewExercise({ workoutId: exercise.workoutId });
  }
  function handleRemoveExercise() {
    removeExercise(workoutNumber, exercise.exerciseId);
    deleteExercise({ exerciseId: exercise.exerciseId });
  }
  function handleRemoveSet(index: number) {
    console.log("remove set");
    const newSets = [...sets];
    if (index >= 0 && index < newSets.length) {
      newSets.splice(index, 1);
    }
    console.log(newSets);
    setSets(newSets);
  }
  const [descriptionInputActive, setDescriptionInputActive] = useState(false);
  const handleBlur = () => {
    if (description.length > 0) {
      setDescriptionInputActive(false);
    }
    recordUpdatedDescription({
      exerciseId: exercise.exerciseId,
      description: description,
    });
  };
  const handleDescriptionClick = () => {
    setDescriptionInputActive(true);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "Escape") {
      handleBlur();
    }
  };
  useEffect(() => {
    handleSaveButton();
  }, [sets, description]);

  return (
    <div
      key={exercise.description}
      className="mx-1 my-1 rounded-lg bg-gray-900 p-2 text-white shadow-md"
    >
      <div className="flex items-center justify-center">
        {descriptionInputActive ? (
          <input
            type="text"
            value={description}
            onChange={handleDescriptionChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="rounded-lg bg-gray-700 px-2 py-1 text-white focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            className="cursor-pointer rounded-lg bg-gray-600 px-2 py-1 font-semibold hover:bg-gray-500"
            onClick={handleDescriptionClick}
          >
            {description}
          </span>
        )}
        <button
          onClick={handleRemoveExercise}
          className="m-1 inline-flex items-center rounded bg-red-600 px-2 py-1 font-bold text-white hover:bg-red-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 11.414L15.657 17.071l1.414-1.414L11.414 10l5.657-5.657L15.657 2.93 10 8.586 4.343 2.93 2.93 4.343 8.586 10l-5.657 5.657 1.414 1.414L10 11.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div>
        {sets.map((set, index) => (
          <SetDisplay
            key={index}
            set={set}
            index={index}
            priorSetsArray={priorSetsArray}
            removeSet={handleRemoveSet}
            updateSets={handleSetChange}
          />
        ))}
      </div>
      <div className="flex justify-center">
        <button
          onClick={handleAddSet}
          className="m-1 rounded bg-blue-600 px-2 py-1 font-bold text-white hover:bg-blue-700"
        >
          Add Set
        </button>
        <button
          onClick={handleAddExercise}
          className="m-1 rounded bg-blue-600 px-2 py-1 font-bold text-white hover:bg-blue-700"
        >
          Add Exercise
        </button>
      </div>
    </div>
  );
}

interface SetDisplayProps {
  index: number;
  set: exerciseSet;
  priorSetsArray: exerciseSet[] | undefined;
  updateSets: (set: exerciseSet, index: number) => void;
  removeSet: (index: number) => void;
}

function SetDisplay({
  index,
  set,
  priorSetsArray,
  updateSets,
  removeSet,
}: SetDisplayProps) {
  const [weight, setWeight] = useState(set.weight);
  const [reps, setReps] = useState(set.reps);
  const [rir, setRir] = useState(set.rir);

  const { mutate: recordSet } = api.getWorkouts.updateSets.useMutation({
    onSuccess(data) {
      console.log(data);
    },
  });
  const { mutate: deleteSet } = api.getWorkouts.removeSet.useMutation({
    onSuccess(data) {
      console.log(data);
    },
  });

  const handleWeightClick = () => {
    setWeightInputActive(true);
  };
  const handleRepsClick = () => {
    setRepsInputActive(true);
  };
  const handleRirClick = () => {
    setRirInputActive(true);
  };
  const handleBlur = () => {
    setWeightInputActive(false);
    setRepsInputActive(false);
    setRirInputActive(false);
    const newSet: exerciseSet = {
      date: new Date(),
      setId: set.setId,
      exerciseId: set.exerciseId,
      weight: weight,
      reps: reps,
      rir: rir,
      lastSetId: set.lastSetId,
    };
    updateSets(newSet, index);
    recordSet({ ...newSet });
  };

  useEffect(() => {
    setWeight(set.weight);
    setReps(set.reps);
    setRir(set.rir);
  }, [set.weight, set.reps, set.rir]);

  const handleWeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setWeight(parseInt(event.target.value));
    }
  };

  const handleRepsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setReps(parseInt(event.target.value));
    }
  };

  const handleRirChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setRir(parseInt(event.target.value));
    }
  };

  function handleRemoveSet() {
    removeSet(index);
    deleteSet({ setId: set.setId });
  }
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "esc") {
      handleBlur();
    }
  };

  const [weightInputActive, setWeightInputActive] = useState(false);
  const [repsInputActive, setRepsInputActive] = useState(false);
  const [rirInputActive, setRirInputActive] = useState(false);

  const [priorSet, setPriorSet] = useState<exerciseSet | undefined>();
  if (!priorSet && priorSetsArray) {
    console.log("finding set...");
    const lastWeeksSet = priorSetsArray?.find(
      (lastSet) => lastSet.setId === set.lastSetId
    );
    if (lastWeeksSet) {
      console.log("found: ", lastWeeksSet);
      setPriorSet(lastWeeksSet);
    }
  }

  return (
    <div className="m-1 rounded-lg bg-gray-800 p-1 text-white shadow-md">
      {priorSet && (
        <div className=" mb-2 text-center font-semibold">
          Last time: {priorSet?.weight} lbs x {priorSet?.reps} reps @{" "}
          {priorSet?.rir}RIR
        </div>
      )}
      <div className="flex flex-auto justify-center space-x-2">
        {weightInputActive ? (
          <input
            type="number"
            value={weight}
            onChange={handleWeightChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-14 rounded-lg bg-gray-700 text-center text-white focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            className="mx-2 cursor-pointer rounded-lg  bg-gray-600 px-2 py-1 hover:bg-gray-500"
            onClick={handleWeightClick}
          >
            {weight} lbs
          </span>
        )}{" "}
        x{" "}
        {repsInputActive ? (
          <input
            type="number"
            value={reps}
            onKeyDown={handleKeyDown}
            onChange={handleRepsChange}
            onBlur={handleBlur}
            className="w-14 rounded-lg bg-gray-700 text-center text-white focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            className="cursor-pointer rounded-lg bg-gray-600 px-2 py-1 hover:bg-gray-500"
            onClick={handleRepsClick}
          >
            {reps} reps
          </span>
        )}
        <div className="w-.75 inline-block" />@
        {rirInputActive ? (
          <input
            type="number"
            value={rir}
            onChange={handleRirChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-14 rounded-lg bg-gray-700 text-center text-white focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            className="cursor-pointer rounded-lg bg-gray-600 px-2 py-1 hover:bg-gray-500"
            onClick={handleRirClick}
          >
            {rir} RIR
          </span>
        )}
        <button
          onClick={handleRemoveSet}
          className="mx-1 justify-center rounded bg-red-600 px-1  font-bold text-white hover:bg-red-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 11.414L15.657 17.071l1.414-1.414L11.414 10l5.657-5.657L15.657 2.93 10 8.586 4.343 2.93 2.93 4.343 8.586 10l-5.657 5.657 1.414 1.414L10 11.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div className="mt-1 text-xl">
          <PerformanceWarning priorSet={priorSet} currentSet={set} />
        </div>
      </div>
    </div>
  );
}

interface PerformanceWarningProps {
  priorSet: exerciseSet | undefined;
  currentSet: exerciseSet | undefined;
}

function PerformanceWarning({ priorSet, currentSet }: PerformanceWarningProps) {
  if (!priorSet || !currentSet) {
    return <div></div>;
  }

  if (priorSet.weight > currentSet.weight || priorSet.reps > currentSet.reps) {
    return (
      <div className="text-red-500">
        <FontAwesomeIcon icon={faThumbsDown} />
      </div>
    );
  }
  if (priorSet.weight < currentSet.weight || priorSet.reps < currentSet.reps) {
    return (
      <div className="text-green-500">
        <FontAwesomeIcon icon={faCheck} />
      </div>
    );
  } else {
    return <div></div>;
  }
}
