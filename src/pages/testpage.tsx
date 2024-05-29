import React, { useState } from "react";
//import "./CircularMaze.css";

import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { Button, buttonVariants } from "~/components/ui/button";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import PageLayout from "./components/pagelayout";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Liftr</title>
        <meta name="description" content="Your Workout Tracker" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <div>
          <div className="flex flex-col items-center">
            <CircularMaze />
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default Home;

const CircularMaze: React.FC = () => {
  const [rotation, setRotation] = useState(0);

  const rotateMaze = (direction: "left" | "right") => {
    setRotation((prev) => prev + (direction === "right" ? 10 : -10));
  };

  return (
    <div className="text-white">
      <svg
        width="300"
        height="300"
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="black"
          strokeWidth="0.5"
          fill="transparent"
        />
        {/* You can add more paths or circles here to create paths in the maze */}
        <path d="M 50,10 a 40,40 0 1,0 0.1,0" fill="none" stroke="white" />
        {/* Add more maze complexity here */}
      </svg>
      <button onClick={() => rotateMaze("left")}>Rotate Left</button>
      <button onClick={() => rotateMaze("right")}>Rotate Right</button>
    </div>
  );
};
