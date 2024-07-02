import { create } from "zustand";
import {
  Exercise,
  exerciseSet,
  Workout,
  WorkoutPlan,
  MuscleGroup,
  Pump,
  RPE,
} from "@prisma/client";
import { api } from "~/utils/api";

export interface fullWorkout {
  workout:
    | Workout & {
        exercises: (Exercise & {
          sets: exerciseSet[];
        })[];
      };
}

interface fullExercise {
  exercise: Exercise & { sets: exerciseSet[] };
}
interface WorkoutState {
  workout: fullWorkout | undefined;
  removeWorkout: (workout: fullWorkout) => void;
  updateWorkout: (updatedWorkout: fullWorkout) => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exercise: Exercise) => void;
  updateExercise: (exercise: Exercise) => void;
  replaceExercise: (oldExercise: Exercise, newExercise: Exercise) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, set: exerciseSet) => void;
  moveExerciseUp: (movedUpExercise: Exercise) => void;
  moveExerciseDown: (movedUpExercise: Exercise) => void;
  handleMissedTarget: (exerciseId: string, setIndex: number) => void;
}

const useWorkoutStore = create<WorkoutState>((set) => ({
  workout: undefined,
  updateWorkout: (updatedWorkout) => {
    set(() => ({
      workout: updatedWorkout,
    }));
  },
  removeWorkout: (workout) => {
    console.log(workout);
    set(() => ({
      workout: undefined,
    }));
  },
  addExercise: (newExercise) =>
    set((state) => {
      if (!state.workout) return {};
      const newExercises = [...state.workout.workout.exercises, newExercise];
      const newState = {
        workout: {
          ...state.workout,
          workout: {
            ...state.workout.workout,
            exercises: newExercises,
          },
        },
      };
      console.log("new state: ", newState);
      return newState;
    }),
  removeExercise: (removedExercise) =>
    set((state) => {
      if (!state.workout) return {};
      const newExercises = [
        ...state.workout.workout.exercises.filter(
          (exercise) => exercise.exerciseId !== removedExercise.exerciseId
        ),
      ];
      const newState = {
        workout: {
          ...state.workout,
          workout: {
            ...state.workout.workout,
            exercises: newExercises,
          },
        },
      };
      console.log("new state: ", newState);
      return newState;
    }),
  updateExercise: (updatedExercise) =>
    set((state) => ({
      workout: state?.workout
        ? {
            ...state.workout,
            exercises: [
              ...state.workout.workout.exercises.filter(
                (exercise) => exercise.exerciseId !== updatedExercise.exerciseId
              ),
              updatedExercise,
            ],
          }
        : undefined,
    })),
  replaceExercise: (newExercise, oldExercise) =>
    set((state) => {
      if (!state.workout) return {};
      const allExercises = state.workout.workout.exercises.filter(
        (exercise) => exercise.exerciseId !== oldExercise.exerciseId
      );
      const newExercises = [...allExercises, newExercise];
      const newState = {
        workout: {
          ...state.workout,
          workout: {
            ...state.workout.workout,
            exercises: newExercises,
          },
        },
      };
      console.log("new state: ", newState);
      return newState;
    }),
  addSet: (exerciseId) => {
    set((state) => {
      if (!state.workout) return {};

      const updatedExercise = state.workout.workout.exercises.map(
        (exercise) => {
          if (exercise.exerciseId === exerciseId) {
            const lastSet = exercise.sets[exercise.sets.length - 1];
            if (!lastSet) return {};
            const newSet: exerciseSet = {
              ...lastSet,
              reps: 0,
              setId: `newSetId${lastSet?.exerciseId}-${
                exercise.sets.length + 1
              }`,
              setNumber: lastSet?.setNumber ?? exercise.sets.length + 1,
              date: lastSet?.date,
            };
            return {
              ...exercise,
              sets: [...exercise.sets, newSet],
            };
          }
          return exercise;
        }
      );
      const newState = {
        workout: {
          ...state.workout,
          workout: {
            ...state.workout.workout,
            exercises: updatedExercise,
          },
        },
      };
      console.log("new state: ", newState);
      return newState;
    });
  },
  removeSet: (exerciseId) => {
    set((state) => {
      if (!state.workout) return {};
      const updatedExercise = state.workout.workout.exercises.map(
        (exercise) => {
          if (exercise.exerciseId === exerciseId) {
            const removedSet = exercise.sets[exercise.sets.length - 1];
            const newSets = exercise.sets.slice(0, exercise.sets.length - 1);
            return { ...exercise, sets: newSets };
          }
          return exercise;
        }
      );
      const newState = {
        workout: {
          ...state.workout,
          workout: {
            ...state.workout.workout,
            exercises: updatedExercise,
          },
        },
      };
      return newState;
    });
  },
  updateSet: (exerciseId, updatedSet) => {
    set((state) => {
      if (!state.workout) return {};
      const updatedExercise = state.workout.workout.exercises.map(
        (exercise) => {
          if (exercise.exerciseId === exerciseId) {
            const newSets = exercise.sets.map((oldSet) => {
              if (oldSet.setId === updatedSet.setId) {
                return { ...updatedSet };
              }
              return oldSet;
            });
            return { ...exercise, sets: newSets };
          }
          return exercise;
        }
      );
      const newState = {
        workout: {
          ...state.workout,
          workout: {
            ...state.workout.workout,
            exercises: updatedExercise,
          },
        },
      };
      return newState;
    });
  },
  moveExerciseUp: (movedUpExercise) => {
    set((state) => {
      if (!state.workout) return {};
      const updatedExercises = state.workout.workout.exercises.map(
        (exercise) => {
          if (exercise.exerciseOrder === movedUpExercise.exerciseOrder - 1) {
            return { ...exercise, exerciseOrder: exercise.exerciseOrder + 1 };
          }
          if (exercise.exerciseId === movedUpExercise.exerciseId) {
            return { ...exercise, exerciseOrder: exercise.exerciseOrder - 1 };
          }
          return exercise;
        }
      );
      const newState = {
        workout: {
          ...state.workout,
          workout: {
            ...state.workout.workout,
            exercises: updatedExercises,
          },
        },
      };
      console.log("new state: ", newState);
      return newState;
    });
  },
  moveExerciseDown: (movedDownExercise) => {
    set((state) => {
      if (!state.workout) return {};
      const updatedExercises = state.workout.workout.exercises.map(
        (exercise) => {
          if (exercise.exerciseOrder === movedDownExercise.exerciseOrder + 1) {
            return { ...exercise, exerciseOrder: exercise.exerciseOrder - 1 };
          }
          if (exercise.exerciseId === movedDownExercise.exerciseId) {
            return { ...exercise, exerciseOrder: exercise.exerciseOrder + 1 };
          }
          return exercise;
        }
      );
      const newState = {
        workout: {
          ...state.workout,
          workout: {
            ...state.workout.workout,
            exercises: updatedExercises,
          },
        },
      };
      console.log("new state: ", newState);
      return newState;
    });
  },
  handleMissedTarget: (exerciseId, setIndex) => {
    set((state) => {
      if (!state.workout) return {};
      const updatedExercises = state.workout.workout.exercises.map(
        (exercise) => {
          if (exercise.exerciseId === exerciseId) {
            const newSets = exercise.sets.slice(0, setIndex + 1);
            return { ...exercise, sets: newSets };
          }
          return exercise;
        }
      );
      const newState = {
        workout: {
          ...state.workout,
          workout: {
            ...state.workout.workout,
            exercises: updatedExercises,
          },
        },
      };
      console.log("new state: ", newState);
      return newState;
    });
  },
}));

export default useWorkoutStore;
