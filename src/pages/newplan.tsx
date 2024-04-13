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
import { pplPlanArrayTwo, maintenance } from "../lib/workout";
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
        <div className="mx-auto my-2 mt-4 flex max-w-6xl flex-row items-center justify-between gap-x-20 text-2xl font-semibold">
          <div className="ml-6">New Plan</div>
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

  return (
    <div className="flex flex-col items-center rounded-lg ">
      <MenuLayout>
        <div className="my-1 w-full px-6">
          <PreBuiltPlans />
        </div>
        <div className="my-8 flex w-full flex-row items-center justify-between px-6">
          <div>Reset Current Plan</div>
          <Button onClick={() => handleResetPlan()}>Reset</Button>
        </div>
        <div className="my-8 flex w-full flex-row items-center justify-between px-6">
          <div>New Custom Plan</div>
          <div>
            <Link href="/customplan">
              <Button>Create</Button>
            </Link>
          </div>
        </div>
      </MenuLayout>
    </div>
  );
}
function PreBuiltPlans() {
  const { mutate: makePlan, isLoading } =
    api.getWorkouts.newTestPlanTwo.useMutation({
      onSuccess(data, variables, context) {
        console.log(data);
      },
    });

  function makeMaintenance() {
    makePlan({ description: "Maintenance 2x", workouts: maintenance });
  }
  function makePPL() {
    makePlan({ description: "Push Pull Legs", workouts: pplPlanArrayTwo });
  }
  if (isLoading) {
    return (
      <>
        <LoadingSpinner />
      </>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center gap-y-2">
      <div className="text-xl">Pre-built Plans</div>
      <div className="flex  w-full  flex-row items-center justify-between gap-x-4">
        <div>Push Pull Legs (6x) </div>
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Create</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Plan to Push Pull Legs</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                <DialogClose asChild>
                  <div className="flex w-full flex-col items-center justify-center gap-y-4">
                    <div>This cannot be undone</div>
                    <div className="flex w-full flex-row items-center justify-between px-10">
                      <Button variant={"destructive"} onClick={() => makePPL()}>
                        Confirm
                      </Button>
                      <Button type="button" variant="secondary">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogClose>
              </DialogDescription>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex  w-full  flex-row items-center justify-between gap-x-4">
        <div>Maintenance (2x)</div>
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Create</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Plan to Maintenace (2x)</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                <DialogClose asChild>
                  <div className="flex w-full flex-col items-center justify-center gap-y-4">
                    <div>This cannot be undone</div>
                    <div className="flex w-full flex-row items-center justify-between px-10">
                      <Button
                        variant={"destructive"}
                        onClick={() => makeMaintenance()}
                      >
                        Confirm
                      </Button>
                      <Button type="button" variant="secondary">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogClose>
              </DialogDescription>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
