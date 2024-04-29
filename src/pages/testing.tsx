import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import React, { useState, useRef, useEffect } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { NavBar } from "~/pages/components/navbar";
import PageLayout from "~/pages/components/pagelayout";
import MenuLayout from "./components/menulayout";
import LoadingSpinner from "./components/loadingspinner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../components/ui/dialog";
import { pplPlanArrayTwo } from "../lib/workout";
import Link from "next/link";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Liftr</title>
        <meta name="description" content="Nostr Workout Tracker" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <div className="mx-auto mt-4 flex max-w-6xl flex-row items-center justify-between gap-x-20 text-2xl font-semibold">
          <div className="ml-6">Testing</div>
          <NavBar />
        </div>
        <SignedIn>
          <br></br>
          <NewWorkoutMenu />
          <br></br>
          <div></div>
        </SignedIn>
        <SignedOut>
          {/* Signed out users get sign in button */}
          <SignInButton redirectUrl="home">
            <button className="rounded-full bg-gray-700 p-3 text-xl  hover:bg-gray-600">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </PageLayout>
    </>
  );
};

export default Home;

function NewWorkoutMenu() {
  const { mutate: resetPlan } = api.getWorkouts.resetCurrentPlan.useMutation();
  function handleResetPlan() {
    resetPlan();
  }
  const { mutate: makeNewWeek } = api.getWorkouts.makeNewWeek.useMutation();

  function handleDummyData() {
    makeNewWeek();
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-y-4 rounded-lg ">
      <Button onClick={() => handleDummyData()}>Make new week</Button>
      <Button onClick={() => handleResetPlan}>Reset Plan</Button>
    </div>
  );
}
