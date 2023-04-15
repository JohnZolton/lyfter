import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import type { Workout } from "@prisma/client";

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

  newWorkout: privateProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.userId;

    const workout = await ctx.prisma.workout.create({
      data: {
        userId: userId,
        nominalDay: 'Monday',
        description: 'Leg Day',
      }
    })
    return workout
  })

});
