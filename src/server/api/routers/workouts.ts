import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import type { Workout, Exercise, exerciseSet, WorkoutPlan } from "@prisma/client";
import  { MuscleGroup, Pump, RPE } from "@prisma/client";
import { v4 } from "uuid";
import { Newspaper } from "lucide-react";

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
                  muscleGroup: MuscleGroup[exercise.muscleGroup as keyof typeof MuscleGroup],
                  sets: {
                    create: Array.from({length: exercise.sets}).map((_, index) => ({
                      setNumber: index,
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
              muscleGroup: MuscleGroup[exercise.muscleGroup as keyof typeof MuscleGroup],
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
              muscleGroup: MuscleGroup[exercise.muscleGroup as keyof typeof MuscleGroup],
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
            exercises: {include: {sets: {include: {priorSet: true}}}},
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
          include: {
            exercises: true,
          },
        },
      },
    });

    return { workoutPlan };
  }),

  fetchWorkoutById: privateProcedure.input(
    z.object({
      workoutId: z.string()
    })
  ).query(async ({ ctx, input }) => {
    const workout = await ctx.prisma.workout.findFirst({
      where: { userId: ctx.userId, workoutId: input.workoutId},
      include: {
        exercises: { include: { sets: { include: { priorSet: true } } } },
      },
    });
    
    if (!workout || !workout){
      throw new Error("Workout not found")
    }

    return { workout };
  }),

  getWorkoutById: privateProcedure.input(
    z.object({
      workoutId: z.string()
    })
  ).mutation(async ({ ctx, input }) => {
    const workout = await ctx.prisma.workout.findFirst({
      where: { userId: ctx.userId, workoutId: input.workoutId},
      include: {
        exercises: { include: { sets: { include: { priorSet: true } } } },
      },
    });
    
    if (!workout || !workout){
      throw new Error("Workout not found")
    }

    return { workout };
  }),


  createNewWorkoutFromPrevious: privateProcedure
    .input(
      z.object({
        priorWorkoutId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const priorWorkout = await ctx.prisma.workout.findUnique({
        where: {workoutId: input.priorWorkoutId},
        include: {
          exercises: {
            include: {
              sets: {include: {priorSet:true}}
            }
          }
        }
      })
      if (!priorWorkout){throw new Error("Prior workout not found")}
      

      interface newSetTemplate {
          targetWeight: number ,
          targetReps: number ,
          weight: number,
          rir: number ,
          setNumber: number | null,
          lastSetId?: string | null,
      }
      
      const newExercises = priorWorkout.exercises.sort((a,b)=>a.exerciseOrder-b.exerciseOrder).map((exercise, index)=>{
        const newSets: newSetTemplate[] = exercise.sets.sort((a,b)=> a.setNumber - b.setNumber).map((set,index)=>({
          targetWeight: set.weight ? set.weight + 5 : 0,
          targetReps: set.reps ? set.reps + 1 : 5,
          weight: 0,
          rir: 3,
          setNumber: index,
          lastSetId: set.setId,
        }))
        
        const newExercise = {
          description: exercise.description ?? "none",
          muscleGroup: exercise.muscleGroup,
          exerciseOrder: index,
          sets: newSets,
        }
        
        if (exercise.pump === Pump.low){
          newExercise.sets.push({
            targetWeight: newSets[newSets.length -1]!.targetWeight,
            targetReps: 0,
            weight: 0,
            rir: 3,
            setNumber: newSets.length,            
            lastSetId: "",
          })
        }
        return newExercise
      })

      const newWorkout = await ctx.prisma.workout.create({
        data: {
          userId: ctx.userId,
          description: priorWorkout.description,
          nominalDay: priorWorkout.nominalDay,
          workoutNumber: (priorWorkout.workoutNumber || 0)+1,
          originalWorkoutId: priorWorkout.originalWorkoutId || priorWorkout.workoutId,
          exercises: {
            create: newExercises.map((exercise, index) => ({
              description: exercise?.description ?? "none",
              muscleGroup: MuscleGroup[exercise?.muscleGroup as keyof typeof MuscleGroup],
              sets: {
                create: exercise?.sets.map((set, index) => {
                  const setData = {
                    setNumber: index,
                    targetWeight: set.targetWeight,
                    weight: 0,
                    targetReps: set.targetReps,
                    rir: set.rir,
                    lastSetId: set.lastSetId ?? null
                  }
                  return setData
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
      return newWorkout;
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
      await ctx.prisma.exercise.updateMany({
        where: {
          workoutId: input.workoutId,
          exerciseOrder:{
            gte: input.exerciseNumber +1
          }
        },
        data: {
          exerciseOrder: {
            increment: 1
          }
        }
      })
      const createdExercise = await ctx.prisma.exercise.create({
        data: {
          workoutId: input.workoutId,
          description: input.description,
          muscleGroup: MuscleGroup[input.muscleGroup as keyof typeof MuscleGroup],
          sets: {
            create: {
              weight: 0,
              reps: 0,
              rir: 3,
              setNumber:0
            },
          },
          exerciseOrder: input.exerciseNumber+1
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
          feedbackRecorded: true
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
});
