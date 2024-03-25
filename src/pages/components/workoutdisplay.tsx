import { v4 } from "uuid";
import { Workout, Exercise, exerciseSet } from "@prisma/client";
import ExerciseDisplay from "./exercisedisplay";

interface display3Props {
  workoutPlan: Workout & {
    exercises: (Exercise & {
      sets: (exerciseSet & {
        priorSet?: exerciseSet | null;
      })[];
    })[];
  };

  setWorkoutPlan: React.Dispatch<
    React.SetStateAction<
      (Workout & {
          exercises: (Exercise & {
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
  function updateWorkoutPlan(
    exercise: Exercise & {
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
        const exerciseIndex = newWorkout.exercises.findIndex(
          (oldExercise) => oldExercise.exerciseId === exerciseId
        );
        if (exerciseIndex !== -1) {
          newWorkout.exercises[exerciseIndex] = exercise;
        }
        return newWorkout;
      });
    }
  }

  function removeExercise(workoutNumber: string, exerciseId: string) {
    setWorkoutPlan((prevWorkoutPlan) => {
      if (prevWorkoutPlan) {
        const updatedExercises = prevWorkoutPlan?.exercises.filter(
          (exercise) => exercise.exerciseId !== exerciseId
        );
        return { ...prevWorkoutPlan, exercises: updatedExercises };
      }
    });
  }

  function addExercise(
    exerciseIndex: number,
    exercise: Exercise & {
      sets: exerciseSet[];
    }
  ) {
    setWorkoutPlan((prevWorkoutPlan) => {
      if (!prevWorkoutPlan) {
        return prevWorkoutPlan;
      }

      const updatedWorkoutPlan = { ...prevWorkoutPlan };
      if (updatedWorkoutPlan && updatedWorkoutPlan.exercises) {
        const newExercises = [
          ...updatedWorkoutPlan.exercises.slice(0, exerciseIndex + 1),
          exercise,
          ...updatedWorkoutPlan.exercises.slice(exerciseIndex + 1),
        ];
        updatedWorkoutPlan.exercises = newExercises;
      }
      return updatedWorkoutPlan;
    });
  }

  return (
    <div className="flex flex-col items-center rounded-lg w-11/12 max-w-sm">
      {workoutPlan && (
        <div key={"w" + workoutPlan.workoutId.toString()} className="w-full">
          <div className="flex flex-col items-center w-full">
            {workoutPlan.exercises &&
              workoutPlan.exercises
              .sort((a,b)=>a.exerciseOrder - b.exerciseOrder)
              .map((exercise, exerciseNumber) => (
                <div
                  className="p-1 w-full"
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
