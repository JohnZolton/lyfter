import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";
import React, { useState, useTransition } from 'react'
import {
  ClerkProvider,
  RedirectToOrganizationProfile,
  RedirectToSignIn,
  useUser,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton
} from "@clerk/nextjs";
import { userAgent } from "next/server";
import { userInfo } from "os";
import { boolean } from "zod";
import type { User, Workout } from "@prisma/client"
import { prisma } from "~/server/db";

const Home: NextPage = () => {

  return (
    <>
      <Head>
        <title>Lyfter</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="text-white text-center flex min-h-screen   flex-col  bg-gradient-to-b from-[#000000] to-[#44454b]">
        <div>
          <SignedIn>
            <div className="text-white   items-end flex p-6 items-right flex-col ">
                <UserButton appearance={{ 
                  elements: { 
                    userButtonAvatarBox: { width: 60, height: 60 } 
                    }
                  }} />
            </div>
          <br></br>
          <Content />
          <br></br>
      <div>
      </div>
        </SignedIn>
        <SignedOut>
          {/* Signed out users get sign in button */}
          <SignInButton redirectUrl="home">
            <button className="rounded-full text-xl text-black bg-white p-3">Sign In</button>
            </SignInButton>
        </SignedOut>
      </div>
      </main>
    </>
  );
};

export default Home;

function Content(){
    const user = useUser()
    
    return (
        <div>
            <Workouts/>
        </div>
    )
}

const Workouts = () => {
    const { data, isLoading: workoutsLoading } = api.getWorkouts.getLastWeekbyUserId.useQuery()


    if (workoutsLoading) {
        return (
            <div>
              <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status">
              <span
                className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
                >Loading...</span
              >
            </div>
            </div>
        )
    }

    if (!data){
        return(<div>Something went wrong</div>)
    }
    return (
        <div className="flex flex-wrap">
            {data.map( (workout, index)=> (
                <div key={index} className="flex flex-col mr-4 mb-4">
                    <div className="text-lg font-bold mb-2">Workout: {workout.description}</div>
                    <ExerciseDisplay workoutId={workout.workoutId}/>
                </div>
            ))}
        </div>
    )
}

interface ExerciseDisplayProps {
  workoutId: string
}

function ExerciseDisplay( {workoutId} : ExerciseDisplayProps){
    const {data: exercises, isLoading: exercisesLoading} = api.getWorkouts.getExerciseByWorkoutId.useQuery({
      workoutId: workoutId
    })
    console.log("exercises:")
    console.log(exercises)
    if (exercisesLoading){
      return(
              <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status">
              <span
                className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
                >Loading...</span
              >
            </div>
      )
    }
      if (exercises) {
    return (
      <div>
      <table className="mx-auto">
          <thead>
            <tr>
              <th>Exercise</th>
              <th>Weight</th>
              <th>Sets</th>
            </tr>
          </thead>
          <tbody>
            { exercises && exercises.map((exercise, index) =>(
              <tr key={index}>
                <td>{exercise.description}</td>
                <td>{exercise.weight}</td>
                <td>{exercise.sets}</td>
              </tr>
            )) }
          </tbody>
        </table>
      </div>
    );
  }
  return <div>No data</div>;
}
  
