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

const Home: NextPage = () => {
  const { data: overview } = api.getWorkouts.getMesoOverview.useQuery();
  console.log(overview);
  if (!overview) {
    return <div>Loading...</div>;
  }

  const muscleGroups = Object.keys(MuscleGroup);
  const muscleGroupData = muscleGroups.reduce((acc, group) => {
    acc[group] = {};
    return acc;
  }, {} as { [muscleGroup: string]: { [weekNumber: number]: number } });

  Object.entries(overview).forEach(([weekNumber, groups]) => {
    Object.entries(groups).forEach(([muscleGroup, sets]) => {
      if (!muscleGroupData[muscleGroup]![Number(weekNumber)]) {
        muscleGroupData[muscleGroup]![Number(weekNumber)] = 0;
      }
      muscleGroupData[muscleGroup]![Number(weekNumber)] += sets;
    });
  });

  return (
    <>
      <PageLayout>
        <NavBar title="Mesocycle Overview" />
        <SignedIn>
          {muscleGroups.map((curMuscleGroup, index) => (
            <div
              key={index}
              className="my-1 flex flex-row items-center justify-between rounded-md bg-gray-800 shadow-md"
            >
              <div className="max-w-1/3 flex w-full flex-col text-left">
                <div className="ml-2 text-lg">{curMuscleGroup}</div>
                <div className="ml-2 text-sm font-light">Total Sets</div>
              </div>

              <div className="flex h-32 w-full justify-end">
                <BarChart
                  key={curMuscleGroup}
                  muscleGroup={curMuscleGroup}
                  weeklyData={muscleGroupData[curMuscleGroup]!}
                />
              </div>
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

export default Home;

// components/BarChart.tsx
import { Bar } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

type BarChartProps = {
  muscleGroup: string;
  weeklyData: { [weekNumber: number]: number };
};

const BarChart: React.FC<BarChartProps> = ({ muscleGroup, weeklyData }) => {
  const weeks = Object.keys(weeklyData).map(Number);
  const sets = Object.values(weeklyData);

  const chartData = {
    labels: weeks.map((week) => `wk${week + 1}`),
    datasets: [
      {
        label: muscleGroup,
        data: sets,
        backgroundColor: "rgba(56,81,106, 1)",
        borderColor: "rgba(56,81,106, 1)",
        borderWidth: 1,
        barThickness: 40,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true,
        font: {
          size: 14,
        },
        color: "white",
        anchor: "start" as "end" | "center" | "start" | undefined,
        align: "top" as
          | "center"
          | "end"
          | "top"
          | "right"
          | "bottom"
          | "left"
          | "start",
        formatter: (value: number) => value,
      },
    },
    scales: {
      x: {
        title: {
          display: false,
          text: "Week Number",
          color: "white",
          font: {
            size: 14,
          },
        },
        ticks: {
          color: "white",
          font: {
            size: 14,
          },
        },
        grid: {
          borderColor: "transparent", // Remove the faint dark line
          color: "rgba(75,75,75,0)",
        },
      },
      y: {
        display: false,
      },
    },
  };

  return (
    <div className="flex items-end">
      <Bar data={chartData} options={options} />
    </div>
  );
};
