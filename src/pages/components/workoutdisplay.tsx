import { v4 } from "uuid";
import { Workout, Exercise, exerciseSet } from "@prisma/client";
import ExerciseDisplay from "./exercisedisplay";
import { api } from "~/utils/api";
import useWorkoutStore from "~/lib/store";

interface display3Props {
  workoutPlan: Workout & {
    exercises: (Exercise & {
      sets: (exerciseSet & {
        priorSet?: exerciseSet | null;
      })[];
    })[];
  };
}
function WorkoutDisplay3({ workoutPlan }: display3Props) {
  const { workout, updateWorkout, addExercise, removeWorkout } =
    useWorkoutStore();

  return (
    <div className="flex w-11/12 max-w-sm flex-col items-center rounded-lg">
      {workout && (
        <div
          key={"w" + workout.workout.workoutId.toString()}
          className="w-full"
        >
          <div className="flex w-full flex-col items-center">
            {workout.workout.exercises &&
              workout.workout.exercises
                .sort((a, b) => {
                  if (a.exerciseOrder === b.exerciseOrder) {
                    return (
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                  }
                  return a.exerciseOrder - b.exerciseOrder;
                })
                .map((exercise, exerciseNumber) => (
                  <div
                    className="w-full p-1"
                    key={exercise.exerciseId.toString()}
                  >
                    <ExerciseDisplay
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
