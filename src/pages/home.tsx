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
//@refresh reset

const Home: NextPage = () => {
  const user = useUser()
  if (user.isSignedIn){
    console.log(user.user.id)
    const { data: allWorkouts } = api.getWorkouts.ByUserId.useQuery(
      {userId: user.user.id}
    )
    console.log(allWorkouts)

    //if (allWorkouts){
      //allWorkouts?.forEach(workout => {
        //if (workout){
          //console.log(workout)
        //}
      //})
    //};
    //const workoutId = allWorkouts?.[0]?.workoutId
    //if (workoutId){
      //const {data: allExercises} = api.getWorkouts.getExerciseByWorkoutId.useQuery(
        //{ workoutId: workoutId}
      //)
      //console.log(allExercises)
    //}
    }
          
        
  
  //const { data: workouts } = api.getWorkouts.getAllWorkouts.useQuery()
  //const { data: exercises } = api.getWorkouts.getAllExercises.useQuery()
  //workouts?.forEach((workout) => { console.log(
    //'id: ' + workout.workoutId + ', date: ' + workout.date)})
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
          <BeginWorkout></BeginWorkout>
          <br></br>
          <WorkoutUi/>
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
function BeginWorkout(): JSX.Element | null {
  const [inProgress, setinProgress] = useState(false)
  if (!inProgress){
    return(
      <div className="object-contain m-2">
      <button onClick={() => setinProgress(true)} className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400">Begin Workout</button>
      </div>
    )
  }
  return null;
}

function WorkoutUi(){
  const [currentExercise, setCurrentExercise] = useState<ExerciseData | null>(null)
  const [hasExercise, sethasExercise] = useState(false)
  const [exercises, setWorkoutExercises] = useState<ExerciseData[]>([]) 

  function handleSetExercise(newExercise: ExerciseData){
    setCurrentExercise(newExercise)
    sethasExercise(true)
    setWorkoutExercises( prevState => [...exercises, newExercise])
    console.log(currentExercise)
  }
  function handleExerciseChange(exercises: ExerciseData[]){
    console.log(exercises)
    setWorkoutExercises(exercises)
  }
  

  return(
    <div>
      {(!currentExercise) && <NewExercise onSend={handleSetExercise}/>}
      {currentExercise && <ExerciseTable exercises = {exercises}/>}
      {currentExercise && <CurrentExercise 
          setExercises={handleExerciseChange} 
          exercise={currentExercise} 
          exercises={exercises}
        />}
      <br></br>
      {currentExercise && <NextExercise exercise = {exercises}/>}
      
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
  setExercises: Function;
}

function CurrentExercise({exercise, exercises, setExercises}: CurrentExerciseProps){
  const [newSet, setNextSet] = useState("")

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

function NextExercise( {exercise} : {exercise : ExerciseData[]}){
  function handleNextExercise() {
    console.log(exercise)
  }
  return(
    <div>
      <button
      className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400"
      onClick={handleNextExercise}
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
