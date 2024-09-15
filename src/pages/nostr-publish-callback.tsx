import { type NextPage } from "next";
import { api } from "~/utils/api";

import React, { useState, useEffect } from "react";

import type { Workout, Exercise, exerciseSet } from "@prisma/client";
import { NavBar } from "~/pages/components/navbar";
import LoadingSpinner from "./components/loadingspinner";
import WorkoutDisplay3 from "./components/workoutdisplay";
import { Button } from "./../components/ui/button";
import { useRouter } from "next/router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "~/components/ui/dialog";
import SignedIn, { SignInButton, SignedOut } from "./components/auth";
import useWorkoutStore, { fullWorkout } from "~/lib/store";
import { format } from "path";
import { kMaxLength } from "buffer";

const Home: NextPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    async function handleCallback() {
      if (!router.isReady) return;

      const { event } = router.query;
      if (!event) {
        setStatus("error");
        setStatus("No event data received");
        return;
      }
      try {
        const decodedEvent = JSON.parse(
          decodeURIComponent(event as string)
        ) as Event;
        setStatus(JSON.stringify(decodedEvent));
        const success = await publishToNostrRelays(decodedEvent);
        if (success) {
          setStatus("PUBLISHED");
          setTimeout(() => {
            window.close();
          }, 3000);
        }
      } catch (error) {
        setStatus("error");
        setError("An unknown error occurred");
      }
    }
    void handleCallback();
  }, [router.isReady, router.query]);

  return (
    <>
      <NavBar title="Sharing" />
      <SignedIn>
        <div className="mt-10 flex flex-row items-center justify-center">
          {status === "loading" && (
            <>
              <div>Publishing...</div>
              <LoadingSpinner />
            </>
          )}
          {status === "PUBLISHED" && (
            <>
              <div>PUBLISHED</div>
              <div>close this window</div>
            </>
          )}
        </div>
      </SignedIn>
      <SignedOut>
        <div className="mt-14 flex flex-row items-center justify-center">
          <SignInButton />
        </div>
      </SignedOut>
    </>
  );
};

export default Home;
import { Relay, Event } from "nostr-tools";
import { NostrEvent } from "@nostr-dev-kit/ndk";
//import { SimplePool } from 'nostr-tools/pool'

async function publishToNostrRelays(event: Event) {
  const relayUrls = [
    "wss://relay.damus.io",
    "wss://relay.snort.social",
    "wss://nostr.fmt.wiz.biz",
  ];
  const relayAddress = "wss://relay.damus.io";
  return Relay.connect(relayAddress)
    .then((relay) => {
      return relay.publish(event);
    })
    .then(() => true)
    .catch(() => false);
}
