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
import type { User, Workout, Exercise } from "@prisma/client"
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

export default Home



function WorkoutUi(){
    const [newWorkout, setNewWorkout] = useState<Workout>()
    const [exercises, setExercises] = useState<Exercise[]>([])

    const {mutate: makeNewWorkout} = api.getWorkouts.newWorkout.useMutation({
    onSuccess(data, variables, context) {
      setNewWorkout(data)
    },
    })

    console.log(newWorkout)
    console.log(exercises)
    function handleWorkoutClick( description: string){
        makeNewWorkout({
          description: description
        })
    }

    if (!newWorkout){
        return (
            <div>
            {(!newWorkout) && <NewWorkout startWorkout={handleWorkoutClick} />}
            </div>
    )}
    
    return(
      <div>
       <WorkoutTable exercises={exercises} workout={newWorkout} />
       <NewExerciseForm exercises={exercises} updateExercises={setExercises}
        workout={newWorkout} />
      </div>
    )

}

interface NewWorkoutProps{
  startWorkout: (description: string)=> void;
}

function NewWorkout( {startWorkout} : NewWorkoutProps): JSX.Element | null {
    const [begin, setBegin] = useState(false)
    const [start, setStart] = useState(false)

    function handleClick(){
      setBegin(true)
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>, inputDescription:string) {
      event.preventDefault()
      setStart(true)
      startWorkout(inputDescription)
    }

    return(
      <div className="object-contain m-2">
      {(!begin) && <button onClick={handleClick} className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400">New Workout</button>}
      { (begin) && (!start) && <NewWorkoutform 
        handleSubmit={handleSubmit} 
        />}
      </div>
    )
}

interface workoutFormProps {
  handleSubmit?: (event: React.FormEvent<HTMLFormElement>, inputDescription: string) => void;
}

function NewWorkoutform( { handleSubmit }: workoutFormProps){
  const [inputDescription, setInputDescription] = useState("")

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputDescription(event.target.value)
  }

  if (!handleSubmit){
    return null;
  }

  return(
    <div>
      <form onSubmit={(event) => handleSubmit(event, inputDescription)}>
        <label>Workout:</label>
        <input type='text' placeholder="Description"
        value={inputDescription}
        onChange={handleChange}
        className="text-black"></input>
        <button type="submit">Begin</button>
      </form >
    </div>
  )
}

interface WorkoutTableProps {
  workout: Workout;
  exercises: Exercise[] | undefined;
}

function WorkoutTable( {workout, exercises}: WorkoutTableProps){
    return(
      <div>
        <h1>{workout.description}</h1>
        <table className="mx-auto">
          <thead>
            <tr>
              <th>Exercise</th>
              <th>Weight</th>
              <th>Sets</th>
            </tr>
          </thead>
          <tbody>
            { exercises && exercises.map((exercise, index) =>(
              <tr key={index}>
                <td>{exercise.description}</td>
                <td>{exercise.weight}</td>
                <td>{ Array.isArray(exercise.sets) ? exercise.sets.join(', '): '-'}</td>
              </tr>
            )) }
          </tbody>
        </table>
      </div>
    )

}

interface NewExerciseFromProps{
  exercises: Exercise[] | undefined,
  updateExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
  workout: Workout;
}

function NewExerciseForm({exercises, updateExercises, workout}: NewExerciseFromProps){
  const [exerciseName, setExerciseName] = useState("")
  const [weight, setWeight] = useState("")
  const handleName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExerciseName(event.target.value)
  }
  const handleWeight = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWeight(event.target.value)
  }

  const {mutate: makeNewExercise} = api.getWorkouts.newExercise.useMutation({
  onSuccess(data, variables, context) {
    const updatedExercises = [...(exercises ?? []), data]
    updateExercises(updatedExercises)
  },
  })

  function handleNewSet(){
    event?.preventDefault()
    console.log("new set")
    console.log("name: " + exerciseName)
    console.log("weight: " + weight)
    makeNewExercise({
      workoutId: workout.workoutId,
      weight: parseInt(weight),
      sets: "", 
      description: exerciseName,
    })
  }

  return(
    <div>
      <form onSubmit={handleNewSet}>
        <label htmlFor="exerciseName">Exercise: </label>
        <input 
        value={exerciseName}
        className="text-black"
        onChange={handleName} id="exerciseName"type="text"></input>
        <label htmlFor="weightNumber">Weight: </label>
        <input 
        value={weight}
        className="text-black"
        onChange={handleWeight} id="weightNumber"type="number"></input>
        <button 
        className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400"
        type="submit">Add</button>
      </form>
    </div>
  )
}