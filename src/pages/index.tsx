import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";

import { buttonVariants } from "~/components/ui/button";
import PageLayout from "./components/pagelayout";
import SignedIn, {
  SignInButton,
  SignInButtonAmber,
  SignedOut,
} from "./components/auth";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Liftr</title>
        <meta name="description" content="Your Workout Tracker" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <div className="mx-auto mt-8 flex flex-col items-center justify-center gap-y-4 px-4 text-center">
          <img src="/image4.png" alt="Jacked Ostrich" />
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            <span className="">Liftr</span>
          </h1>
          <h3 className="text-2xl text-white ">Your Workout Tracker</h3>
          <SignedOut>
            <SignInButton />
            <SignInButtonAmber />
          </SignedOut>
          <SignedIn>
            <Link
              className={buttonVariants({ variant: "default" })}
              href={"/home"}
            >
              Continue
            </Link>
          </SignedIn>
        </div>
        <div className="mt-4">
          <div className="flex flex-col items-center"></div>
          <div className="mt-4 flex flex-col  gap-y-4 px-4 pb-12 text-left text-xl">
            <div className="text-center text-2xl font-semibold">
              What is this?
            </div>
            <div>
              Liftr is a 100% hypertrophy-focused workout &quot;coach&quot;.
            </div>
            <div>
              It uses{" "}
              <Link
                className="text-yellow-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                href={"https://rpstrength.com/"}
              >
                Renaissance Periodization&apos;s
              </Link>{" "}
              match-or-beat performance monitoring algorithm in combination with{" "}
              <Link
                className="text-yellow-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                href={"https://www.youtube.com/watch?v=5T9iDnaCmY4"}
              >
                Menno Hensellmans&apos;
              </Link>{" "}
              deload philosophy. Basically, it increases volume and weight as
              long as you&apos;re recovering on time, if you&apos;re not
              recovered, it programs a muscle-specific deload for that day.
            </div>
            <div>
              It logs soreness, pump, and overall exertion with pre- and
              post-exercise surveys and adjusts volume accordingly.
            </div>
            <div>
              Premade plans follow current best-practices with starting volume
              around the typical minumum-effective volume for muscle growth and
              increasing over time.
            </div>
            <div>
              Build custom workouts, use premade plans, modify existing
              workouts, easily swap exercises in and out, add or remove
              exercises and sets manually, swap out exercises, rearrange
              workouts and exercises.
            </div>
            <div>
              Track long term performance over time to monitor your progress.
            </div>
            <div>We even track cardio.</div>
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default Home;
