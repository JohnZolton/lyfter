import { userAgent } from "next/server";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const getAllWorkouts = createTRPCRouter({

  getAllWorkouts: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.workout.findMany();
  }),

  getAllExercises: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.exercise.findMany();
  }),
  //getUserWorkouts: publicProcedure.query(({userId: number}) => {
    //return ctx.prisma.workout.findUnique({
        //where: {
            //id: userId
        //}
    //});
  //})

});
