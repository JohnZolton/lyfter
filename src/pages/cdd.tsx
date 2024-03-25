import { type NextPage } from "next";
import Head from "next/head";
import React from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import NavBar from "~/pages/components/navbar";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Liftr</title>
        <meta name="description" content="Nostr Workout Tracker" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-gradient-to-b   from-[#000000]  to-[#44454b]  text-white">
        <div className="">
          <SignedIn>
            <NavBar />
          </SignedIn>
          <SignedOut>
            {/* Signed out users get sign in button */}
            <SignInButton redirectUrl="home">
              <button className="rounded-full bg-slate-700 p-3 text-xl text-white hover:bg-gray-600">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </main>
    </>
  );
};

export default Home;
