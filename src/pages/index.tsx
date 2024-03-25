import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { Button, buttonVariants } from "~/components/ui/button";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";



const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Liftr</title>
        <meta name="description" content="Nostr Workout Tracker" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b   from-[#000000]  to-[#44454b]  text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            <span className="text-[hsl(0,0%,43%)]">Lyftr</span>
          </h1>
          <h3 className="text-2xl text-white ">Nostr Based Workout Tracker</h3>
        </div>
        <div>
          <div className="rounded-full">
            <SignedOut>
              {/* Signed out users get sign in button */}
              <SignInButton redirectUrl="home">
                <Button className="">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="home"
              >
                <Button className="">Home</Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
