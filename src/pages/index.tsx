import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { Button, buttonVariants } from "~/components/ui/button";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { redirect } from "next/dist/server/api-utils";

const Home: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      void router.push("/home");
    }
  }, [session, router]);

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
            <span className="text-[hsl(0,0%,43%)]">Liftr</span>
          </h1>
          <h3 className="text-2xl text-white ">Nostr Workout Tracker</h3>
        </div>
        <div>
          <div className="rounded-full">
            <Button onClick={() => void signIn()}>Sign in with Nostr</Button>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
