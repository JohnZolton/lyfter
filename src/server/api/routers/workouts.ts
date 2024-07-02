import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

import type { Workout, Exercise, exerciseSet } from "@prisma/client";
import { MuscleGroup, Pump, RPE } from "@prisma/client";
import { v4 } from "uuid";

export const getAllWorkouts = createTRPCRouter({
  newTestPlanTwo: privateProcedure
    .input(
      z.object({
        description: z.string().optional(),
        workouts: z.array(
          z.object({
            description: z.string(),
            nominalDay: z.string(),
            workoutId: z.string(),
            exercises: z.array(
              z.object({
                description: z.string(),
                muscleGroup: z.string(),
                sets: z.number(),
              })
            ),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { workouts } = input;
      const workoutArray: Workout[] = [];

      const plan = await ctx.prisma.workoutPlan.create({
        data: {
          userId: ctx.userId,
          description: input.description ?? "none",
          workouts: {
            create: workouts.map((workout) => ({
              nominalDay: workout.nominalDay,
              userId: ctx.userId,
              description: workout.description,
              originalWorkoutId: workout.workoutId,
              workoutNumber: 0,
              exercises: {
                create: workout.exercises.map((exercise, index) => ({
                  exerciseOrder: index,
                  description: exercise.description,
                  muscleGroup:
                    MuscleGroup[
                      exercise.muscleGroup as keyof typeof MuscleGroup
                    ],
                  sets: {
                    create: Array.from({ length: exercise.sets }).map(
                      (_, index) => ({
                        setNumber: index,
                        rir: 3,
                      })
                    ),
                  },
                })),
              },
            })),
          },
        },
        include: {
          workouts: {
            include: {
              exercises: {
                include: { sets: true },
              },
            },
          },
        },
      });
      workoutArray.push(...plan.workouts);

      if (!workoutArray) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Failed to create workout plan",
        });
      }
      return { workoutPlan: plan, workouts: workoutArray };
    }),

  getPlanByUserId: privateProcedure.query(async ({ ctx }) => {
    const workouts = await ctx.prisma.workoutPlan.findMany({
      where: {
        userId: ctx.userId,
      },
      orderBy: [{ date: "desc" }],
      take: 10,
      include: {
        workouts: {
          include: {
            exercises: {
              include: { sets: { include: { priorSet: true } } },
              orderBy: { date: "asc" },
            },
          },
        },
      },
    });
    if (!workouts) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No workout with that User",
      });
    }
    return workouts;
  }),

  resetCurrentPlan: privateProcedure.mutation(async ({ ctx }) => {
    const allPlans = await ctx.prisma.workoutPlan.findMany({
      where: {
        userId: ctx.userId,
      },
      include: {
        workouts: {
          include: {
            exercises: {
              include: { sets: true },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });
    const currentPlan = allPlans[0];
    console.log("currentPlan: ", currentPlan);
    // sort into weeks
    // get final week exercises
    // get weight from week 2 if exercises match
    // set as starting weight
    const weekNumber = currentPlan?.workouts.reduce(
      (maxWeekNumber, workout) => {
        if (workout && workout.workoutNumber) {
          return workout.workoutNumber > maxWeekNumber
            ? workout.workoutNumber
            : maxWeekNumber;
        } else {
          return maxWeekNumber;
        }
      },
      0
    ); //find max workoutNumber
    console.log(weekNumber);
    const finalWeek = currentPlan?.workouts.filter(
      (workout) => workout.workoutNumber === weekNumber
    );
    console.log("final week: ", finalWeek);

    const workoutMap = new Map<
      string,
      Workout & { exercises: (Exercise & { sets: exerciseSet[] })[] }
    >();
    currentPlan?.workouts.forEach((workout) => {
      if (workout.originalWorkoutId) {
        const existingWorkout = workoutMap.get(workout.originalWorkoutId);
        if (
          !existingWorkout ||
          (workout.workoutNumber ?? -Infinity) >
            (existingWorkout.workoutNumber ?? -Infinity)
        ) {
          workoutMap.set(workout.originalWorkoutId, workout);
        }
      }
    });
    const finalWorkouts = Array.from(workoutMap.values());
    console.log(finalWorkouts);

    if (finalWorkouts) {
      const newPlan = await ctx.prisma.workoutPlan.create({
        data: {
          userId: ctx.userId,
          description: currentPlan?.description ?? "No Description",
          workouts: {
            create: finalWorkouts.map((workout) => ({
              userId: ctx.userId,
              description: workout.description,
              nominalDay: workout.nominalDay,
              originalWorkoutId: v4(),
              workoutNumber: 0,
              exercises: {
                create: workout.exercises.map((exercise) => ({
                  description: exercise.description,
                  muscleGroup:
                    MuscleGroup[
                      exercise.muscleGroup as keyof typeof MuscleGroup
                    ],
                  sets: {
                    create: exercise.sets.slice(0, 4).map((set, index) => ({
                      setNumber: index,
                      weight: set.weight,
                      targetWeight: set.weight,
                      reps: 0,
                      rir: 3,
                    })),
                  },
                  exerciseOrder: exercise.exerciseOrder,
                })),
              },
            })),
          },
        },
        include: {
          workouts: {
            include: {
              exercises: true,
            },
          },
        },
      });
      console.log("newplan: ", newPlan);
      return newPlan;
    }
  }),

  updateWorkoutPlan: privateProcedure
    .input(
      z.object({
        description: z.string(),
        nominalDay: z.string(),
        planId: z.string(),
        exercises: z.array(
          z.object({
            description: z.string(),
            muscleGroup: z.string(),
            sets: z.array(
              z.object({
                weight: z.number(),
                reps: z.number(),
                rir: z.number(),
              })
            ),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const savedWorkout = await ctx.prisma.workout.create({
        data: {
          userId: ctx.userId,
          description: input.description,
          nominalDay: input.nominalDay,
          planId: input.planId,
          workoutNumber: 0,
          exercises: {
            create: input.exercises.map((exercise, index) => ({
              description: exercise.description,
              muscleGroup:
                MuscleGroup[exercise.muscleGroup as keyof typeof MuscleGroup],
              sets: {
                create: exercise.sets.map((set, index) => ({
                  setNumber: index,
                  weight: set.weight,
                  reps: set.reps,
                  rir: set.rir,
                })),
              },
              exerciseOrder: index,
            })),
          },
        },
        include: {
          exercises: {
            include: {
              sets: true,
            },
          },
        },
      });
      return savedWorkout;
    }),

  removeWorkout: privateProcedure
    .input(
      z.object({
        workoutId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const deletedWorkout = await ctx.prisma.workout.delete({
        where: { workoutId: input.workoutId },
      });
      return deletedWorkout;
    }),

  saveWorkout: privateProcedure
    .input(
      z.object({
        description: z.string(),
        nominalDay: z.string(),
        planId: z.string(),
        exercises: z.array(
          z.object({
            description: z.string(),
            muscleGroup: z.string(),
            sets: z.array(
              z.object({
                weight: z.number(),
                reps: z.number(),
                rir: z.number(),
              })
            ),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const savedWorkout = await ctx.prisma.workout.create({
        data: {
          userId: ctx.userId,
          description: input.description,
          nominalDay: input.nominalDay,
          workoutNumber: 0,
          exercises: {
            create: input.exercises.map((exercise, index) => ({
              description: exercise.description,
              muscleGroup:
                MuscleGroup[exercise.muscleGroup as keyof typeof MuscleGroup],
              exerciseOrder: index,
              sets: {
                create: exercise.sets.map((set, index) => ({
                  weight: set.weight,
                  reps: set.reps,
                  rir: set.rir,
                  setNumber: index,
                })),
              },
            })),
          },
        },
        include: {
          exercises: {
            include: {
              sets: true,
            },
          },
        },
      });
      return savedWorkout;
    }),

  getUniqueWeekWorkoutsAndExercises: privateProcedure.query(async ({ ctx }) => {
    const workoutPlan = await ctx.prisma.workoutPlan.findFirst({
      where: { userId: ctx.userId },
      orderBy: [{ date: "desc" }],
      include: {
        workouts: {
          orderBy: [{ date: "desc" }],
          include: {
            exercises: { include: { sets: { include: { priorSet: true } } } },
          },
        },
      },
    });

    return { workoutPlan };
  }),
  getUniqueWeekWorkouts: privateProcedure.query(async ({ ctx }) => {
    const workoutPlan = await ctx.prisma.workoutPlan.findFirst({
      where: { userId: ctx.userId },
      orderBy: [{ date: "desc" }],
      include: {
        workouts: {
          orderBy: [{ date: "desc" }],
        },
      },
    });

    const workoutMap = new Map<string, Workout>();
    workoutPlan?.workouts.forEach((workout) => {
      if (workout.originalWorkoutId) {
        const existingWorkout = workoutMap.get(workout.originalWorkoutId);
        if (
          !existingWorkout ||
          (workout.workoutNumber ?? -Infinity) >
            (existingWorkout.workoutNumber ?? -Infinity)
        ) {
          workoutMap.set(workout.originalWorkoutId, workout);
        }
      }
    });
    const filteredPlan = Array.from(workoutMap.values());
    console.log(filteredPlan);
    return { filteredPlan };
  }),

  fetchWorkoutById: privateProcedure
    .input(
      z.object({
        workoutId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const workout = await ctx.prisma.workout.findFirst({
        where: { userId: ctx.userId, workoutId: input.workoutId },
        include: {
          exercises: { include: { sets: { include: { priorSet: true } } } },
        },
      });

      if (!workout || !workout) {
        throw new Error("Workout not found");
      }

      return { workout };
    }),

  getWorkoutById: privateProcedure
    .input(
      z.object({
        workoutId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workout = await ctx.prisma.workout.findFirst({
        where: { userId: ctx.userId, workoutId: input.workoutId },
        include: {
          exercises: { include: { sets: { include: { priorSet: true } } } },
        },
      });

      if (!workout || !workout) {
        throw new Error("Workout not found");
      }

      return { workout };
    }),

  replaceExercise: privateProcedure
    .input(
      z.object({
        exerciseId: z.string(),
        temporary: z.boolean(),
        title: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const oldExercise = await ctx.prisma.exercise.findUnique({
        where: { exerciseId: input.exerciseId },
        include: { sets: true },
      });

      console.log(oldExercise);
      if (!oldExercise) {
        return;
      }
      let lastValidExercise = oldExercise;
      while (lastValidExercise.temporary && lastValidExercise.priorExerciseId) {
        const previousExercise = await ctx.prisma.exercise.findFirst({
          where: { exerciseId: lastValidExercise.priorExerciseId },
          include: { sets: { include: { priorSet: true } } },
        });
        if (!previousExercise) {
          break;
        }
        lastValidExercise = previousExercise;
      }
      const newExercise = await ctx.prisma.exercise.create({
        data: {
          description: input.title,
          exerciseOrder: oldExercise?.exerciseOrder,
          muscleGroup: oldExercise?.muscleGroup,
          workoutId: oldExercise?.workoutId,
          temporary: input.temporary,
          priorExerciseId: lastValidExercise.exerciseId,
          sets: {
            create: oldExercise.sets.map((set, index) => {
              const setData = {
                setNumber: index,
                targetWeight: 0,
                weight: 0,
                targetReps: 5,
                rir: set.rir,
                lastSetId: null,
              };
              return setData;
            }),
          },
        },
        include: { sets: true },
      });
      await ctx.prisma.exercise.delete({
        where: { exerciseId: input.exerciseId },
      });
      return newExercise;
    }),
  startOrCreateNewWorkoutFromPrevious: privateProcedure
    .input(
      z.object({
        priorWorkoutId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const priorWorkout = await ctx.prisma.workout.findUnique({
        where: { workoutId: input.priorWorkoutId },
        include: {
          exercises: {
            include: {
              sets: { include: { priorSet: true } },
            },
          },
        },
      });
      if (!priorWorkout) {
        throw new Error("Prior workout not found");
      }
      if (priorWorkout) {
        const workoutDate = new Date(priorWorkout.date);
        const currentDate = new Date();
        const sixDaysAgo = new Date();
        sixDaysAgo.setDate(currentDate.getDate() - 6);
        if (workoutDate >= sixDaysAgo) {
          return priorWorkout.workoutId;
        }
      }

      interface newSetTemplate {
        targetWeight: number;
        targetReps: number;
        weight: number;
        rir: number;
        setNumber: number | null;
        lastSetId?: string | null;
      }

      const tempExercises = priorWorkout.exercises.filter(
        (exercise) => exercise.temporary
      );
      if (tempExercises) {
      }
      const newExercises = await Promise.all(
        priorWorkout.exercises
          .sort((a, b) => a.exerciseOrder - b.exerciseOrder)
          .map(async (exercise, index) => {
            const newSets: newSetTemplate[] = exercise.sets
              .sort((a, b) => a.setNumber - b.setNumber)
              .map((set, index) => ({
                targetWeight: set.weight ? set.weight + 1 : 0,
                weight: set.weight ? set.weight + 1 : 0,
                targetReps: set.reps ? set.reps + 1 : 5,
                rir: set.rir ?? (set.rir! > 1 ? set.rir! - 1 : 0),
                setNumber: index,
                lastSetId: set.setId,
              }));

            let lastValidExercise = exercise;
            while (
              lastValidExercise.temporary &&
              lastValidExercise.priorExerciseId
            ) {
              const previousExercise = await ctx.prisma.exercise.findFirst({
                where: { exerciseId: lastValidExercise.priorExerciseId },
                include: { sets: { include: { priorSet: true } } },
              });
              if (!previousExercise) {
                break;
              }
              lastValidExercise = previousExercise;
            }
            const newExercise = {
              description: lastValidExercise.description ?? "none",
              muscleGroup: lastValidExercise.muscleGroup,
              exerciseOrder: index,
              priorExerciseId: lastValidExercise.exerciseId,
              sets: newSets,
            };

            if (
              exercise.pump === Pump.low ||
              (exercise.pump == Pump.medium && exercise.RPE !== RPE.veryHard)
            ) {
              newExercise.sets.push({
                targetWeight: newSets[newSets.length - 1]!.targetWeight,
                targetReps: 0,
                weight: newSets[newSets.length - 1]!.weight,
                rir: 3,
                setNumber: newSets.length,
                lastSetId: null,
              });
            }
            if (exercise.RPE === RPE.veryHard) {
              newExercise.sets.pop();
            }
            return newExercise;
          })
      );

      const newWorkout = await ctx.prisma.workout.create({
        data: {
          userId: ctx.userId,
          description: priorWorkout.description,
          nominalDay: priorWorkout.nominalDay,
          planId: priorWorkout.planId,
          workoutNumber: (priorWorkout.workoutNumber || 0) + 1,
          originalWorkoutId:
            priorWorkout.originalWorkoutId || priorWorkout.workoutId,
          exercises: {
            create: newExercises.map((exercise, index) => ({
              description: exercise?.description ?? "none",
              muscleGroup:
                MuscleGroup[exercise?.muscleGroup as keyof typeof MuscleGroup],
              sets: {
                create: exercise?.sets.map((set, index) => {
                  const setData = {
                    setNumber: index,
                    targetWeight: set.targetWeight,
                    weight: set.targetWeight,
                    targetReps: set.targetReps,
                    rir: set.rir,
                    lastSetId: set.lastSetId ?? null,
                  };
                  return setData;
                }),
              },
              exerciseOrder: index,
            })),
          },
        },
        include: {
          exercises: {
            include: {
              sets: {
                include: { priorSet: true },
              },
            },
          },
        },
      });
      return newWorkout.workoutId;
    }),

  addNewExercise: privateProcedure
    .input(
      z.object({
        workoutId: z.string(),
        exerciseNumber: z.number(),
        muscleGroup: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const exercise = await ctx.prisma.exercise.findFirst({
        where: {
          workoutId: input.workoutId,
          exerciseOrder: {
            gte: input.exerciseNumber + 1,
          },
        },
        include: {
          sets: true,
        },
      });
      await ctx.prisma.exercise.updateMany({
        where: {
          workoutId: input.workoutId,
          exerciseOrder: {
            gte: input.exerciseNumber + 1,
          },
        },
        data: {
          exerciseOrder: {
            increment: 1,
          },
        },
      });
      const createdExercise = await ctx.prisma.exercise.create({
        data: {
          workoutId: input.workoutId,
          description: input.description,
          muscleGroup:
            MuscleGroup[input.muscleGroup as keyof typeof MuscleGroup],
          sets: {
            create: {
              weight: 0,
              reps: 0,
              rir: exercise?.sets[0]?.rir || 3,
              setNumber: 0,
            },
          },
          exerciseOrder: input.exerciseNumber + 1,
        },
        include: {
          sets: true,
        },
      });
      const allExercises = await ctx.prisma.exercise.findMany({
        where: { workoutId: input.workoutId },
        orderBy: { exerciseOrder: "asc" },
      });
      const updatePromises = allExercises.map((exercise, index) =>
        ctx.prisma.exercise.update({
          where: { exerciseId: exercise.exerciseId },
          data: { exerciseOrder: index + 1 },
        })
      );
      await Promise.all(updatePromises);
      return createdExercise;
    }),

  deleteExercise: privateProcedure
    .input(
      z.object({
        exerciseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const deletedExercise = await ctx.prisma.exercise.delete({
        where: { exerciseId: input.exerciseId },
      });
      const allExercises = await ctx.prisma.exercise.findMany({
        where: { workoutId: deletedExercise.workoutId },
        orderBy: { exerciseOrder: "asc" },
      });
      const updatePromises = allExercises.map((exercise, index) =>
        ctx.prisma.exercise.update({
          where: { exerciseId: exercise.exerciseId },
          data: { exerciseOrder: index + 1 },
        })
      );
      await Promise.all(updatePromises);
      return deletedExercise;
    }),

  updateWorkoutDescription: privateProcedure
    .input(
      z.object({
        workoutId: z.string(),
        description: z.string(),
        nominalDay: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedWorkout = await ctx.prisma.workout.update({
        where: { workoutId: input.workoutId },
        data: {
          description: input.description,
          nominalDay: input.nominalDay,
        },
      });
      return updatedWorkout;
    }),

  recordExerciseFeedback: privateProcedure
    .input(
      z.object({
        exerciseId: z.string(),
        pump: z.string(),
        RPE: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedExercise = await ctx.prisma.exercise.update({
        where: { exerciseId: input.exerciseId },
        data: {
          pump: Pump[input.pump as keyof typeof Pump],
          RPE: RPE[input.RPE as keyof typeof RPE],
        },
      });
      return updatedExercise;
    }),

  recordExerciseSoreness: privateProcedure
    .input(
      z.object({
        exerciseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedExercise = await ctx.prisma.exercise.update({
        where: { exerciseId: input.exerciseId },
        data: {
          feedbackRecorded: true,
        },
      });
      return updatedExercise;
    }),

  updateExerciseOrder: privateProcedure
    .input(
      z.object({
        exerciseId: z.string(),
        order: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedExercise = await ctx.prisma.exercise.update({
        where: { exerciseId: input.exerciseId },
        data: {
          exerciseOrder: input.order,
        },
      });
      return updatedExercise;
    }),

  updateExerciseDescription: privateProcedure
    .input(
      z.object({
        exerciseId: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedExercise = await ctx.prisma.exercise.update({
        where: { exerciseId: input.exerciseId },
        data: {
          description: input.description,
        },
      });
      return updatedExercise;
    }),

  createSet: privateProcedure
    .input(
      z.object({
        setId: z.string(),
        exerciseId: z.string(),
        weight: z.number().nullable(),
        reps: z.number().nullable(),
        rir: z.number().nullable(),
        setNumber: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedSet = await ctx.prisma.exerciseSet.create({
        data: {
          setId: input.setId,
          exerciseId: input.exerciseId,
          weight: input.weight,
          reps: input.reps,
          rir: input.rir,
          setNumber: input.setNumber,
        },
      });
      return updatedSet;
    }),
  removeSet: privateProcedure
    .input(
      z.object({
        setId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedSet = await ctx.prisma.exerciseSet.delete({
        where: { setId: input.setId },
      });
      return updatedSet;
    }),

  updateSets: privateProcedure
    .input(
      z.object({
        setId: z.string(),
        weight: z.number().nullable(),
        reps: z.number().nullable(),
        rir: z.number().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedSet = await ctx.prisma.exerciseSet.update({
        where: { setId: input.setId },
        data: {
          weight: input.weight,
          reps: input.reps,
          rir: input.rir,
        },
      });
      return updatedSet;
    }),

  getWeekWorkouts: privateProcedure.query(async ({ ctx }) => {
    const workouts = await ctx.prisma.workout.findMany({
      where: {
        userId: ctx.userId,
      },
      include: { exercises: { include: { sets: true } } },
      orderBy: [{ date: "asc" }],
      take: 7,
    });
    if (!workouts) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No workout with that User",
      });
    }
    return workouts;
  }),

  endWorkout: privateProcedure
    .input(
      z.object({
        workoutId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workout = await ctx.prisma.workout.update({
        where: {
          workoutId: input.workoutId,
        },
        data: {
          isCompleted: true,
        },
      });
      return workout;
    }),
});
