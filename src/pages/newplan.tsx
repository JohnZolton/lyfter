import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import React, { useState, useRef, useEffect } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { v4 } from "uuid";
import { NavBar } from "~/pages/components/navbar";
import PageLayout from "~/pages/components/pagelayout";
import MenuLayout from "./components/menulayout";
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
          <NewWorkoutMenu />
          <br></br>
          <div></div>
        </SignedIn>
        <SignedOut>
          {/* Signed out users get sign in button */}
          <SignInButton redirectUrl="home">
            <button className="rounded-full bg-gray-700 p-3 text-xl  hover:bg-gray-600">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </PageLayout>
    </>
  );
};

export default Home;

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
  exercises: (ExerciseTemplate & { sets: SetTemplate[] })[];
};

type WorkoutPlan = {
  description: string | undefined;
  workouts: WorkoutTemplate[];
};

function NewWorkoutMenu() {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan>();

  function addWorkoutToNewPlan(workout: WorkoutTemplate) {
    console.log("adding: ");
    console.log(workout);
    if (!workout) {
      return;
    }
    if (workoutPlan) {
      const newWorkoutPlan = {
        description: workoutPlan?.description,
        workouts: [...workoutPlan.workouts, workout],
      };
      setWorkoutPlan(newWorkoutPlan);
      console.log(newWorkoutPlan);
    }
  }

  function updatePlanDescription(description: string) {
    const newWorkoutPlan: WorkoutPlan = {
      description: description,
      workouts: [],
    };
    setWorkoutPlan(newWorkoutPlan);
  }
  const { mutate: saveNewWorkout, isLoading } = api.getWorkouts.newTestPlanTwo.useMutation(
    {
      onSuccess(data) {
        console.log(data);
      },
    }
  );

  function saveWorkoutPlan() {
    console.log(workoutPlan);
    if (
      workoutPlan &&
      workoutPlan.description !== "" &&
      workoutPlan.description
    ) {
      saveNewWorkout({
        description: workoutPlan.description,
        workouts: [...workoutPlan.workouts],
      });
    }
  }
  if (isLoading){
    return(
      <>
      <LoadingSpinner />
      </>
    )
  }

  return (
    <div className="flex flex-col items-center rounded-lg ">
      <div className="mb-2 pt-1 text-center text-2xl font-semibold ">
        New Workout Plan
      </div>
      <MenuLayout>
        <div className="my-1">
          <TestButton />
        </div>
        <div>Push, Pull, Legs</div>
        <div>or make your own</div>
        <div className="my-1">
          {!workoutPlan?.description && (
            <WorkoutDescriptionForm updateDescription={updatePlanDescription} />
          )}
          {workoutPlan?.description && (
            <WorkoutPlanDisplay
              addWorkout={addWorkoutToNewPlan}
              plan={workoutPlan}
              setPlan={setWorkoutPlan}
            />
          )}
          {workoutPlan && <SaveButton save={saveWorkoutPlan} />}
        </div>
      </MenuLayout>
    </div>
  );
}
function TestButton() {
  const { mutate: makePlan, isLoading } =
    api.getWorkouts.newTestPlanTwo.useMutation({
      onSuccess(data, variables, context) {
        console.log(data);
      },
    });

  function handleClick() {
    makePlan({ description: "Push Pull Legs", workouts: pplPlanArrayTwo });
  }
  if (isLoading){
    return(
      <>
      <LoadingSpinner/>
      </>
    )
  }
  return (
    <div className="flex justify-center">
      <button
        className="rounded bg-blue-600 px-4 py-2 font-bold  hover:bg-blue-700"
        onClick={handleClick}
      >
        Use Recommended Plan
      </button>
    </div>
  );
}

interface SaveButtonProps {
  save: () => void;
}
function SaveButton({ save }: SaveButtonProps) {
  return (
    <div>
      <button
        className="mt-4 rounded bg-green-600 px-2 py-1 font-bold  hover:bg-green-700"
        onClick={() => save()}
      >
        Save Plan
      </button>
    </div>
  );
}

function createUniqueId(): string {
  return v4();
}

interface workoutDescriptionFormProps {
  updateDescription: (description: string) => void;
}

function WorkoutDescriptionForm({
  updateDescription,
}: workoutDescriptionFormProps) {
  const [workoutDescription, setWorkoutDescription] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    updateDescription(workoutDescription);
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <form onSubmit={(e) => handleSubmit(e)}>
        <div className="space-y-5">
          <div className="rounded-lg bg-gray-900 p-5 ">
            <label className="font-bold">Plan Description:</label>
            <input
              required
              ref={inputRef}
              value={workoutDescription}
              onChange={(event) => setWorkoutDescription(event.target.value)}
              className="w-full rounded-lg bg-gray-700 p-1  focus:outline-none"
              type="text"
            ></input>
            <button
              type="submit"
              className="mt-4 rounded bg-blue-600 px-2 py-1 font-bold  hover:bg-blue-700"
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

  function handleAddExercises(event: React.FormEvent) {
    event.preventDefault();
    if (dayDescription && nominalDay) {
      const newWorkout: WorkoutTemplate = {
        workoutId: createUniqueId(),
        exercises: [],
        description: dayDescription,
        nominalDay: nominalDay,
      };
      addWorkout(newWorkout);
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
      setDayDescription("");
      setNominalDay("");
    }
  }
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col items-center justify-center">
      <form onSubmit={handleAddExercises}>
        <div className="space-y-5">
          <div className="rounded-lg bg-gray-900 p-5 ">
            <label className="font-bold">Day Description:</label>
            <input
              required
              autoFocus
              ref={inputRef}
              value={dayDescription}
              onChange={(event) => setDayDescription(event.target.value)}
              className="w-full rounded-lg bg-gray-700 p-1  focus:outline-none"
              type="text"
            ></input>
            <div>
              <label className="font-bold">Nominal Day: </label>
              <select
                value={nominalDay}
                onChange={(event) => setNominalDay(event.target.value)}
                required
                className="w-full rounded-lg bg-gray-700 p-1  focus:outline-none"
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
              className="mt-4 rounded bg-blue-600 px-2 py-1 font-bold  hover:bg-blue-700"
            >
              Add Exercsies
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

interface AddExerciseFormProps {
  updatePlan: (exercise: ExerciseTemplate[]) => void;
  description: string;
  nominalDay: string;
}

function AddExerciseForm({
  updatePlan,
  description,
  nominalDay,
}: AddExerciseFormProps) {
  const [exercises, setExercises] = useState<ExerciseTemplate[]>();

  function saveExercises() {
    if (exercises) {
      updatePlan(exercises);
      setExercises([]);
    }
  }
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-gray-900 ">
      <div>
        {description}: {nominalDay}
      </div>
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
        className="mt-4 rounded bg-blue-600 px-2 py-1 font-bold  hover:bg-blue-700"
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
    <div className="flex flex-row justify-center rounded-lg bg-gray-900 p-5 ">
      <form
        onSubmit={handleSubmit}
        className="w-full items-center justify-center space-y-1"
      >
        <div className="w-full p-1  sm:w-auto">
          <label htmlFor="description" className="mr-2">
            Exercise:
          </label>
          <div className="flex items-center">
            <input
              id="description"
              type="text"
              ref={inputRef}
              required
              className="w-full rounded-md bg-gray-800 px-2 py-1  focus:outline-none sm:w-48"
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
                className="w-14 rounded-md bg-gray-800 px-2 py-1 text-center  focus:outline-none"
                value={weight}
                onChange={handleWeightChange}
              />
            </div>
          </div>
          <div className="w-full  sm:w-auto">
            <label htmlFor="weight" className="mr-2">
              Reps:
            </label>
            <div className="flex items-center justify-center">
              <input
                id="weight"
                type="number"
                required
                className="w-12 rounded-md bg-gray-800 px-2 py-1 text-center  focus:outline-none"
                value={reps}
                onChange={handleRepsChange}
              />
            </div>
          </div>

          <div className="w-full  sm:w-auto">
            <label htmlFor="sets" className="mr-2">
              Sets:
            </label>
            <div className="flex items-center justify-center">
              <input
                id="sets"
                type="number"
                min="1"
                required
                className="w-12 rounded-md bg-gray-800 px-2 py-1 text-center  focus:outline-none"
                value={sets}
                onChange={handleSetsChange}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

interface workoutPlanDisplayProps {
  plan: WorkoutPlan | undefined;
  setPlan: React.Dispatch<React.SetStateAction<WorkoutPlan | undefined>>;
  addWorkout: (workout: WorkoutTemplate) => void;
}
function WorkoutPlanDisplay({
  plan,
  setPlan,
  addWorkout,
}: workoutPlanDisplayProps) {
  console.log("workoutplan: ");
  console.log(plan);

  const [addingDay, setAddingDay] = useState(true);
  const [readyAddDay, setReadyAddDay] = useState(false);

  function updateWorkout(
    updatedWorkout: WorkoutTemplate,
    workoutIndex: number
  ) {
    console.log("yes");
    if (updatedWorkout && plan?.workouts) {
      const updatedPlan = { ...plan };
      updatedPlan.workouts[workoutIndex] = updatedWorkout;
      setPlan(updatedPlan);
    }
  }

  function handleAddDay(workout: WorkoutTemplate) {
    addWorkout(workout);
    setAddingDay(false);
    setReadyAddDay(true);
  }

  return (
    <div className="flex flex-col items-center rounded-lg ">
      {plan && (
        <div key={plan.description} className="w-full">
          <div className="pt-1 text-center text-2xl font-semibold">
            {plan.description}
          </div>
          <div className="flex flex-col items-center">
            {plan.workouts &&
              plan.workouts.map((workout, workoutNumber) => (
                <div
                  className="rounded-lg p-1 "
                  key={workout.description + workoutNumber.toString()}
                >
                  <IndividualWorkoutDisplay
                    workoutIndex={workoutNumber}
                    updatePlan={setPlan}
                    plan={plan}
                    workout={workout}
                    updateWorkout={updateWorkout}
                  />
                </div>
              ))}
          </div>
          <div className="flex flex-col items-center">
            {readyAddDay && (
              <button
                className="mt-4 rounded bg-green-600 px-2 py-1 font-bold  hover:bg-green-700"
                onClick={() => (setAddingDay(true), setReadyAddDay(false))}
              >
                Add Day
              </button>
            )}
          </div>
          <div>{addingDay && <WorkoutDayForm addWorkout={handleAddDay} />}</div>
        </div>
      )}
    </div>
  );
}

interface IndividualWorkoutDisplay {
  workout: WorkoutTemplate;
  updateWorkout: (updatedWorkout: WorkoutTemplate, workoutIndex: any) => void;
  plan: WorkoutPlan;
  updatePlan: React.Dispatch<React.SetStateAction<WorkoutPlan | undefined>>;
  workoutIndex: number;
}

function IndividualWorkoutDisplay({
  workout,
  updatePlan,
  plan,
  updateWorkout,
  workoutIndex,
}: IndividualWorkoutDisplay) {
  const [newExerciseDescription, setNewExerciseDescription] = useState("");
  const [addingExercise, setAddingExercise] = useState(true);
  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setNewExerciseDescription(value);
  };
  function handleAddExercise(event: React.FormEvent) {
    event.preventDefault();
    setAddingExercise(false);
    setNewExerciseDescription("");
    if (newExerciseDescription) {
      const newExercise: ExerciseTemplate = {
        id: createUniqueId(),
        description: newExerciseDescription,
        sets: [emptySet],
      };
      const updatedWorkout = { ...workout };
      updatedWorkout.exercises = updatedWorkout.exercises
        ? [...updatedWorkout.exercises, newExercise]
        : [newExercise];
      const newPlan = { ...plan };
      newPlan.workouts[workoutIndex] = updatedWorkout;
      updatePlan(newPlan);
    }
  }

  return (
    <div className="flex flex-col items-center rounded-lg bg-slate-700 ">
      {workout && (
        <div key={"w" + workout.description} className="w-full">
          <div className="pt-1 text-center text-2xl font-semibold">
            {workout.description}: {workout.nominalDay}
          </div>
          <div className="flex flex-col items-center">
            {workout.exercises &&
              workout.exercises.map((exercise, exerciseNumber) => (
                <div className="rounded-lg p-1 " key={exercise.description}>
                  <ExercisePlanDisplay
                    exercise={exercise}
                    workout={workout}
                    updatePlan={updatePlan}
                    updateWorkout={updateWorkout}
                    plan={plan}
                    workoutIndex={workoutIndex}
                    exerciseIndex={exerciseNumber}
                  />
                </div>
              ))}
            {addingExercise && (
              <form
                className="mx-1 my-1 rounded-lg bg-slate-900 p-2 font-semibold  shadow-md"
                onSubmit={handleAddExercise}
              >
                <label>Exercise: </label>
                <input
                  type="text"
                  value={newExerciseDescription}
                  onChange={handleDescriptionChange}
                  className="rounded-lg bg-slate-700 px-2 py-1  focus:outline-none"
                  autoFocus
                />
              </form>
            )}
            {!addingExercise && (
              <button
                onClick={() => setAddingExercise(true)}
                className="m-1 rounded bg-blue-600 px-2 py-1 font-bold  hover:bg-blue-700"
              >
                Add Exercise
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ExercisePlanDisplayProps {
  exercise: ExerciseTemplate;
  workout: WorkoutTemplate;
  updateWorkout: (updatedWorkout: WorkoutTemplate, workoutIndex: any) => void;
  plan: WorkoutPlan;
  updatePlan: React.Dispatch<React.SetStateAction<WorkoutPlan | undefined>>;
  workoutIndex: number;
  exerciseIndex: number;
}

function ExercisePlanDisplay({
  exercise,
  workout,
  updateWorkout,
  plan,
  updatePlan,
  workoutIndex,
  exerciseIndex,
}: ExercisePlanDisplayProps) {
  const [description, setDescription] = useState(exercise.description);
  const [sets, setSets] = useState<SetTemplate[]>(exercise.sets);

  useEffect(() => {
    setDescription(exercise.description);
    setSets(exercise.sets);
  }, [exercise.description, exercise.sets]);

  function updateWorkoutPlanOnSetChange(
    newSets?: SetTemplate[],
    description?: string
  ) {
    if (exerciseIndex !== -1) {
      if (
        plan &&
        plan.workouts &&
        plan.workouts[workoutIndex] &&
        plan.workouts[workoutIndex]?.exercises
      ) {
        const updatedPlan: WorkoutPlan = { ...plan };
        const exerciseToUpdate =
          updatedPlan.workouts[workoutIndex]?.exercises[exerciseIndex];
        if (exerciseToUpdate) {
          newSets ??= exerciseToUpdate.sets;
          description ??= exerciseToUpdate.description;
          exerciseToUpdate.sets = [...newSets];
          exerciseToUpdate.description = description;
        }
        updatePlan(updatedPlan);
      }
    }
  }

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
    updateWorkoutPlanOnSetChange(newSets);
  }

  function handleAddSet() {
    const newSet: SetTemplate = {
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
    updateWorkoutPlanOnSetChange(newSets);
  }

  function handleRemoveExercise() {
    const newWorkout = { ...workout };
    const newExercises = [...workout.exercises];
    newExercises.splice(exerciseIndex, 1);
    console.log(newExercises);
    newWorkout.exercises = newExercises;
    const newPlan = { ...plan };
    newPlan.workouts[workoutIndex] = newWorkout;
    updatePlan(newPlan);
  }
  function handleRemoveSet(index: number) {
    if (
      plan &&
      plan.workouts &&
      plan.workouts[workoutIndex] &&
      plan.workouts[workoutIndex]?.exercises &&
      plan.workouts[workoutIndex]?.exercises[exerciseIndex]?.sets
    ) {
      const newSets = [...sets];
      if (index >= 0 && index < newSets.length) {
        newSets.splice(index, 1);
      }
      setSets(newSets);
      updateWorkoutPlanOnSetChange(newSets);
    }
  }
  const [descriptionInputActive, setDescriptionInputActive] = useState(false);
  const handleBlur = () => {
    if (description.length > 0) {
      setDescriptionInputActive(false);
      updateWorkoutPlanOnSetChange(sets, description);
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
      className="mx-1 my-1 rounded-lg bg-slate-900 p-2  shadow-md"
    >
      <div className="flex items-center justify-center">
        {descriptionInputActive ? (
          <input
            type="text"
            value={description}
            onChange={handleDescriptionChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="rounded-lg bg-slate-700 px-2 py-1  focus:outline-none"
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
          className="m-1 inline-flex items-center rounded bg-red-600 px-2 py-1 font-bold  hover:bg-red-700"
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
          className="m-1 rounded bg-blue-600 px-2 py-1 font-bold  hover:bg-blue-700"
        >
          Add Set
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

function SetDisplay({ index, set, updateSets, removeSet }: SetDisplayProps) {
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
    const newSet: SetTemplate = {
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
    <div className="m-1 rounded-lg bg-slate-800 p-1  shadow-md">
      <div className="flex flex-auto justify-center space-x-2">
        {weightInputActive ? (
          <input
            type="number"
            value={weight}
            onChange={handleWeightChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-14 rounded-lg bg-slate-700 text-center  focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            className="mx-2 cursor-pointer rounded-lg bg-slate-600 px-2  py-1 hover:bg-gray-500"
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
            className="w-14 rounded-lg bg-slate-700 text-center  focus:outline-none"
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
            className="w-14 rounded-lg bg-slate-700 text-center  focus:outline-none"
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
          className="mx-1 justify-center rounded bg-red-600 px-1 font-bold   hover:bg-red-700"
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

const emptySet = { rir: 3, reps: 5, weight: 0 };
const PushFirstTwo = {
  description: "Push #1",
  nominalDay: "Monday",
  workoutId: createUniqueId(),
  exercises: [
    {
      id: createUniqueId(),
      description: "Atlantis Side Raise",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Calf Raise",
      weight: 220,
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Machine Press",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Incline DB Press",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Cable Pushdown",
      sets: Array(3).fill(emptySet),
    },
  ],
};
const PushSecondTwo = {
  description: "Push #2",
  workoutId: createUniqueId(),
  nominalDay: "Thursday",
  exercises: [
    {
      id: createUniqueId(),
      description: "Machine Press",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Incline DB Press",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Cable Upright Row",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Cable Pushdown",
      sets: Array(3).fill(emptySet),
    },
    {
      description: "Leg Raise",
      id: createUniqueId(),
      weight: 0,
      sets: Array(3).fill(emptySet),
    },
  ],
};
const LegFirstTwo = {
  description: "Legs #1",
  workoutId: createUniqueId(),
  nominalDay: "Tuesday",
  exercises: [
    {
      id: createUniqueId(),
      description: "DB RDL",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Belt Squat",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Candlesticks",
      sets: Array(3).fill(emptySet),
    },
  ],
};

const LegSecondTwo = {
  description: "Legs #2",
  nominalDay: "Friday",
  workoutId: createUniqueId(),
  exercises: [
    {
      description: "Belt Squat",
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
    {
      description: "Ham Curl",
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
    {
      description: "Calf Raise",
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
  ],
};

const PullFirstTwo = {
  description: "Pull #1",
  nominalDay: "Wednesday",
  workoutId: createUniqueId(),
  exercises: [
    {
      description: "Calf Raise",
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
    {
      description: "Lat Pulldown",
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
    {
      description: "Machine Row",
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
    {
      description: "Bicep Curl",
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
  ],
};

const PullSecondTwo = {
  description: "Pull #2",
  nominalDay: "Saturday",
  workoutId: createUniqueId(),
  exercises: [
    {
      description: "Machine Row",
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
    {
      description: "Lat Pulldown",
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Atlantis Side Raise",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Bicep Curl",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Candlesticks",
      sets: Array(3).fill(emptySet),
    },
  ],
};

const pplPlanArrayTwo = [
  PushFirstTwo,
  PushSecondTwo,
  LegFirstTwo,
  LegSecondTwo,
  PullFirstTwo,
  PullSecondTwo,
];
