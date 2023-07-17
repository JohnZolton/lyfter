import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import React, {
  useState,
  useEffect,
} from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";
import type {
  ActualWorkout,
  ActualExercise,
  exerciseSet,
} from "@prisma/client";
import { v4 } from "uuid";
import { NavBar } from "~/pages/components/navbar";
import PageLayout  from "~/pages/components/pagelayout";
import LoadingSpinner from "./components/loadingspinner";
import SetDisplay from "./components/setdisplay";

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
        <div className="">
          <SignedIn>
            <WorkoutUiHandler />
          </SignedIn>
          <SignedOut>
            {/* Signed out users get sign in button */}
            <SignInButton redirectUrl="home">
              <button className="rounded-full bg-slate-700 p-3 text-xl  hover:bg-gray-600">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </PageLayout>
    </>
  );
};

export default Home;

function WorkoutUiHandler() {
  const [workoutPlan, setWorkoutPlan] = useState<
    | (ActualWorkout & {
        exercises: (ActualExercise & {
          sets: (exerciseSet & {
            priorSet: exerciseSet | null;
          })[];
        })[];
      })[]
    | undefined
  >();
  const [todaysWorkout, setTodaysWorkout] = useState<
    | (ActualWorkout & {
        exercises: (ActualExercise & {
          sets: (exerciseSet & {
            priorSet: exerciseSet | null;
          })[];
        })[];
      })
    | undefined
  >();

  const { data: userWorkouts, isLoading } =
    api.getWorkouts.getUniqueWeekWorkouts.useQuery();


  useEffect(() => {
    if (
      userWorkouts &&
      !todaysWorkout &&
      userWorkouts.workoutPlan
    ) {
        const uniqueWorkouts = new Set()
        const workoutsToDisplay: (ActualWorkout & {
    exercises: (ActualExercise & {
        sets: (exerciseSet & {
            priorSet: exerciseSet | null;
        })[];
    })[];
})[] = []
        userWorkouts.workoutPlan.workouts.map((workout) => {
          console.log(workout)
          if (!uniqueWorkouts.has(workout.originalWorkoutId)){
            console.log("ADDING")
            uniqueWorkouts.add(workout.originalWorkoutId)
            workoutsToDisplay.push(workout)
          }
        }
        )


      setWorkoutPlan(sortWorkoutsByNominalDay(workoutsToDisplay));
      }
  }, [userWorkouts, todaysWorkout]);

  function sortWorkoutsByNominalDay(
    workouts: (ActualWorkout & {
      exercises: (ActualExercise & {
        sets: (exerciseSet & {
          priorSet: exerciseSet | null;
        })[];
      })[];
    })[]
  ) {
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

  if (isLoading) {
    return (<div className="flex justify-center p-10"
    ><LoadingSpinner/></div>)
  }
  function endWorkout() {
    setTodaysWorkout(undefined);
  }

  if (!todaysWorkout) {
    return (
      <div
        style={{ maxWidth: "600px", margin: "0 auto" }}
        className="rounded-lg p-4"
      >
        <div className="mb-4 text-center text-2xl font-bold">
          Current Workouts:
        </div>
        <SelectDay
          userWorkoutPlan={workoutPlan}
          setTodaysWorkout={setTodaysWorkout}
        />
      </div>
    );
  }
  if (todaysWorkout) {
    return (
      <div className="rounded-lg  shadow-md">
        <WorkoutUi
          endWorkout={endWorkout}
          todaysWorkout={todaysWorkout}
          setTodaysWorkout={setTodaysWorkout}
        />
      </div>
    );
  } else {
    return <div>Something went wrong</div>;
  }
}
interface WorkoutUiProps {
  todaysWorkout: ActualWorkout & {
    exercises: (ActualExercise & {
      sets: (exerciseSet & {
        priorSet: exerciseSet | null;
      })[];
    })[];
  };
  endWorkout: React.Dispatch<React.SetStateAction<string>>;
  setTodaysWorkout: React.Dispatch<
    React.SetStateAction<
      | (ActualWorkout & {
          exercises: (ActualExercise & {
            sets: (exerciseSet & {
              priorSet: exerciseSet | null;
            })[];
          })[];
        })
      | undefined
    >
  >;
}

function WorkoutUi({
  todaysWorkout,
  setTodaysWorkout,
  endWorkout,
}: WorkoutUiProps) {
  const today = new Date();

  const { mutate: saveWorkout } =
    api.getWorkouts.createNewWorkoutFromPrevious.useMutation({
      onSuccess(data) {
        setTodaysWorkout(data);
      },
    });

  let isNewWorkoutCreated = false; //flag variable to avoid firing multiple times
  useEffect(() => {
    if (todaysWorkout) {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (today.getTime() - todaysWorkout.date.getTime() > oneWeek) {
        if (!isNewWorkoutCreated) {
          isNewWorkoutCreated = true;
          console.log("need new workout");

          const newWorkout = {
            ...todaysWorkout,
            date: today,
            priorWorkoutId: todaysWorkout.originalWorkoutId !== null ?  todaysWorkout.originalWorkoutId : todaysWorkout.workoutId,
            planId: todaysWorkout.planId ?? "none",
            workoutNumber: todaysWorkout.workoutNumber ? +1 : 0,
            exercises: todaysWorkout.exercises.map((exercise) => ({
              ...exercise,
              description: exercise.description,
            })),
          };
          saveWorkout(newWorkout);
        }
      }
    }
  }, [todaysWorkout]);

  return (
    <div className="flex flex-col items-center rounded-lg  ">
      <WorkoutDisplay3
        workoutPlan={todaysWorkout}
        setWorkoutPlan={setTodaysWorkout}
      />
      <button
        className="mb-4 mt-4 rounded bg-red-600 px-2 py-1 font-bold  hover:bg-red-700"
        onClick={() => endWorkout("")}
      >
        End Workout
      </button>
    </div>
  );
}

interface SelectDayProps {
  setTodaysWorkout: React.Dispatch<
    React.SetStateAction<
      | (ActualWorkout & {
          exercises: (ActualExercise & {
            sets: (exerciseSet & {
              priorSet: exerciseSet | null;
            })[];
          })[];
        })
      | undefined
    >
  >;

  userWorkoutPlan:
    | (ActualWorkout & {
        exercises: (ActualExercise & {
          sets: (exerciseSet & {
            priorSet: exerciseSet | null;
          })[];
        })[];
      })[]
    | undefined;
}

function SelectDay({ userWorkoutPlan, setTodaysWorkout }: SelectDayProps) {
  return (
    <div className="rounded-lg bg-slate-800 p-4  shadow-md">
      {userWorkoutPlan &&
        userWorkoutPlan.map((workout) => (
          <div
            key={workout.workoutId}
            className="my-2 flex items-center justify-between"
          >
            <div className="text-lg font-semibold text-slate-100">
              {workout.description}: {workout.nominalDay}
            </div>
            <button
              value={workout.nominalDay}
              className="m-1 inline-flex items-center rounded bg-green-600 px-2 py-1 font-bold  hover:bg-green-500"
              onClick={() => setTodaysWorkout(workout)}
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

const emptySet = { rir: 3, reps: 5, weight: 0 };

interface display3Props {
  workoutPlan: ActualWorkout & {
    exercises: (ActualExercise & {
      sets: (exerciseSet & {
        priorSet: exerciseSet | null;
      })[];
    })[];
  };

  setWorkoutPlan: React.Dispatch<
    React.SetStateAction<
      | (ActualWorkout & {
          exercises: (ActualExercise & {
            sets: (exerciseSet & {
              priorSet: exerciseSet | null;
            })[];
          })[];
        })
      | undefined
    >
  >;
}
function WorkoutDisplay3({
  workoutPlan,
  setWorkoutPlan,
}: display3Props) {
  console.log("workoutplan: ");
  console.log(workoutPlan);

  function updateWorkoutPlan(
    exercise: ActualExercise & {
      sets: (exerciseSet & {
        priorSet: exerciseSet | null;
      })[];
    },
    workoutId: string,
    exerciseId: string
  ) {
    if (workoutPlan && workoutPlan.exercises) {
      //exercise in workout to update
      setWorkoutPlan((prevWorkoutPlan) => {
        if (!prevWorkoutPlan) {
          return prevWorkoutPlan;
        }
        const newWorkout = { ...prevWorkoutPlan };
        newWorkout.exercises = [...newWorkout.exercises];
        if (newWorkout) {
          const exerciseIndex = newWorkout.exercises.findIndex(
            (oldExercise) => oldExercise.exerciseId === exerciseId
          );
          if (exerciseIndex !== -1) {
            newWorkout.exercises[exerciseIndex] = exercise;
          }
        }
        return newWorkout;
      });
    }
  }

  function removeExercise(workoutNumber: string, exerciseId: string) {
    setWorkoutPlan((prevWorkoutPlan) => {
      if (prevWorkoutPlan) {
        const updatedWorkoutPlan = { ...prevWorkoutPlan };
        const updatedExercises = prevWorkoutPlan?.exercises.filter(
          (exercise) => exercise.exerciseId !== exerciseId
        );
        return { ...prevWorkoutPlan, exercises: updatedExercises };
      }
    });
  }

  function addExercise(workoutNumber: string, exerciseIndex: number) {
    console.log("workout", workoutNumber);
    console.log("exercise", exerciseIndex);
    const tempExerciseId = createUniqueId();
    const newExercise: ActualExercise & {
      sets: (exerciseSet & {
        priorSet: null;
      })[];
    } = {
      description: "New Exercise",
      exerciseId: tempExerciseId,
      date: new Date(),
      workoutId: workoutPlan ? workoutPlan.workoutId : "none",
      sets: [
        {
          date: new Date(),
          exerciseId: tempExerciseId,
          setId: createUniqueId(),
          weight: 0,
          reps: 5,
          rir: 3,
          lastSetId: null,
          priorSet: null,
        },
      ],
    };

    setWorkoutPlan((prevWorkoutPlan) => {
      if (!prevWorkoutPlan) {
        return prevWorkoutPlan;
      }

      const updatedWorkoutPlan = { ...prevWorkoutPlan };
      if (updatedWorkoutPlan && updatedWorkoutPlan.exercises) {
        const newExercises = [
          ...updatedWorkoutPlan.exercises.slice(0, exerciseIndex + 1),
          newExercise,
          ...updatedWorkoutPlan.exercises.slice(exerciseIndex + 1),
        ];
        updatedWorkoutPlan.exercises = newExercises;
      }
      return updatedWorkoutPlan;
    });
  }

  return (
    <div className="flex flex-col items-center rounded-lg ">
      {workoutPlan && (
        <div key={"w" + workoutPlan.workoutId.toString()} className="w-full">
          <div className="pt-1 text-center text-2xl font-semibold  text-slate-300">
            {workoutPlan.description}: {workoutPlan.nominalDay}
          </div>
          <div className="flex flex-col items-center">
            {workoutPlan.exercises &&
              workoutPlan.exercises.map((exercise, exerciseNumber) => (
                <div
                  className="rounded-lg p-1 "
                  key={exercise.exerciseId.toString()}
                >
                  <ExerciseDisplay
                    removeExercise={removeExercise}
                    workoutNumber={workoutPlan.workoutId}
                    exerciseNumber={exercise.exerciseId}
                    exerciseIndex={exerciseNumber}
                    updatePlan={updateWorkoutPlan}
                    addExercise={addExercise}
                    key={
                      workoutPlan.workoutNumber
                        ? workoutPlan.workoutNumber.toString()
                        : "none" + exerciseNumber.toString()
                    }
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
interface ExerciseDisplayProps {
  exercise: ActualExercise & {
    sets: (exerciseSet & {
      priorSet: exerciseSet | null;
    })[];
  };
  workoutNumber: string;
  exerciseNumber: string;
  exerciseIndex: number;
  addExercise: (workoutNumber: string, exerciseIndex: number) => void;
  updatePlan: (
    exercise: ActualExercise & {
      sets: (exerciseSet & {
        priorSet: exerciseSet | null;
      })[];
    },
    workoutId: string,
    exerciseId: string
  ) => void;

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
  const [sets, setSets] = useState<
    (exerciseSet & {
      priorSet: exerciseSet | null;
    })[]
  >(exercise.sets);

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

  function handleSetChange(
    set: exerciseSet & { priorSet: exerciseSet | null },
    index: number
  ) {
    const newSets = [...sets];
    newSets[index] = set;
    setSets(newSets);
  }
  function handleSaveButton() {
    const newData: ActualExercise & {
      sets: (exerciseSet & { priorSet: exerciseSet | null })[];
    } = {
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
    const newSet: exerciseSet & { priorSet: null } = {
      date: new Date(),
      exerciseId: exercise.exerciseId,
      setId: createUniqueId(),
      weight: 0,
      reps: 5,
      rir: 3,
      lastSetId: null,
      priorSet: null,
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
        <button
          onClick={handleAddExercise}
          className="m-1 rounded bg-blue-600 px-2 py-1 font-bold  hover:bg-blue-700"
        >
          Add Exercise
        </button>
      </div>
    </div>
  );
}
