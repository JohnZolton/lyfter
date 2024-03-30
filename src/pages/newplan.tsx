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
          <div className="ml-6">New Workout Plan</div>
          <NavBar />
        </div>
        <br></br>
        <NewWorkoutMenu />
        <br></br>
        <div></div>
      </PageLayout>
    </>
  );
};

export default Home;

function NewWorkoutMenu() {
  function handleResetPlan() {
    console.log("todo");
  }

  return (
    <div className="flex flex-col items-center rounded-lg ">
      <MenuLayout>
        <div className="my-1 w-full px-6">
          <PreBuiltPlans />
        </div>
        <div className="my-8 flex w-full flex-row items-center justify-between px-6">
          <div>Reset Current Plan</div>
          <Button disabled onClick={() => handleResetPlan}>
            Reset
          </Button>
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

  function handleClick() {
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
                      <Button
                        variant={"destructive"}
                        onClick={() => handleClick()}
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
      <div className="flex  w-full  flex-row items-center justify-between gap-x-4">
        <div>Upper/Lower even (4x)</div>
        <Button disabled onClick={handleClick}>
          Create
        </Button>
      </div>
      <div className="flex  w-full  flex-row items-center justify-between gap-x-4">
        <div>Upper Emphasis (4x)</div>
        <Button disabled onClick={handleClick}>
          Create
        </Button>
      </div>
    </div>
  );
}
