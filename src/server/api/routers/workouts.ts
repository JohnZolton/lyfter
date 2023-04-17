import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import type { User, Workout, Exercise } from "@prisma/client"


export const getAllWorkouts = createTRPCRouter({

  getAllWorkouts: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.workout.findMany();
  }),

  getAllExercises: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.exercise.findMany();
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

  getExerciseByWorkoutId: publicProcedure.input(z.object({
    workoutId: z.string(),
  })).query(({ctx, input}) => ctx.prisma.exercise.findMany({
    where: {
      workoutId: input.workoutId,
    },
    orderBy: [{ date: "desc"}]
  })),

  newWorkout: privateProcedure.input(z.object({
    description: z.string()
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
  })

});
