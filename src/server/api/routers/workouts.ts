import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { string, z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import type {
  User,
  Workout,
  Exercise,
  WorkoutPlan,
  ModelWorkoutPlan,
  exerciseSet,
  ActualWorkout,
} from "@prisma/client";
import { prisma } from "~/server/db";
import { Input } from "postcss";
import internal from "stream";
import { setServers } from "dns";

export const getAllWorkouts = createTRPCRouter({
  getAllWorkouts: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.workout.findMany();
  }),

  getAllExercises: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.exercise.findMany();
  }),

  getLastTwoWeeks: privateProcedure.query(async ({ ctx }) => {
    const workouts = await ctx.prisma.testWorkout.findMany({
      where: {
        userId: ctx.userId,
        date: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
      },
      include: { exercises: true },
      orderBy: [{ date: "desc" }],
    });
    if (!workouts) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "no workout history found",
      });
    }
    return workouts;
  }),

  getWorkoutByWorkoutId: privateProcedure
    .input(
      z.object({
        workoutId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const workout = await ctx.prisma.actualWorkout.findFirst({
        where: {
          workoutId: input.workoutId,
        },
        include: {
          exercises: {
            include: { sets: true },
            orderBy: { date: "asc" },
          },
          priorWorkout: {
            include: {
              exercises: {
                include: { sets: true}
              }
            }
          }
        },
      });
      if (!workout) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No workout with that User",
        });
      }
      return workout;
    }),

  getPreviousWorkout: privateProcedure
    .input(
      z.object({
        nominalDay: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const workout = await ctx.prisma.actualWorkout.findMany({
        where: {
          userId: ctx.userId,
          nominalDay: input.nominalDay,
        },
        orderBy: { date: "desc" },
        include: {
          exercises: {
            include: { sets: true },
            orderBy: { date: "asc" },
          },
        },
      });
      if (!workout) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No workout with that User",
        });
      }
      return workout;
    }),

  getLastWeekbyUserId: privateProcedure.query(async ({ ctx }) => {
    const workouts = await ctx.prisma.workout.findMany({
      where: {
        userId: ctx.userId,
      },
      orderBy: [{ date: "desc" }],
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
  getLatestWorkoutByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const workout = await ctx.prisma.workout.findMany({
        where: {
          userId: input.userId,
        },
        orderBy: [{ date: "desc" }],
        take: 1,
      });
      if (!workout) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No workout with that User",
        });
      }
      return workout;
    }),

  ByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(({ ctx, input }) =>
      ctx.prisma.workout.findMany({
        where: {
          userId: input.userId,
        },
        orderBy: [{ date: "desc" }],
      })
    ),

  //  getExerciseByWorkoutId: publicProcedure.input(z.object({
  //workoutId: z.string(),
  //})).query( async ({ctx, input}) => {
  //const exercises = await ctx.prisma.exercise.findMany({
  //where: {
  //workoutId: input.workoutId,
  //},
  //orderBy: [{ date: "desc"}]
  //}}
  //return exercises
  //)),
  getExerciseByWorkoutId: publicProcedure
    .input(
      z.object({
        workoutId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const exercises = await ctx.prisma.exercise.findMany({
        where: {
          workoutId: input.workoutId,
        },
        orderBy: [{ date: "desc" }],
      });
      if (!exercises) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No workout with that User",
        });
      }
      return exercises;
    }),

  newWorkout: privateProcedure
    .input(
      z.object({
        description: z.string(),
        nominalDay: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const description = input.description;

      const workout = await ctx.prisma.workout.create({
        data: {
          userId: userId,
          nominalDay: "Monday",
          description: description,
        },
      });
      return workout;
    }),

  newExercise: privateProcedure
    .input(
      z.object({
        workoutId: z.string(),
        weight: z.number(),
        sets: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workoutId = input.workoutId;
      const weight = input.weight;
      const sets = input.sets;
      const description = input.description;
      const exercise = await ctx.prisma.exercise.create({
        data: {
          workoutId: workoutId,
          description: description,
          weight: weight,
          sets: sets,
        },
      });
      if (!exercise) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Failed to add exercise",
        });
      }
      return exercise;
    }),

  getWorkoutPlan: privateProcedure.query(({ ctx }) => {
    return ctx.prisma.modelWorkoutPlan.findMany({
      where: { userId: ctx.userId },
      include: {
        workouts: {
          include: {
            exercises: true,
          },
        },
      },
    });
  }),

  updateExercise: privateProcedure
    .input(
      z.object({
        exerciseId: z.string(),
        sets: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sets = input.sets;
      const exerciseId = input.exerciseId;

      const exercise = await ctx.prisma.exercise.update({
        where: {
          exerciseId: exerciseId,
        },
        data: {
          sets: sets,
        },
      });
      if (!exercise) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Failed to add exercise",
        });
      }
      return exercise;
    }),

  newWorkoutPlan: privateProcedure
    .input(
      z.object({
        sunday: z.string(),
        monday: z.string(),
        tuesday: z.string(),
        wednesday: z.string(),
        thursday: z.string(),
        friday: z.string(),
        saturday: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workoutplan = await ctx.prisma.workoutPlan.upsert({
        where: {
          userId: ctx.userId,
        },
        update: {
          sunday: input.sunday,
          monday: input.monday,
          tuesday: input.tuesday,
          wednesday: input.wednesday,
          thursday: input.thursday,
          friday: input.friday,
          saturday: input.saturday,
        },
        create: {
          userId: ctx.userId,
          sunday: input.sunday,
          monday: input.monday,
          tuesday: input.tuesday,
          wednesday: input.wednesday,
          thursday: input.thursday,
          friday: input.friday,
          saturday: input.saturday,
        },
      });
      if (!workoutplan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Failed to create workout plan",
        });
      }
      return workoutplan;
    }),

  editWorkoutPlan: privateProcedure
    .input(
      z.object({
        exerciseId: z.string(),
        workoutId: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workoutId = input.workoutId;
      const exerciseId = input.exerciseId;
      const workoutPlan = await ctx.prisma.modelWorkoutPlan.update({
        where: { userId: ctx.userId },
        data: {
          workouts: {
            update: [
              {
                where: { workoutId },
                data: {
                  exercises: {
                    update: [
                      {
                        where: { exerciseId },
                        data: { description: input.description },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      });
      return workoutPlan;
    }),

  newTestPlanTwo: privateProcedure
    .input(
      z.object({
        description: z.string(),
        workouts: z.array(
          z.object({
            description: z.string(),
            nominalDay: z.string(),
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
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { workouts } = input;
      const workoutArray: ActualWorkout[] = [];

      const plan = await ctx.prisma.workoutPlanTwo.create({
        data: {
          userId: ctx.userId,
          description: input.description,
          workouts: {
            create: workouts.map((workout) => ({
              nominalDay: workout.nominalDay,
              userId: ctx.userId,
              description: workout.description,
              workoutNumber: 0,
              exercises: {
                create: workout.exercises.map((exercise) => ({
                  description: exercise.description,
                  sets: {
                    create: exercise.sets.map((set) => ({
                      rir: set.rir,
                      weight: set.weight,
                      reps: set.reps,
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
    const workouts = await ctx.prisma.workoutPlanTwo.findMany({
      where: {
        userId: ctx.userId,
      },
      orderBy: [{ date: "desc" }],
      take: 10,
      include: {
        workouts: {
          include: {
            exercises: {
              include: { sets: true },
              orderBy: {date: "asc"}
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

  newTestPlan: privateProcedure
    .input(
      z.object({
        workouts: z.array(
          z.object({
            description: z.string(),
            nominalDay: z.string(),
            exercises: z.array(
              z.object({
                description: z.string(),
                weight: z.number(),
                sets: z.number(),
              })
            ),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { workouts } = input;
      const deleteExercises = await ctx.prisma.modelExercise.deleteMany({
        where: { userId: ctx.userId },
      });
      const deleteWorkouts = await ctx.prisma.modelWorkout.deleteMany({
        where: { userId: ctx.userId },
      });
      const deleteWorkoutPlan = await ctx.prisma.modelWorkoutPlan.deleteMany({
        where: { userId: ctx.userId },
      });

      const workoutplan = await ctx.prisma.modelWorkoutPlan.create({
        data: {
          userId: ctx.userId,
          workouts: {
            create: workouts.map((workout) => ({
              description: workout.description,
              nominalDay: workout.nominalDay,
              exercises: {
                create: workout.exercises.map((exercise) => ({
                  description: exercise.description,
                  weight: exercise.weight,
                  sets: exercise.sets,
                  userId: ctx.userId,
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

      if (!workoutplan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Failed to create workout plan",
        });
      }
      return workoutplan;
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
      const savedWorkout = await ctx.prisma.actualWorkout.create({
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
        workoutId: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const deletedWorkout = await ctx.prisma.actualWorkout.delete({
        where: {workoutId: input.workoutId}
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
      const savedWorkout = await ctx.prisma.actualWorkout.create({
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
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate()-7)

    const workouts = await ctx.prisma.actualWorkout.findMany({
      where: {
        userId: ctx.userId,
        date: {
          gte: oneWeekAgo,
        }
      },
      include: { exercises: { include: { sets: {include: {priorSet: true}} } }
    },
      orderBy: [{ date: "asc" }],
    });
    if (!workouts) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No workouts with that User",
      });
    }
    return workouts;
  }),

  addExercise: privateProcedure
    .input(
      z.object({
        description: z.string(),
        workoutId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const addedExercise = await ctx.prisma.modelExercise.create({
        data: {
          userId: ctx.userId,
          description: input.description,
          weight: 0,
          sets: 1,
          workoutId: input.workoutId,
        },
      });
      return addedExercise;
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
      const savedWorkout = await ctx.prisma.actualWorkout.create({
        data: {
          userId: ctx.userId,
          description: input.description,
          nominalDay: input.nominalDay,
          workoutNumber: input.workoutNumber,
          priorWorkoutId: input.priorWorkoutId,
          planId: input.planId,
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
                include: { priorSet: true}
              },
            },
          },
          priorWorkout: {
            include: {
            exercises: {
              include: {
                sets: true
              }
            }
            }
          }
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
      const createdExercise = await ctx.prisma.actualExercise.create({
        data: {
          workoutId: input.workoutId,
          description: "New Exercise",
        },
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
      const deletedExercise = await ctx.prisma.actualExercise.delete({
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
      const updatedWorkout = await ctx.prisma.actualWorkout.update({
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
      const updatedExercise = await ctx.prisma.actualExercise.update({
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
    const workouts = await ctx.prisma.actualWorkout.findMany({
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
