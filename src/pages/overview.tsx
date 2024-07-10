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
import { Bar, BarChart, CartesianGrid, XAxis, LabelList } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "../components/ui/chart";
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
const chartConfig2 = {
  easy: {
    label: "easy",
    color: "#4b5563",
  },
  medium: {
    label: "medium",
    color: "#4b5563",
  },
  hard: {
    label: "hard",
    color: "#4b5563",
  },
  veryHard: {
    label: "veryHard",
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

  type RPE = "easy" | "medium" | "hard" | "veryHard";

  interface CardioOverview {
    [week: string]: {
      [key in RPE]: number;
    };
  }

  interface TransformedData {
    week: number;
    easy: number;
    medium: number;
    hard: number;
    veryHard: number;
  }

  const transformCardioOverview = (
    cardioOverview: CardioOverview
  ): TransformedData[] => {
    const data = Object.entries(cardioOverview).map(([week, rpeData]) => {
      const easy = rpeData.easy;
      const medium = rpeData.medium;
      const hard = rpeData.hard;
      const veryHard = rpeData.veryHard;
      const total = easy + medium + hard + veryHard;
      return {
        week: parseInt(week),
        easy: rpeData.easy,
        medium: rpeData.medium,
        hard: rpeData.hard,
        veryHard: rpeData.veryHard,
        total: total,
      };
    });
    console.log(data);
    return data;
  };
  return (
    <>
      <PageLayout>
        <NavBar title="Mesocycle Overview" />
        <SignedIn>
          {Object.entries(overview.muscleGroupOverview).map(
            ([muscleGroup, sets], index) => (
              <div key={index} className="my-1">
                <Card className="mx-2 bg-gray-800">
                  <CardHeader>
                    <CardTitle>{muscleGroup}</CardTitle>
                    <CardDescription>Total weekly sets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={chartConfig}
                      className="min-h-[75px]"
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
            )
          )}
          {overview.cardioOverview && (
            <div className="my-1">
              <Card className="mx-2 bg-gray-800">
                <CardHeader>
                  <CardTitle>Cardio</CardTitle>
                  <CardDescription>Total Weekly Minutes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={chartConfig2}
                    className="min-h-[100px]"
                  >
                    <BarChart
                      accessibilityLayer
                      data={transformCardioOverview(overview.cardioOverview)}
                    >
                      <CartesianGrid vertical={false} />
                      <Bar
                        dataKey="easy"
                        fill=" #04bd26 "
                        radius={4}
                        stackId={"a"}
                      />
                      <Bar
                        dataKey="medium"
                        fill=" #044fbd "
                        stackId={"a"}
                        radius={4}
                      />
                      <Bar
                        dataKey="hard"
                        stackId={"a"}
                        fill="  #acbd04  "
                        radius={4}
                      />
                      <Bar
                        dataKey="veryHard"
                        fill=" #d10909 "
                        radius={4}
                        stackId={"a"}
                      >
                        <LabelList
                          position="top"
                          offset={12}
                          className="fill-foreground"
                          fontSize={12}
                        />
                      </Bar>
                      <ChartLegend content={<ChartLegendContent />} />
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
          )}
        </SignedIn>
        <SignedOut>
          <SignInButton />
        </SignedOut>
      </PageLayout>
    </>
  );
};

export default Overview;
