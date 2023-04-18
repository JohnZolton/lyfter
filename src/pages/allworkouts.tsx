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
    if (user.isSignedIn){
        const { data: getWorkouts } = api.getWorkouts.getLastWeekbyUserId.useQuery()
    }
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
                Loading
            </div>
        )
    }

    if (!data){
        return(<div>Something went wrong</div>)
    }
    return (
        <div>
            {data.map( (workout, index)=> (
                <div key={index}>
                    <div>Workout: {workout.description}</div>
                </div>
            ))}
        </div>
    )
}