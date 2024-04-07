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
      | (Workout & {
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
  function moveExerciseUp(index: number, id: string) {
    const exToUpdate = workoutPlan.exercises.find(
      (exercise) => exercise.exerciseId === id
    );
    const exBefore = workoutPlan.exercises.find(
      (exercise) => exercise.exerciseOrder === index - 1
    );

    if (exToUpdate && exBefore) {
      exToUpdate.exerciseOrder -= 1;
      exBefore.exerciseOrder += 1;

      updateWorkoutPlan(exToUpdate, workoutPlan.workoutId, id);
      updateWorkoutPlan(exBefore, workoutPlan.workoutId, exBefore.exerciseId);
    }
  }
  function moveExerciseDown(index: number, id: string) {
    const exToUpdate = workoutPlan.exercises.find(
      (exercise) => exercise.exerciseId === id
    );
    const exAfter = workoutPlan.exercises.find(
      (exercise) => exercise.exerciseOrder === index + 1
    );

    if (exToUpdate && exAfter) {
      exToUpdate.exerciseOrder += 1;
      exAfter.exerciseOrder -= 1;

      updateWorkoutPlan(exToUpdate, workoutPlan.workoutId, id);
      updateWorkoutPlan(exAfter, workoutPlan.workoutId, exAfter.exerciseId);
    }
  }

  return (
    <div className="flex w-11/12 max-w-sm flex-col items-center rounded-lg">
      {workoutPlan && (
        <div key={"w" + workoutPlan.workoutId.toString()} className="w-full">
          <div className="flex w-full flex-col items-center">
            {workoutPlan.exercises &&
              workoutPlan.exercises
                .sort((a, b) => a.exerciseOrder - b.exerciseOrder)
                .map((exercise, exerciseNumber) => (
                  <div
                    className="w-full p-1"
                    key={exercise.exerciseId.toString()}
                  >
                    <ExerciseDisplay
                      removeExercise={removeExercise}
                      workoutNumber={workoutPlan.workoutId}
                      exerciseNumber={exercise.exerciseId}
                      exerciseIndex={exerciseNumber}
                      updatePlan={updateWorkoutPlan}
                      addExercise={addExercise}
                      moveUp={moveExerciseUp}
                      moveDown={moveExerciseDown}
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
