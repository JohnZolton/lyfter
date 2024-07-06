import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import React, { useState, useEffect, SetStateAction, useReducer } from "react";
import type { Workout, Exercise } from "@prisma/client";
import { NavBar } from "~/pages/components/navbar";
import PageLayout from "~/pages/components/pagelayout";
import LoadingSpinner from "./components/loadingspinner";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import SignedIn, { SignInButton, SignedOut } from "./components/auth";
import { MuscleGroup } from "@prisma/client";
import { type ChartConfig } from "../components/ui/chart";
import { Bar, BarChart, XAxis, LabelList } from "recharts";
import { ChartContainer } from "../components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const chartConfig = {
  totalVolume: {
    label: "Sets",
    color: "#4b5563",
  },
} satisfies ChartConfig;

const Overview: NextPage = () => {
  const { data: overview } = api.getWorkouts.getMesoOverview.useQuery();
  console.log(overview);

  if (!overview || overview === undefined) {
    return (
      <>
        <PageLayout>
          <NavBar title="Mesocycle Overview" />
          <SignedIn>
            <div className="mt-6 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton />
          </SignedOut>
        </PageLayout>
      </>
    );
  }
  const transformData = (data: number[]) => {
    return data.map((sets, index) => ({
      week: index + 1,
      totalVolume: sets,
    }));
  };

  return (
    <>
      <PageLayout>
        <NavBar title="Mesocycle Overview" />
        <SignedIn>
          {Object.entries(overview).map(([muscleGroup, sets], index) => (
            <div key={index} className="my-1">
              <Card>
                <CardHeader>
                  <CardTitle>{muscleGroup}</CardTitle>
                  <CardDescription>Total weekly sets</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={chartConfig}
                    className="min-h-[100px]"
                  >
                    <BarChart accessibilityLayer data={transformData(sets)}>
                      <Bar
                        dataKey="totalVolume"
                        fill="var(--color-totalVolume)"
                        radius={4}
                      >
                        <LabelList
                          position="center"
                          offset={12}
                          className="fill-foreground"
                          fontSize={12}
                        />
                      </Bar>
                      <XAxis
                        dataKey={"week"}
                        tickLine={false}
                        tickMargin={10}
                        tickFormatter={(value: number | string) =>
                          `wk${(value as string) ?? 0}`
                        }
                        axisLine={false}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          ))}
        </SignedIn>
        <SignedOut>
          <SignInButton />
        </SignedOut>
      </PageLayout>
    </>
  );
};

export default Overview;
