import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";
import React, { useState, useTransition } from 'react'
import {
  ClerkProvider,
  RedirectToOrganizationProfile,
  RedirectToSignIn,
  useUser,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton
} from "@clerk/nextjs";
import { userAgent } from "next/server";
import { userInfo } from "os";
import { boolean, set } from "zod";
import { User, Workout, Exercise, TestExercise, TestWorkout, ModelWorkout, ModelExercise } from "@prisma/client"
import { prisma } from "~/server/db";
import { start } from "repl";


const Home: NextPage = () => {

  return (
    <>
      <Head>
        <title>Lyfter</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="text-white text-center flex min-h-screen   flex-col  bg-gradient-to-b from-[#000000] to-[#44454b]">
<nav className="flex items-center justify-between flex-wrap bg-black-500 p-6">
        <SignedIn>

            <div className="text-white   items-end flex p-6 items-right flex-col ">
                <UserButton appearance={{ 
                  elements: { 
                    userButtonAvatarBox: { width: 60, height: 60 } 
                    }
                  }} />
            </div>
        </SignedIn>
  <div className="flex items-center flex-shrink-0 text-white mr-6">
  </div>
  <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
    <div className="text-sm lg:flex-grow">
      <Link href="home" className="block mt-4 lg:inline-block lg:mt-0 text-slate-200 hover:text-white mr-4">Home</Link>
      <Link href="makeplan" className="block mt-4 lg:inline-block lg:mt-0 text-slate-200 hover:text-white mr-4">Edit Workout Plan</Link>
      < Link href="allworkouts" className="block mt-4 lg:inline-block lg:mt-0 text-slate-200 hover:text-white mr-4">Workout History</Link>
    </div>
    <div>
    </div>
  </div>
</nav>
        <div>
          <br></br>
          <WorkoutUi />
          <br></br>
      <div>
      </div>
        <SignedOut>
          {/* Signed out users get sign in button */}
          <SignInButton redirectUrl="home">
            <button className="rounded-full text-xl text-black bg-white p-3">Sign In</button>
            </SignInButton>
        </SignedOut>
      </div>
      </main>
    </>
  );
};

export default Home

function LastWorkout({ workoutHistory }: { workoutHistory: TestWorkout2[] | undefined }) {
  if (workoutHistory === undefined){
    return (<div>No history</div>)
  }


  return (
    <div>
      {workoutHistory.map((workout) => (
        <div key={workout.workoutId}>
          <div>
            <div>Last time: {workout.description}</div>
            <ListExercises workout={workout}/>
          </div>
          <div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface TestWorkout2 {
  workoutId: string;
  date: Date;
  nominalDay: string;
  userId: string;
  description: string;
  exercises: TestExercise[];
}

function ListExercises( {workout}: {workout: TestWorkout2}){
  return (
    <div>
      {workout.exercises?.map((exercise) => (
        <div key={exercise.exerciseId}>
          <div>{exercise.description}: {exercise.weight} x {exercise.sets}</div>
        </div>
      ))}
    </div>
  )
}


function WorkoutUi(){
    const [newWorkout, setNewWorkout] = useState<Workout>()
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [inProgress, setInProgress] = useState(false)
    const [selectExercise, setSelectedExercise] = useState<Exercise | undefined>(undefined)
    const [workoutHistory, setWorkoutHistory] = useState<TestWorkout2[] | undefined>(undefined)

    const today = new Date()
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = weekdays[today.getDay()];
    console.log(todayName); 
    
    if (todayName){
      const {data: testworkouts, isLoading: workoutsLoading } = api.getWorkouts.getPreviousWorkout.useQuery({
        nominalDay: todayName
        }) 
        if (!workoutsLoading && workoutHistory === undefined){
        setWorkoutHistory(testworkouts)
        }
    }


    //const {data: workoutHistory } = api.getWorkouts.getLastTwoWeeks.useQuery()
    //console.log(workoutHistory)

    const {mutate: makeNewWorkout, isLoading} = api.getWorkouts.newWorkout.useMutation({
    onSuccess(data, variables, context) {
      //setNewWorkout(data)
    },
    })

    function handleWorkoutClick( description: string){
        makeNewWorkout({
            nominalDay: "Thursday",
            description: description
        })
    }
    if (isLoading){
      return(
        <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status">
            <span
                className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
                >Loading...</span
            >
        </div>
      )
    }

    
    return(
      <div>
        <h3 className="text-xl font-bold">Todays Workout</h3>
        <br></br>
        {!inProgress && <CurrentWorkout/>}

        {//<LastWorkout workoutHistory={workoutHistory}></LastWorkout>
    }
      </div>
    )

}

interface WorkoutPlanProps{
  setWorkout: React.Dispatch<React.SetStateAction<
  ModelWorkout & {
    exercises: ModelExercise[];
}
  >>
}

function WorkoutPlan( {setWorkout}: WorkoutPlanProps){
  const [todaysWorkout, setTodaysWorkout] = useState<ModelWorkout>()
  const {data: workoutPlan} = api.getWorkouts.getWorkoutPlan.useQuery()

  const today = new Date()
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = weekdays[today.getDay()];
  console.log(todaysWorkout)

  if (workoutPlan){
    const newWorkout = workoutPlan[0]?.workouts.find((workout) => workout.nominalDay === todayName)
    if (newWorkout && !todaysWorkout){
      setTodaysWorkout(newWorkout)
      setWorkout(newWorkout)
    }
  return(
    <div>
      {workoutPlan?.[0]?.workouts?.map((workout, index) => (
        <div key={index}>
          <div>{workout.nominalDay}: {workout.description}</div>
          <div>
            {workout?.exercises.map((exercise, exIndex) => (
              <div key={exIndex}>
                <div>{exercise.description}: {exercise.weight} x {exercise.sets}</div>
              </div>
            ))}
          </div>
          <br></br>
        </div>
      ))}
    </div>
  )
}
return null
}

interface WorkoutWithExercise {
  workoutId: string;
  date: Date;
  nominalDay: string;
  userId: string;
  description: string;
  exercises: ModelExercise[];
}

function CurrentWorkout(){
  const [todaysWorkout, setTodaysWorkout] = useState<WorkoutWithExercise>()
  const [workoutStarted, setWorkoutStarted] = useState(false)
  const {data: workoutPlan} = api.getWorkouts.getWorkoutPlan.useQuery()

  const today = new Date()
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = weekdays[today.getDay()];


  if (workoutPlan && !todaysWorkout){
    const newWorkout = workoutPlan[0]?.workouts.find((workout) => workout.nominalDay === todayName)
    if (newWorkout && !todaysWorkout){
      setTodaysWorkout(newWorkout)
    }
  }
  if (!todaysWorkout){
    return(
        <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status">
            <span
                className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
                >Loading...</span
            >
        </div>
      )
    }
  if (todaysWorkout ){
    console.log(todaysWorkout)

  return(
    <div>
      {(!workoutStarted) && todaysWorkout?.exercises?.map((exercise, index)=> (
      <div key={index}>{exercise.description}: {exercise.weight} x {exercise.sets}</div>
    ))}
    {(!workoutStarted) && <StartWorkoutButton startWorkout={setWorkoutStarted}/>}
    {(workoutStarted && <WorkoutHandler {...todaysWorkout}/>)}

    </div>
  )
  }
  

return null
}

interface DoWorkoutProps{
  startWorkout: React.Dispatch<React.SetStateAction<boolean>>;
}

function StartWorkoutButton( {startWorkout}: DoWorkoutProps){
  function handleClick(){
    startWorkout(true)
  }
  return(
    <div>
      <button onClick={handleClick}>Begin Workout</button>
    </div>
  )
}

function WorkoutHandler( workout: WorkoutWithExercise){
  console.log(workout)
  return(
    <div>
      <div>{workout.exercises?.map((exercise, index)=>(
        <div key={index}>{exercise.description}</div>
      ))}</div>
    </div>
  )
}