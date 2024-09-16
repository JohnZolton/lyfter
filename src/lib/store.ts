import { create } from "zustand";
import { Exercise, exerciseSet, Workout } from "@prisma/client";
import { cursorTo } from "readline";
import { MoveDown } from "lucide-react";

export interface fullWorkout {
  workout:
    | Workout & {
        exercises: (Exercise & {
          sets: (exerciseSet & {
            priorSet?: exerciseSet | null;
          })[];
          deloadDenied?: boolean;
        })[];
      };
}

interface WorkoutState {
  workout: fullWorkout | undefined;
  removeWorkout: (workout: fullWorkout) => void;
  updateWorkout: (updatedWorkout: fullWorkout | undefined) => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exercise: Exercise) => void;
  updateExercise: (exercise: Exercise) => void;
  replaceExercise: (oldExercise: Exercise, newExercise: Exercise) => void;
  addSet: (newSet: exerciseSet) => void;
  removeSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, set: exerciseSet) => void;
  moveExerciseUp: (movedUpExercise: Exercise) => void;
  moveExerciseDown: (movedUpExercise: Exercise) => void;
  handleTakeDeload: (curSet: exerciseSet) => void;
  setDeloadDenied: (curSet: exerciseSet) => void;
}

const useWorkoutStore = create<WorkoutState>((set) => ({
  workout: undefined,
  updateWorkout: (updatedWorkout) => {
    set((state) => {
      if (!state.workout) {
        return {
          workout: updatedWorkout,
        };
      }
      if (updatedWorkout === undefined) {
        return { workout: undefined };
      }
      const newState = {
        workout: {
          ...state.workout,
          workout: {
            ...state.workout.workout,
            description: updatedWorkout.workout.description,
            nominalDay: updatedWorkout.workout.nominalDay,
          },
        },
      };
      return newState;
    });
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
      return newState;
    }),
  updateExercise: (updatedExercise) =>
    set((state) => {
      if (!state.workout) return {};
      const newExercises = [
        ...state.workout.workout.exercises.filter(
          (exercise) => exercise.exerciseId !== updatedExercise.exerciseId
        ),
      ];
      const newState = {
        workout: {
          ...state.workout,
          workout: {
            ...state.workout.workout,
            exercises: [...newExercises, updatedExercise],
          },
        },
      };
      return newState;
    }),
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
      return newState;
    }),
  addSet: (newSet) => {
    set((state) => {
      if (!state.workout) return {};

      const updatedExercise = state.workout.workout.exercises.map(
        (exercise) => {
          if (exercise.exerciseId === newSet.exerciseId) {
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
              if (
                oldSet.setNumber > updatedSet.setNumber &&
                (oldSet.reps === 0 ||
                  oldSet.reps === undefined ||
                  oldSet.reps === null)
              ) {
                oldSet.weight = updatedSet.weight;
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
      const exercises = [...state.workout.workout.exercises];
      const movedIndex = exercises.findIndex(
        (ex) => ex.exerciseId === movedUpExercise.exerciseId
      );
      if (movedIndex <= 0 || movedIndex >= exercises.length) return {};

      const earlierEx = exercises[movedIndex - 1];
      const currEx = exercises[movedIndex];
      if (earlierEx && currEx) {
        exercises[movedIndex - 1] = currEx;
        exercises[movedIndex] = earlierEx;
      }

      // Normalize exercise orders
      const normalizedExercises = exercises.map((exercise, index) => ({
        ...exercise,
        exerciseOrder: index + 1,
      }));

      const newState = {
        workout: {
          ...state.workout,
          workout: {
            ...state.workout.workout,
            exercises: normalizedExercises,
          },
        },
      };
      return newState;
    });
  },
  moveExerciseDown: (movedDownExercise) => {
    set((state) => {
      if (!state.workout) return {};
      const exercises = [...state.workout.workout.exercises];
      const movedIndex = exercises.findIndex(
        (ex) => ex.exerciseId === movedDownExercise.exerciseId
      );
      if (movedIndex < 0 || movedIndex >= exercises.length) return {};

      const earlierEx = exercises[movedIndex + 1];
      const currEx = exercises[movedIndex];
      if (earlierEx && currEx) {
        exercises[movedIndex + 1] = currEx;
        exercises[movedIndex] = earlierEx;
      }

      // Normalize exercise orders
      const normalizedExercises = exercises.map((exercise, index) => ({
        ...exercise,
        exerciseOrder: index + 1,
      }));

      const newState = {
        workout: {
          ...state.workout,
          workout: {
            ...state.workout.workout,
            exercises: normalizedExercises,
          },
        },
      };
      return newState;
    });
  },
  handleTakeDeload: (curSet) => {
    set((state) => {
      if (!state.workout) return {};
      const updatedExercises = state.workout.workout.exercises.map(
        (exercise) => {
          if (exercise.exerciseId === curSet.exerciseId) {
            const newSets = exercise.sets.filter(
              (set) => set.setNumber <= curSet.setNumber
            );
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
      return newState;
    });
  },
  setDeloadDenied: (curSet) => {
    set((state) => {
      if (!state.workout) return {};
      const updatedExercises = state.workout.workout.exercises.map(
        (exercise) => {
          if (exercise.exerciseId === curSet.exerciseId) {
            return { ...exercise, deloadDenied: true };
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
      return newState;
    });
  },
}));

export default useWorkoutStore;
