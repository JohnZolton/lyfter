
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
import { boolean } from "zod";
import type {
  User,
  Workout,
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

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Lyfter</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-gradient-to-b   from-[#000000]  to-[#44454b]  text-white">
        <nav className="flex items-center justify-between">
          <SignedIn>
            <div className="m-2 flex flex-col text-white ">
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
        <div>
          <SignedIn>
            <br></br>
            <NewWorkoutMenu />
            <br></br>
            <div></div>
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


const emptySet = { rir: 3, reps: 5, weight: 0 };

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
  exercises: (ExerciseTemplate & {sets: SetTemplate[]})[];
};

type WorkoutPlan = {
  description: string | undefined,
  workouts: WorkoutTemplate[]
}

function NewWorkoutMenu() {
  const [workoutPlan, setWorkoutPlan] = useState<
WorkoutPlan
  >();

  function addWorkoutToNewPlan(workout:WorkoutTemplate) {
    console.log('adding: ')
    console.log(workout);
    if (!workout) {
      return;
    }
    if (workoutPlan){
      const newWorkoutPlan = { description: workoutPlan?.description, workouts: [...workoutPlan.workouts, workout]}
      setWorkoutPlan(newWorkoutPlan);
      console.log(newWorkoutPlan)
    }
  }

  function updatePlanDescription(description: string){
    const newWorkoutPlan: WorkoutPlan = {
      description: description,
      workouts: []
    }
    setWorkoutPlan(newWorkoutPlan)
  }

  return (
    <div className="flex flex-col items-center rounded-lg text-white">
        <WorkoutPlanDisplay plan={workoutPlan} setPlan={setWorkoutPlan}/>
        <WorkoutDescriptionForm updateDescription={updatePlanDescription}/>
        <WorkoutDayForm 
            addWorkout={addWorkoutToNewPlan}
        />
        {workoutPlan && <SaveButton />}
    </div>
  );
}

function SaveButton(){
    return(<div>
        <button
        className="mt-4 rounded bg-green-600 px-2 py-1 font-bold text-white hover:bg-green-700"
        >
            Save Plan
        </button>
    </div>)
}



function createUniqueId(): string {
  return v4();
}

interface workoutDescriptionFormProps {
  updateDescription: (description: string) => void;
}

function WorkoutDescriptionForm({ updateDescription }: workoutDescriptionFormProps) {
  const [workoutDescription, setWorkoutDescription] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);
  function handleSubmit(event: React.FormEvent){
    event.preventDefault()
    updateDescription(workoutDescription)
  }

  return (
    <div className="flex flex-col items-center justify-center">
        <form onSubmit={(e)=>handleSubmit(e)}>
          <div className="space-y-5">
            <div className="rounded-lg bg-gray-900 p-5 text-white">
              <label className="font-bold">Plan Description:</label>
              <input
                required
                ref={inputRef}
                value={workoutDescription}
                onChange={(event) => setWorkoutDescription(event.target.value)}
                className="w-full rounded-lg bg-gray-700 p-1 text-white focus:outline-none"
                type="text"
              ></input>
              <button
                type="submit"
                className="mt-4 rounded bg-blue-600 px-2 py-1 font-bold text-white hover:bg-blue-700"
              >
                Add Workouts
              </button>
            </div>
          </div>
        </form>
    </div>
  );
}

interface WorkoutDayFormProps {
  addWorkout: (workout: WorkoutTemplate) => void;
}

function WorkoutDayForm({ addWorkout }: WorkoutDayFormProps) {
  const [dayDescription, setDayDescription] = useState("");
  const [nominalDay, setNominalDay] = useState("");
  const [showAddExercises, setShowAddExercises] = useState(false);


  function handleAddExercises() {
    console.log(dayDescription, nominalDay);
    if (dayDescription && nominalDay) {
      setShowAddExercises(true);
    }
  }
  function updateWorkoutPlan(exercises: ExerciseTemplate[]) {
    if (dayDescription && nominalDay) {
      const newWorkoutPlan: WorkoutTemplate = {
        workoutId: createUniqueId(),
        description: dayDescription,
        nominalDay: nominalDay,
        exercises: exercises,
      };
      addWorkout(newWorkoutPlan);
      //console.log("Plan Id: ", planId);
      //if (planId) {
        ////saveNewWorkout({ ...newWorkoutPlan, planId: planId });
      //} else {
        ////saveNewWorkout({ ...newWorkoutPlan, planId: createUniqueId() });
      //}

      //addWorkout(newWorkoutPlan);
      setShowAddExercises(false);
      setDayDescription("");
      setNominalDay("");
    }
  }
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col items-center justify-center">
      {!showAddExercises && (
        <form onSubmit={handleAddExercises}>
          <div className="space-y-5">
            <div className="rounded-lg bg-gray-900 p-5 text-white">
              <label className="font-bold">Day Description:</label>
              <input
                required
                ref={inputRef}
                value={dayDescription}
                onChange={(event) => setDayDescription(event.target.value)}
                className="w-full rounded-lg bg-gray-700 p-1 text-white focus:outline-none"
                type="text"
              ></input>
              <div>
                <label className="font-bold">Nominal Day: </label>
                <select
                  value={nominalDay}
                  onChange={(event) => setNominalDay(event.target.value)}
                  required
                  className="w-full rounded-lg bg-gray-700 p-1 text-white focus:outline-none"
                >
                  <option value="">Select Day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>
              <button
                type="submit"
                className="mt-4 rounded bg-blue-600 px-2 py-1 font-bold text-white hover:bg-blue-700"
              >
                Add Exercsies
              </button>
            </div>
          </div>
        </form>
      )}
      <br></br>
      {showAddExercises && <AddExerciseForm 
      description={dayDescription}
      nominalDay={nominalDay}
      updatePlan={updateWorkoutPlan} />}
      <br></br>
    </div>
  );
}

interface AddExerciseFormProps {
  updatePlan: (exercise: ExerciseTemplate[]) => void;
  description: string;
  nominalDay: string;
}

function AddExerciseForm({ updatePlan, description, nominalDay }: AddExerciseFormProps) {
  const [exercises, setExercises] = useState<ExerciseTemplate[]>();

  function saveExercises() {
    if (exercises) {
      updatePlan(exercises);
      setExercises([]);
    }
  }
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-gray-900 text-white">
        <div>{description}: {nominalDay}</div>
      <div className="">
        {exercises?.map((exercise, index) => (
          <div key={index} className="pt-2 font-semibold">
            {exercise.description}: {exercise?.sets[0]?.weight} x{" "}
            {exercise.sets.length}
          </div>
        ))}
      </div>
      <div className="w-full">
        <NewExercise setExercises={setExercises} exercises={exercises} />
      </div>
      <button
        onClick={saveExercises}
        className="mt-4 rounded bg-blue-600 px-2 py-1 font-bold text-white hover:bg-blue-700"
      >
        Save Day
      </button>
    </div>
  );
}

interface NewExerciseProps {
  exercises: ExerciseTemplate[] | undefined;
  setExercises: React.Dispatch<
    React.SetStateAction<ExerciseTemplate[] | undefined>
  >;
}

function NewExercise({ exercises, setExercises }: NewExerciseProps) {
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(5);
  const [sets, setSets] = useState(1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sets) {
      const newExercise: ExerciseTemplate = {
        id: createUniqueId(),
        description: description,
        sets: Array(sets).fill({
          ...emptySet,
          weight: weight,
          reps: reps,
        }) as SetTemplate[],
      };
      if (exercises) {
        const newExercises: ExerciseTemplate[] = [...exercises, newExercise];
        setExercises(newExercises);
        console.log(newExercises);
      } else {
        setExercises([newExercise]);
        console.log(newExercise);
      }
    }
    inputRef.current?.focus();
    setDescription("");
    setWeight(0);
    setSets(1);
  };
  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDescription(event.target.value);
  };
  const handleRepsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReps(parseInt(event.target.value));
  };
  const handleWeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWeight(parseInt(event.target.value));
  };
  const handleSetsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSets(parseInt(event.target.value));
  };

  return (
    <div className="flex flex-row justify-center rounded-lg bg-gray-900 p-5 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full items-center justify-center space-y-1"
      >
        <div className=" w-full p-1  sm:w-auto">
          <label htmlFor="description" className="mr-2">
            Exercise:
          </label>
          <div className="flex items-center">
            <input
              id="description"
              type="text"
              ref={inputRef}
              required
              className="w-full rounded-md bg-gray-800 px-2 py-1 text-white focus:outline-none sm:w-48"
              value={description}
              onChange={handleDescriptionChange}
            />
          </div>
        </div>
        <div className="flex w-full flex-row space-x-4">
          <div className="w-full sm:w-auto">
            <label htmlFor="weight" className="mr-2">
              Weight:
            </label>
            <div className="flex items-center justify-center">
              <input
                id="weight"
                type="number"
                required
                className="w-14 rounded-md bg-gray-800 px-2 py-1 text-center text-white focus:outline-none"
                value={weight}
                onChange={handleWeightChange}
              />
            </div>
          </div>
          <div className=" w-full sm:w-auto ">
            <label htmlFor="weight" className="mr-2">
              Reps:
            </label>
            <div className="flex items-center justify-center">
              <input
                id="weight"
                type="number"
                required
                className="w-12 rounded-md bg-gray-800 px-2 py-1 text-center text-white focus:outline-none"
                value={reps}
                onChange={handleRepsChange}
              />
            </div>
          </div>

          <div className=" w-full sm:w-auto ">
            <label htmlFor="sets" className="mr-2">
              Sets:
            </label>
            <div className="flex items-center justify-center">
              <input
                id="sets"
                type="number"
                min="1"
                required
                className="w-12 rounded-md bg-gray-800 px-2 py-1 text-center text-white focus:outline-none"
                value={sets}
                onChange={handleSetsChange}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            className="mt-4 rounded bg-blue-600 px-2 py-1 font-bold text-white hover:bg-blue-700"
          >
            Add Exercise
          </button>
        </div>
      </form>
    </div>
  );
}

interface workoutPlanDisplayProps {
plan: WorkoutPlan | undefined; 
setPlan: React.Dispatch<React.SetStateAction<WorkoutPlan | undefined>>
}
function WorkoutPlanDisplay({
  plan,
  setPlan,
}: workoutPlanDisplayProps) {
  console.log("workoutplan: ");
  console.log(plan);


  return (
    <div className="flex flex-col items-center rounded-lg text-white">
      {plan &&
          (<div key={plan.description} className="w-full">
              <div className=" pt-1  text-center text-2xl font-semibold text-slate-300">
                {plan.description}
              </div>
            <div className="flex flex-col items-center">
              {plan.workouts &&
                plan.workouts.map((workout, workoutNumber) => (
                  <div
                    className=" rounded-lg p-1"
                    key={workout.description + workoutNumber.toString()}
                  >
                    <IndividualWorkoutDisplay workout={workout}/>
                  </div>
                ))}
            </div>
          </div>
        )}
    </div>
  );
}


interface IndividualWorkoutDisplay {
  workout: WorkoutTemplate
}


function IndividualWorkoutDisplay({
workout
}: IndividualWorkoutDisplay) {

  return (
    <div className="flex flex-col items-center rounded-lg text-white">
      {workout &&
          (<div key={"w" + workout.description} className="w-full">
              <div className=" pt-1  text-center text-2xl font-semibold text-slate-300">
                {workout.description}: {workout.nominalDay}
              </div>
            <div className="flex flex-col items-center">
              {workout.exercises &&
                workout.exercises.map((exercise, exerciseNumber) => (
                  <div
                    className=" rounded-lg p-1"
                    key={exercise.description}
                  >
                    <ExercisePlanDisplay
                      exercise={exercise}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
    </div>
  );
}



interface ExercisePlanDisplayProps {
exercise: ExerciseTemplate
}

function ExercisePlanDisplay({
exercise
}: ExercisePlanDisplayProps) {
  const [description, setDescription] = useState(exercise.description);
  const [sets, setSets] = useState<SetTemplate[]>(exercise.sets);

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

  function handleSetChange(set: SetTemplate, index: number) {
    const newSets = [...sets];
    newSets[index] = set;
    setSets(newSets);
  }

  function handleAddSet() {
    const newSet: (SetTemplate  ) = {
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
  }
  function handleAddExercise() {
    console.log("todo")
  }
  function handleRemoveExercise() {
    console.log("todo")
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
  };
  const handleDescriptionClick = () => {
    setDescriptionInputActive(true);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "Escape") {
      handleBlur();
    }
  };

  return (
    <div
      key={exercise.description}
      className="mx-1 my-1 rounded-lg bg-slate-900 p-2 text-white shadow-md"
    >
      <div className="flex items-center justify-center">
        {descriptionInputActive ? (
          <input
            type="text"
            value={description}
            onChange={handleDescriptionChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="rounded-lg bg-slate-700 px-2 py-1 text-white focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            className="cursor-pointer rounded-lg bg-slate-600 px-2 py-1 font-semibold hover:bg-gray-500"
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
  set: SetTemplate;
  updateSets: (set: SetTemplate, index: number) => void;
  removeSet: (index: number) => void;
}

function SetDisplay({
  index,
  set,
  updateSets,
  removeSet,
}: SetDisplayProps) {
  const [weight, setWeight] = useState(set.weight);
  const [reps, setReps] = useState(set.reps);
  const [rir, setRir] = useState(set.rir);


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
    const newSet: SetTemplate ={
      weight: weight,
      reps: reps,
      rir: rir,
    };
    updateSets(newSet, index);
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
    //deleteSet({ setId: set.setId });
  }
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "esc") {
      handleBlur();
    }
  };

  const [weightInputActive, setWeightInputActive] = useState(false);
  const [repsInputActive, setRepsInputActive] = useState(false);
  const [rirInputActive, setRirInputActive] = useState(false);

  return (
    <div className="m-1 rounded-lg bg-slate-800 p-1 text-white shadow-md">
      <div className="flex flex-auto justify-center space-x-2">
        {weightInputActive ? (
          <input
            type="number"
            value={weight}
            onChange={handleWeightChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-14 rounded-lg bg-slate-700 text-center text-white focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            className="mx-2 cursor-pointer rounded-lg  bg-slate-600 px-2 py-1 hover:bg-gray-500"
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
            className="w-14 rounded-lg bg-slate-700 text-center text-white focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            className="cursor-pointer rounded-lg bg-slate-600 px-2 py-1 hover:bg-gray-500"
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
            className="w-14 rounded-lg bg-slate-700 text-center text-white focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            className="cursor-pointer rounded-lg bg-slate-600 px-2 py-1 hover:bg-gray-500"
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
      </div>
    </div>
  );
}