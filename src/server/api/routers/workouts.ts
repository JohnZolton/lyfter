import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import type { Workout, Exercise, exerciseSet, WorkoutPlan } from "@prisma/client";
import { v4 } from "uuid";

export const getAllWorkouts = createTRPCRouter({
  newTestPlanTwo: privateProcedure
    .input(
      z.object({
        description: z.string(),
        workouts: z.array(
          z.object({
            description: z.string(),
            nominalDay: z.string(),
            workoutId: z.string(),
            exercises: z.array(
              z.object({
                description: z.string(),
                sets: z.array(
                  z.object({
                    weight: z.number().optional(),
                    reps: z.number().optional(),
                    rir: z.number().optional(),
                  })
                ),
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
          description: input.description,
          workouts: {
            create: workouts.map((workout) => ({
              nominalDay: workout.nominalDay,
              userId: ctx.userId,
              description: workout.description,
              originalWorkoutId: workout.workoutId,
              workoutNumber: 0,
              exercises: {
                create: workout.exercises.map((exercise) => ({
                  description: exercise.description,
                  sets: {
                    create: exercise.sets.map((set) => ({
                      rir:  set.rir
                      //weight: set.weight,
                      //reps: set.reps,
                    })),
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

  updateWorkoutPlan: privateProcedure
    .input(
      z.object({
        description: z.string(),
        nominalDay: z.string(),
        planId: z.string(),
        exercises: z.array(
          z.object({
            description: z.string(),
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
            create: input.exercises.map((exercise) => ({
              description: exercise.description,
              sets: {
                create: exercise.sets.map((set) => ({
                  weight: set.weight,
                  reps: set.reps,
                  rir: set.rir,
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
            create: input.exercises.map((exercise) => ({
              description: exercise.description,
              sets: {
                create: exercise.sets.map((set) => ({
                  weight: set.weight,
                  reps: set.reps,
                  rir: set.rir,
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

  getUniqueWeekWorkouts: privateProcedure.query(async ({ ctx }) => {
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


  createNewWorkoutFromPrevious: privateProcedure
    .input(
      z.object({
        description: z.string(),
        priorWorkoutId: z.string(),
        workoutNumber: z.number(),
        nominalDay: z.string(),
        planId: z.string(),
        exercises: z.array(
          z.object({
            description: z.string(),
            sets: z.array(
              z.object({
                setId: z.string(),
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
          workoutNumber: input.workoutNumber + 1,
          planId: input.planId,
          originalWorkoutId: input.priorWorkoutId,
          exercises: {
            create: input.exercises.map((exercise) => ({
              description: exercise.description,
              sets: {
                create: exercise.sets.map((set) => ({
                  weight: set.weight,
                  reps: set.reps,
                  rir: set.rir,
                  lastSetId: set.setId,
                })),
              },
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
      return savedWorkout;
    }),

  addNewExercise: privateProcedure
    .input(
      z.object({
        workoutId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const createdExercise = await ctx.prisma.exercise.create({
        data: {
          workoutId: input.workoutId,
          description: "New Exercise",
          sets: {
            create: {
              weight: 0,
              reps: 5,
              rir: 3,
            },
          },
        },
        include: {
          sets: true
        }
      });
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
        weight: z.number(),
        reps: z.number(),
        rir: z.number(),
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
        weight: z.number(),
        reps: z.number(),
        rir: z.number(),
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
});
