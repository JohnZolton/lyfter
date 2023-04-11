import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";
import { useState, useTransition } from 'react'
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
  //if (user.isSignedIn){
    //console.log(user.user.id)
  //}
  const { data: workouts } = api.getWorkouts.getAllWorkouts.useQuery()
  const { data: exercises } = api.getWorkouts.getAllExercises.useQuery()
  //workouts?.forEach((workout) => { console.log(
    //'id: ' + workout.workoutId + ', date: ' + workout.date)})
  return (
    <>
      <Head>
        <title>Lyfter</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
        <SignedIn>
      <div className="text-white   items-end flex p-6 items-right flex-col  bg-black">
          <UserButton appearance={{ 
            elements: { 
              userButtonAvatarBox: { width: 60, height: 60 } 
              }
            }} />
      </div>
      <main className="text-white text-center flex min-h-screen   flex-col  bg-gradient-to-b from-[#000000] to-[#44454b]">
      <div>
        hello {user.user?.firstName}
      </div>
      <br></br>
        <BeginWorkout></BeginWorkout>
        <br></br>
        <WorkoutUi/>
        <br></br>
      <div>
      <div>
      { exercises?.map((exercise) => (
      <div id={exercise.exerciseId}>
        <div>{exercise.description}</div>
        <div>{exercise.weight}</div>
        <div>{exercise.sets}</div>
      </div>
      )) }
      </div>
      </div>
      </main>
        </SignedIn>
        <SignedOut>
          {/* Signed out users get sign in button */}
          <SignInButton redirectUrl="home">
            <button className="rounded-full text-xl text-black bg-white p-3">Sign In</button>
            </SignInButton>
        </SignedOut>
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
function BeginWorkout(){
  const [inProgress, setinProgress] = useState(false)
  if (!inProgress){
    return(
      <div className="object-contain m-2">
      <button onClick={() => setinProgress(true)} className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400">Begin Workout</button>
      </div>
    )
  }
}

function WorkoutUi(){
  const [currentExercise, setCurrentExercise] = useState(null)
  const [hasExercise, sethasExercise] = useState(false)
  let exercise = []
  function handleSetExercise(newExercise){
    setCurrentExercise(newExercise)
    sethasExercise(true)
    exercise.push(newExercise)
    console.log(currentExercise)
  }

  return(
  <div>
    {(!currentExercise) && <NewExercise onSend={handleSetExercise}/>}
    {currentExercise && <CurrentExercise exercise={currentExercise}/>}
    <NextExercise/>
    <EndWorkout />
  </div>
  )
}

function CurrentExercise({exercise}){
  const [sets, setSets] = useState([])
  const [nextSet, setNextSet] = useState("")

  const handleNewSet = (event) => {
    event.preventDefault()
    setSets([...sets, nextSet])
    setNextSet("")
  }
  const handleChange = (event) => {
    setNextSet(event.target.value)
    console.log(nextSet)
  }


  return(
    <div>
      <div>
        {exercise.description}
      </div>
      <div>
        {exercise.weight}
      </div>
      {sets?.map((set, index) => (
        <div id={index}>{set}</div>
      ))}
      <form onSubmit={handleNewSet}>
        <label for="repCount">Reps: </label>
        <input 
        value={nextSet}
        className="text-black"
        onChange={handleChange} id="repCount"type="number"></input>
        <button type="submit" onSubmit={handleNewSet}>Add</button>
      </form>
    </div>
  )
}

function NextExercise(){
  return(
    <div>
      <button>Next Exercise</button>
    </div>
  )
}
function EndWorkout(){
  return(
    <div>
      <button>End Workout</button>
    </div>
  )
}

function NewExercise({ onSend }){
  const [description, setDescription] = useState("")
  const [weight, setWeight] = useState("")

  const handleSubmit = (event) => {
    event.preventDefault()
    console.log("exercise: " + description)
    console.log("weight: " + weight)
    onSend({"description" : description, "weight": weight})
  }
  const handleName = (event) => {
    setDescription(event.target.value)
  }
  const handleNumber = (event) => {
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
        <button type="submit">Add</button>
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
function WorkoutForm(){
  return(
    <input></input>
  )
}