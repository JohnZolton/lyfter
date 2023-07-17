import { v4 } from "uuid";
import { ActualWorkout, ActualExercise, exerciseSet } from "@prisma/client";
import ExerciseDisplay from "./exercisedisplay";

function createUniqueId(): string {
  return v4();
}

const emptySet = { rir: 3, reps: 5, weight: 0 };

interface display3Props {
  workoutPlan: ActualWorkout & {
    exercises: (ActualExercise & {
      sets: (exerciseSet & {
        priorSet?: exerciseSet | null;
      })[];
    })[];
  };

  setWorkoutPlan: React.Dispatch<
    React.SetStateAction<
      | (ActualWorkout & {
          exercises: (ActualExercise & {
            sets: (exerciseSet & {
              priorSet?: exerciseSet | null;
            })[];
          })[];
        })
      | undefined
    >
  >;
}
function WorkoutDisplay3({ workoutPlan, setWorkoutPlan }: display3Props) {
  console.log("workoutplan: ");
  console.log(workoutPlan);

  function updateWorkoutPlan(
    exercise: ActualExercise & {
      sets: (exerciseSet & {
        priorSet?: exerciseSet | null;
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

export default WorkoutDisplay3;
