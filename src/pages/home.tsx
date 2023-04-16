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
import { boolean } from "zod";
import type { User, Workout } from "@prisma/client"
import { prisma } from "~/server/db";

//@refresh reset





const Home: NextPage = () => {

  return (
    <>
      <Head>
        <title>Lyfter</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="text-white text-center flex min-h-screen   flex-col  bg-gradient-to-b from-[#000000] to-[#44454b]">
        <div>
          <SignedIn>
            <div className="text-white   items-end flex p-6 items-right flex-col ">
                <UserButton appearance={{ 
                  elements: { 
                    userButtonAvatarBox: { width: 60, height: 60 } 
                    }
                  }} />
            </div>
          <br></br>
          <WorkoutUi />
          <br></br>
      <div>
      </div>
        </SignedIn>
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

export default Home;

function CreateWorkout(){
  return(
    <div className="object-contain m-2">
    <button className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400">Create Workout Plan</button>
    </div>
  )
}

interface BeginWorkoutProps {
  inProgress: boolean;
  startWorkout: () => void;
}

function BeginWorkout({ inProgress, startWorkout}: BeginWorkoutProps): JSX.Element | null {
  if (!inProgress){
    return(
      <div className="object-contain m-2">
      <button onClick={startWorkout} className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400">Begin Workout</button>
      </div>
    )
  }
  return null;
}


interface WorkoutData {
  workoutId?:  string    ;
  date?:       string  ;
  nominalDay?: string;
  userId?:     string ;
  description?: string;
}

function WorkoutUi(){
  const [currentExercise, setCurrentExercise] = useState<ExerciseData | null>(null)
  const [hasExercise, sethasExercise] = useState(false)
  const [exercises, setWorkoutExercises] = useState<ExerciseData[]>([]) 
  const [workoutStarted, setWorkoutStarted] = useState(false)
  const [workoutId, setWorkoutId] = useState('')
  //kinda garbage how current exercise doesn't  get updated with sets
  const currentUser = useUser()

  function handleSetExercise(newExercise: ExerciseData){
    setCurrentExercise(newExercise)
    sethasExercise(true)
    setWorkoutExercises( prevState => [...exercises, newExercise])
    console.log(currentExercise)
  }
    
  const { mutate: makeNewExercise } = api.getWorkouts.newExercise.useMutation()
  const {mutate: makeNewWorkout} = api.getWorkouts.newWorkout.useMutation()
  if (currentUser.isSignedIn && currentUser.user.id){
    const {data: workout} = api.getWorkouts.getLatestWorkoutByUserId.useQuery({userId: currentUser.user.id})
    console.log(workout)
  }

  function handleNextExercise(){
    // need workout id, and exercises.slice(-1)[0]
    //write exercise to db
    const exercise = exercises.slice(-1)[0]
    console.log("exercise: ")
    console.log(exercise?.description)
    console.log(exercise?.weight)
    console.log(exercise?.sets)
    console.log(workoutId)
    
    //const {data: workoutid} =  api.getWorkouts.getLatestWorkoutByUserId.useQuery({
      //userId: user.user?.id || ""
    //})
    //console.log(workoutid)
    if (exercise && exercise.sets){
      console.log("exercise mutate fired")
      console.log(exercise)
      makeNewExercise({ 
        workoutId: workoutId,
        weight: exercise.weight,
        sets: exercise.sets.join(', '),
        description: exercise.description
       })
    }

    setCurrentExercise(null)
  }
  const user = useUser()


  function handleStartWorkout(){
    console.log('handleworkout fired')
    setWorkoutStarted(true)
    if (user.isSignedIn && user.user.id){
      const workout = makeNewWorkout()
      console.log("new workout: ")
      const {data: newworkoutId} = api.getWorkouts.getLatestWorkoutByUserId.useQuery({ userId: user.user.id})
      if (newworkoutId){
        console.log("NEW WORKOUT: ")
        console.log(newworkoutId[0])
      }
        
      console.log(workout)
    }
  }


 
  if (!workoutStarted){
    return <BeginWorkout inProgress={workoutStarted} startWorkout={handleStartWorkout}></BeginWorkout>
  } 

  return(
    <div>
      {<ExerciseTable exercises = {exercises}/>}
      {(!currentExercise) && <NewExercise onSend={handleSetExercise}/>}
      {currentExercise && <CurrentExercise 
          setExercises={setWorkoutExercises} 
          exercise={currentExercise} 
          exercises={exercises}
        />}
      <br></br>
      {hasExercise && <NextExercise lastExercise={currentExercise!} saveExercise={handleNextExercise}/>}
      <br></br>
      <EndWorkout />
    </div>
  )
}

interface Exercise {
  description: string;
  weight: number,
  sets: number[] | null;
}

interface ExerciseData {
  description: string;
  weight: number;
  sets?: number[] | null;
}

interface ExerciseTableProps {
  exercises: ExerciseData[];
}

function ExerciseTable({ exercises }: ExerciseTableProps){
  if (!exercises){
    return (<div></div>)
  }

  return (
    <div>
        <table className="table-auto mx-auto">
          <thead>
            <tr>
              <th>Exercise</th>
              <th>Weight</th>
              <th>Sets</th>
            </tr>
          </thead>
          <tbody>
            {exercises.map((exercise, index) =>(
              <tr key={index}>
                <td>{exercise.description}</td>
                <td>{exercise.weight}</td>
                <td>{exercise.sets?.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  )
}

interface CurrentExerciseProps {
  exercise: ExerciseData;
  exercises: ExerciseData[];
  setExercises: React.Dispatch<React.SetStateAction<ExerciseData[]>>;
}

function CurrentExercise({exercise, exercises, setExercises}: CurrentExerciseProps){
  const [newSet, setNextSet] = useState("")
  //okay so issue is idk where to handle the exercise save

  const handleNewSet = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const updatedExercises = exercises.map((e)=> {
      if (e.description === exercise.description){
        if (e.sets){
          return {
            ...e,
            sets: [...e.sets, parseInt(newSet)],
          }
        } else {
          return {
            ...e,
            sets: [parseInt(newSet)],
          }
        }
      } else {
        return e
      }
    })
    setExercises(updatedExercises)
    setNextSet("")
  }
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNextSet(event.target.value)
  }


  return(
    <div className="">
      <form onSubmit={handleNewSet}>
        <label htmlFor="repCount">Reps: </label>
        <input 
        value={newSet}
        className="text-black"
        onChange={handleChange} id="repCount"type="number"></input>
        <button 
        className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400"
        type="submit">Add</button>
      </form>
    </div>
  )
}
interface NextExerciseProps {
  lastExercise: ExerciseData;
  saveExercise: (exercise: ExerciseData) => void;
}

function NextExercise( { lastExercise, saveExercise}: NextExerciseProps){
  function handleClick(){
    saveExercise(lastExercise)
    console.log("handleclick fired")
  }

  return(
    <div>
      <button
      onClick={handleClick}
      className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400"
      >Next Exercise</button>
    </div>
  )
}


function EndWorkout(){
  return(
    <div>
      <button
      className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400"
      >End Workout</button>
    </div>
  )
}

interface NewExerciseProps {
  onSend: (exercise: Exercise) => void;
}

function NewExercise({ onSend }: NewExerciseProps){
  const [description, setDescription] = useState("")
  const [weight, setWeight] = useState("")

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const newExercise = {
      description: description,
      weight: parseInt(weight),
      sets: []
    };

    console.log("exercise: " + description)
    console.log("weight: " + weight)
    onSend(newExercise)
  }
  const handleName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(event.target.value)
  }
  const handleNumber = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWeight(event.target.value)
  }

  return(
    <div>
      <form onSubmit={handleSubmit}>
        <div id="exerciseInput">
          <label>Exercise: </label>
          <input className="text-black" onChange={handleName} type="text" id="description"></input>
        </div>
        <br></br>
        <div id="weightInput">
          <label>Weight: </label>
          <input onChange={handleNumber} className="text-black" type="number" id="weight"></input>
        </div>
        <br></br>
        <button 
        className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400"
        type="submit">Begin</button>
      </form>
    </div>
    )
}
function EditWorkout(){
  return(
    <div className="object-contain  m-2">
    <button className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400">Edit Workout Plan</button>
    </div>
  )
}
