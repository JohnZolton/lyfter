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
        <div className="mx-auto flex flex-col items-center justify-center gap-12 px-4 py-12 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            <span className="">Liftr</span>
          </h1>
          <h3 className="text-2xl text-white ">Your Workout Tracker</h3>
        </div>
        <div>
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
        </div>
      </PageLayout>
    </>
  );
};

export default Home;
