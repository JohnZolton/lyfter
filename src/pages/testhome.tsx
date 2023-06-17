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

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Lyfter</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-gradient-to-b   from-[#000000]  to-[#44454b] text-center text-white">
        <nav className="bg-black-500 flex flex-wrap">
          <SignedIn>
            <div className="flex flex-col p-4 text-white ">
              <UserButton
                appearance={{
                  elements: { userButtonAvatarBox: { width: 60, height: 60 } },
                }}
              />
            </div>
          </SignedIn>
          <div className="flex items-center justify-between">
            <Link
              href="home"
              className=" m-2 text-slate-200 hover:text-white hover:underline"
            >
              Home
            </Link>
            <Link
              href="makeplan"
              className="m-2 text-slate-200 hover:text-white"
            >
              Edit Plan
            </Link>
            <Link
              href="allworkouts"
              className="m-2 text-slate-200 hover:text-white"
            >
              History
            </Link>
          </div>
        </nav>
        <div>
          <SignedIn>
            <br></br>
            <WorkoutUi />
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
        </div>
      </main>
    </>
  );
};

export default Home;

function WorkoutUi() {
    //for now, just show todays workout today===nominalDay
    const [todaysWorkout, setTodaysWorkout] = useState<(ActualWorkout & {
    exercises: (ActualExercise & {
        sets: exerciseSet[];
    })[];
})[] | undefined>()

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


  const { mutate: saveWorkout, isLoading } =
    api.getWorkouts.saveWorkout.useMutation({
      onSuccess(data, variables, context) {
        console.log(data);
        setTodaysWorkout([data])
      },
    });

    if (todayName){
        const { data: priorWorkouts, isLoading: workoutsLoading } =
        api.getWorkouts.getPreviousWorkout.useQuery({
            nominalDay: todayName,
        });

        if (priorWorkouts && priorWorkouts[0] && !todaysWorkout){
            setTodaysWorkout([priorWorkouts[0]])
            if (priorWorkouts[0].date.toISOString().slice(0,10) !== today.toISOString().slice(0,10)){
              console.log("need new workout")
              console.log(priorWorkouts[0].date)
              console.log(today)

              const newWorkout = {
                ...priorWorkouts[0],
                date: today,
                exercises: priorWorkouts[0].exercises.map((exercise) => ({
                  ...exercise,
                  description: exercise.description,
                })),
              };
              saveWorkout(newWorkout);
            }
        }
    }

  return (
    <div>
      <WorkoutDisplay3 workoutPlan={todaysWorkout} setWorkoutPlan={setTodaysWorkout}/>
    </div>
  );
}


interface NewExerciseProps {
  exercises: ExerciseTemplate[] | undefined;
  setExercises: React.Dispatch<
    React.SetStateAction<ExerciseTemplate[] | undefined>
  >;
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

type WorkoutTemplate = {
  description: string;
  nominalDay: string;
  workoutId: string;
  exercises: ExerciseTemplate[];
};

const emptySet = { rir: 3, reps: 5, weight: 0 };



interface display3Props {
  workoutPlan: (ActualWorkout & {
    exercises: (ActualExercise & {
        sets: exerciseSet[];
    })[];
})[] | undefined;
  setWorkoutPlan: React.Dispatch<React.SetStateAction<(ActualWorkout & {
    exercises: (ActualExercise & {
        sets: exerciseSet[];
    })[];
})[] | undefined>>
}
function WorkoutDisplay3({ workoutPlan, setWorkoutPlan }: display3Props) {
    console.log('workoutplan: ')
    console.log(workoutPlan)

  function updateWorkoutPlan(
    exercise: ActualExercise & { sets: exerciseSet[] },
    workoutId: string,
    exerciseId: string
  ) {
    console.log(exercise, workoutId, exerciseId);
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
        console.log(newWorkoutPlan);
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
    const newExercise: ActualExercise & {sets: exerciseSet[]}= {
      description: "New Exercise",
      exerciseId: tempExerciseId,
      date: new Date(),
      workoutId: (workoutPlan && workoutPlan[0]) ? workoutPlan[0].workoutId : 'none',
      previousExerciseId: null,
      nextExerciseId: null,
      sets: [{
        date: new Date(),
        exerciseId: tempExerciseId,
        setId: createUniqueId(),
        weight: 0,
        reps: 0,
        rir: 3,
      }],
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
    <div>
      <div className="mb-4 text-center text-2xl font-bold text-slate-300">
        Current Workouts:
      </div>
      {workoutPlan &&
        workoutPlan.map(
          (
            workout,
            workoutNumber
          ) => (
            <div key={"w" + workoutNumber.toString()}>
              <div>
                {workout.description}: {workout.nominalDay}
              </div>
              <div>
                {workout.exercises &&
                  workout.exercises.map(
                    (
                      exercise,
                      exerciseNumber
                    ) => (
                      <ExerciseDisplay
                        removeExercise={removeExercise}
                        workoutNumber={workout.workoutId}
                        exerciseNumber={exercise.exerciseId}
                        exerciseIndex={exerciseNumber}
                        updatePlan={updateWorkoutPlan}
                        addExercise={addExercise}
                        key={
                          workoutNumber.toString() + exerciseNumber.toString()
                        }
                        exercise={exercise}
                      />
                    )
                  )}
              </div>
              <br></br>
            </div>
          )
        )}
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
  updatePlan: (exercise: ActualExercise & {
    sets: exerciseSet[];
}, workoutId: string, exerciseId: string) => void;
  
  removeExercise: (workoutNumber: string, exerciseNumber: string) => void;
}

function ExerciseDisplay({
  removeExercise,
  exercise,
  workoutNumber,
  exerciseNumber,
  exerciseIndex,
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
        ...exercise, sets: sets, description: description
    };

    updatePlan(newData, workoutNumber, exerciseNumber);
  }
  const { mutate: recordNewExercise } = api.getWorkouts.addNewExercise.useMutation({
    onSuccess(data){
      console.log(data)
    }})
  const { mutate: deleteExercise } = api.getWorkouts.deleteExercise.useMutation({
    onSuccess(data){
      console.log(data)
    }})
  const { mutate: recordUpdatedDescription } = api.getWorkouts.updateExerciseDescription.useMutation({
    onSuccess(data){
      console.log(data)
    }})

  const { mutate: recordNewSet } = api.getWorkouts.createSet.useMutation({
    onSuccess(data){
      console.log(data)
    }})

  function handleAddSet() {
    const newSet : exerciseSet = {
        date: new Date(),
        exerciseId: exercise.exerciseId,
        setId: createUniqueId(),
        weight: 0,
        reps: 5,
        rir: 3,
    }; 
    const lastSet = sets[sets.length - 1];
    if (lastSet !== undefined) {
      newSet.reps = lastSet.reps;
      newSet.rir = lastSet.rir;
      newSet.weight = lastSet.weight;
    }
    const newSets = [...sets, newSet];
    setSets(newSets);
    recordNewSet({...newSet})
  }
  function handleAddExercise() {
    addExercise(workoutNumber, exerciseIndex);
    recordNewExercise({workoutId: exercise.workoutId})
  }
  function handleRemoveExercise() {
    removeExercise(workoutNumber, exercise.exerciseId);
    deleteExercise({exerciseId: exercise.exerciseId})
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
    recordUpdatedDescription({exerciseId: exercise.exerciseId, description: description})
  };
  const handleDescriptionClick = () => {
    setDescriptionInputActive(true);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key ==="Escape") {
      handleBlur();
    }
  };
  useEffect(()=>{
    handleSaveButton()
  }, [sets, description])

  return (
    <div key={exercise.description} className="m-1  bg-red-700">
      <div>
        {descriptionInputActive ? (
          <input
            type="text"
            value={description}
            onChange={handleDescriptionChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="rounded-md px-1 text-black"
            autoFocus
          />
        ) : (
          <span className="hover:bg-slate-500 bg-slate-700" onClick={handleDescriptionClick}>{description}
          </span>
        )}
        <button
          onClick={handleRemoveExercise}
          className="m-1 rounded bg-slate-400 px-1 py-1 font-bold text-white hover:bg-slate-700 inline-flex items-center"
        >
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
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
            removeSet={handleRemoveSet}
            updateSets={handleSetChange}
          />
        ))}
      </div>
      <button
        onClick={handleAddSet}
        className="m-1 rounded bg-blue-500 px-1 py-1 font-bold text-white hover:bg-blue-700"
      >
        Add Set
      </button>
        <button
          onClick={handleAddExercise}
          className=" m-1 rounded bg-blue-500 px-1 py-1 font-bold text-white hover:bg-blue-700"
        >
          Add Exercise
        </button>
    </div>
  );
}

interface SetDisplayProps {
  index: number;
  set: exerciseSet;
  updateSets: (set: exerciseSet, index: number) => void;
  removeSet: (index: number) => void;
}

function SetDisplay({ index, set, updateSets, removeSet }: SetDisplayProps) {
  const [weight, setWeight] = useState(set.weight);
  const [reps, setReps] = useState(set.reps);
  const [rir, setRir] = useState(set.rir);

  const { mutate: recordSet } = api.getWorkouts.updateSets.useMutation({
    onSuccess(data){
      console.log(data)
    }
  })
  const { mutate: deleteSet } = api.getWorkouts.removeSet.useMutation({
    onSuccess(data){
      console.log(data)
    }
  })

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
    };
    updateSets(newSet, index);
    recordSet({...newSet})
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
    deleteSet({setId: set.setId})
  }
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key==="esc") {
      handleBlur();
    }
  };

  const [weightInputActive, setWeightInputActive] = useState(false);
  const [repsInputActive, setRepsInputActive] = useState(false);
  const [rirInputActive, setRirInputActive] = useState(false);

  return (
    <div className="m-1">
      {weightInputActive ? (
        <input
          type="number"
          value={weight}
          onChange={handleWeightChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-12 rounded-md text-center text-black"
          autoFocus
        />
      ) : (
        <span className="underline bg-slate-700  px-1 py-0.5 hover:bg-slate-500" onClick={handleWeightClick}>
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
          className="w-12 rounded-md text-center text-black"
          autoFocus
        />
      ) : (
        <span className="underline bg-slate-700 px-1 py-0.5 hover:bg-slate-500" onClick={handleRepsClick}>
          {reps} reps
        </span>
      )}{" "}
      @{" "}
      {rirInputActive ? (
        <input
          type="number"
          value={rir}
          onChange={handleRirChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-12 rounded-md text-center text-black"
          autoFocus
        />
      ) : (
        <span className="underline px-1 py-0.5 bg-slate-700 hover:bg-slate-500" onClick={handleRirClick}>
          {rir} RIR
        </span>
      )}
      <button
        onClick={handleRemoveSet}
        className="mx-1 rounded bg-slate-400 px-1 justify-center  font-bold text-white hover:bg-slate-700"
      >
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 11.414L15.657 17.071l1.414-1.414L11.414 10l5.657-5.657L15.657 2.93 10 8.586 4.343 2.93 2.93 4.343 8.586 10l-5.657 5.657 1.414 1.414L10 11.414z"
      clipRule="evenodd"
    />
  </svg>
      </button>
    </div>
  );
}

