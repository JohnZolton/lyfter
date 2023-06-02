import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { string, z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import type { User, Workout, Exercise, WorkoutPlan, ModelWorkoutPlan, exerciseSet } from "@prisma/client"
import { prisma } from "~/server/db";
import { Input } from "postcss";
import internal from "stream";


export const getAllWorkouts = createTRPCRouter({

  getAllWorkouts: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.workout.findMany();
  }),

  getAllExercises: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.exercise.findMany();
  }),

  getLastTwoWeeks: privateProcedure.query(async ({ctx}) => {
    const workouts = await ctx.prisma.testWorkout.findMany({
      where: {
        userId: ctx.userId,
        date: {
          gte: new Date(Date.now() - 14*24*60*60*1000)
        }
      },
      include: { exercises: true},
      orderBy: [{date: "desc"}]
    })
    if (!workouts){
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "no workout history found"
      })
    }
    return workouts
  }),
  
  getPreviousWorkout: privateProcedure.input(z.object({
    nominalDay: z.string(),
  })).query(async ({ctx, input}) => {
    const workout = await ctx.prisma.actualWorkout.findMany({
      where: {
        userId: ctx.userId,
        nominalDay: input.nominalDay,
      },
      orderBy: {date: "desc"},
      include: { exercises: {include: {sets: true}}},
    })
    if (!workout){
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No workout with that User"
      })
    }
    return workout
  }),

  getLastWeekbyUserId: privateProcedure.query(async ({ctx}) => {
  const workouts = await ctx.prisma.workout.findMany({
    where: {
      userId: ctx.userId,
    },
    orderBy: [{ date: "desc"}],
    take: 7,
  })
  if (!workouts){
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No workout with that User"
    })
  }
  return workouts
}),
  getLatestWorkoutByUserId: publicProcedure.input(z.object({
    userId: z.string(),
  })).query(async ({ctx, input}) => {
  const workout = await ctx.prisma.workout.findMany({
    where: {
      userId: input.userId,
    },
    orderBy: [{ date: "desc"}],
    take: 1,
  })
  if (!workout){
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No workout with that User"
    })
  }
  return workout
}),

  ByUserId: publicProcedure.input(z.object({
    userId: z.string(),
  })).query(({ctx, input}) => ctx.prisma.workout.findMany({
    where: {
      userId: input.userId,
    },
    orderBy: [{ date: "desc"}]
  })),

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
  getExerciseByWorkoutId: publicProcedure.input(z.object({
    workoutId: z.string(),
  })).query(async ({ctx, input}) => {
  const exercises = await ctx.prisma.exercise.findMany({
    where: {
      workoutId: input.workoutId,
    },
    orderBy: [{ date: "desc"}],
  })
  if (!exercises){
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No workout with that User"
    })
  }
  return exercises
}),

  newWorkout: privateProcedure.input(z.object({
    description: z.string(),
    nominalDay: z.string()
  })).mutation(async ({ ctx, input}) => {
    const userId = ctx.userId;
    const description = input.description

    const workout = await ctx.prisma.workout.create({
      data: {
        userId: userId,
        nominalDay: 'Monday',
        description: description,
      }
    })
    return workout
  }),

  newExercise: privateProcedure.input(z.object({
    workoutId: z.string(),
    weight: z.number(),
    sets: z.string(),
    description: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const workoutId = input.workoutId
    const weight = input.weight
    const sets = input.sets
    const description = input.description
    const exercise = await ctx.prisma.exercise.create({
      data: {
        workoutId: workoutId,
        description: description,
        weight: weight,
        sets: sets,
      }
    })
    if (!exercise){
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: "Failed to add exercise"
      })
    }
    return exercise
  }),

  getWorkoutPlan: privateProcedure.query(({ ctx }) => {
    return ctx.prisma.modelWorkoutPlan.findMany({
      where: {userId: ctx.userId},
      include: {
        workouts: {
          include: {
            exercises: true
          }
        }
      }
    });
  }),

  updateExercise: privateProcedure.input(z.object({
    exerciseId: z.string(),
    sets: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const sets = input.sets
    const exerciseId = input.exerciseId

    const exercise = await ctx.prisma.exercise.update({
      where: {
        exerciseId: exerciseId,
      },
      data: {
        sets: sets,
      }
    })
    if (!exercise){
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: "Failed to add exercise"
      })
    }
    return exercise
  }),

  newWorkoutPlan: privateProcedure.input(z.object({
    sunday: z.string(),
    monday: z.string(),
    tuesday: z.string(),
    wednesday: z.string(),
    thursday: z.string(),
    friday: z.string(),
    saturday: z.string(),
  })).mutation(async ({ ctx, input }) => {
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
      }
    })
    if (!workoutplan){
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: "Failed to create workout plan"
      })
    }
    return workoutplan
  }),

  editWorkoutPlan: privateProcedure.input(
    z.object({
      exerciseId: z.string(),
      workoutId: z.string(),
      description: z.string(),
    })
  ).mutation(async ({ctx, input }) => {
    const workoutId = input.workoutId
    const exerciseId = input.exerciseId
    const workoutPlan = await ctx.prisma.modelWorkoutPlan.update({
      where: {userId: ctx.userId},
      data: {
        workouts: {
          update: [
            {
              where: {workoutId},
              data: {
                exercises: {
                  update: [
                    {
                      where: {exerciseId},
                      data: { description: input.description },
                    }
                  ]
                }
              }
            }
          ]
        }
      }
    })
    return workoutPlan
  }),

  newTestPlan: privateProcedure.input(
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
  ).mutation(async ({ ctx, input }) => {
    const {workouts} = input
    const deleteExercises = await ctx.prisma.modelExercise.deleteMany({
      where: {userId: ctx.userId}
    })
    const deleteWorkouts = await ctx.prisma.modelWorkout.deleteMany({
      where: {userId: ctx.userId}
    })
    const deleteWorkoutPlan = await ctx.prisma.modelWorkoutPlan.deleteMany({
      where: {userId: ctx.userId}
    })

    const workoutplan = await ctx.prisma.modelWorkoutPlan.create({
      data: {
        userId: ctx.userId,
        workouts: {
          create: workouts.map((workout)=>({
            description: workout.description,
            nominalDay: workout.nominalDay,
            exercises: {
              create: workout.exercises.map((exercise)=>({
                description: exercise.description,
                weight: exercise.weight,
                sets: exercise.sets,
                userId: ctx.userId,
              }))
            }
          }))
        }},
        include: {
          workouts: {
            include: {
              exercises: true
            }
          }
        }
      })

    if (!workoutplan){
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: "Failed to create workout plan"
      })
    }
    return workoutplan
  }),


  saveWorkout: privateProcedure.input(
    z.object({
      description: z.string(),
      nominalDay: z.string(),
      exercises: z.array(z.object({
        description: z.string(),
        sets: z.array(z.object({
          weight: z.number(),
          reps: z.number(),
          rir: z.number(),
        }))
      })),
    })
  ).mutation(async ({ ctx, input }) => {
    const savedWorkout = await ctx.prisma.actualWorkout.create({
      data: {
        userId: ctx.userId,
        description: input.description,
        nominalDay: input.nominalDay,
        exercises: {
          create: input.exercises.map((exercise)=>({
            description: exercise.description,
            sets: {
              create: exercise.sets.map((set)=>({
                weight: set.weight,
                reps: set.reps,
                rir: set.rir,
              }))
            }
        })) 
      }},
      include: {
        exercises: {
          include: {
            sets: true
          }
        }
      }
        
      
    })
    return savedWorkout
  }),

});

