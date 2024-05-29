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
        <div className="mx-auto mt-8 flex flex-col items-center justify-center gap-y-4 px-4 text-center">
          <img src="/image4.png" alt="Jacked Ostrich" />
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            <span className="">Liftr</span>
          </h1>
          <h3 className="text-2xl text-white ">Your Workout Tracker</h3>
        </div>
        <div className="mt-4">
          <div className="flex flex-col items-center">
            <SignedOut>
              {/* Signed out users get sign in button */}
              <SignInButton redirectUrl="home">
                <Button className="">Sign In</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="home">
                <Button className="">Home</Button>
              </Link>
            </SignedIn>
          </div>
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
              match-or-beat performance monitoring algorithm. Basically, it
              increases volume and weight as long as you&apos;re recovering on
              time.
            </div>
            <div>
              It logs soreness, pump, and overall exertion with pre- and
              post-exercise surveys and adjusts volume accordingly.
            </div>
            <div>
              It warns you when performance isn&apos;t meeting your targets.
            </div>
            <div>
              Premade plans follow current best-practices with starting volume
              around the typical minumum-effective volume for muscle growth and
              increasing over time.
            </div>
            <div>
              Build custom workouts, use premade plans, modify existing
              workouts, add or remove exercises and sets manually, swap out
              exercises, rearrange workouts and exercises.
            </div>
            <div>
              Get a bird&apos;s eye view with &apos;All Workouts&apos; to see
              see your progress.
            </div>
            <div>Built for mobile first, who brings a laptop to the gym?</div>
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default Home;
