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



function WorkoutUi(){
    const [newWorkout, setNewWorkout] = useState<Workout>()
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [inProgress, setInProgress] = useState(false)
    const [selectExercise, setSelectedExercise] = useState<Exercise | undefined>(undefined)
    
    const {data: testworkouts } = api.getWorkouts.getLastTwoWeeks.useQuery()
    console.log(testworkouts)
    //const {data: workoutHistory } = api.getWorkouts.getLastTwoWeeks.useQuery()
    //console.log(workoutHistory)

    const {mutate: makeNewWorkout, isLoading} = api.getWorkouts.newWorkout.useMutation({
    onSuccess(data, variables, context) {
      setNewWorkout(data)
    },
    })

    function handleWorkoutClick( description: string){
        makeNewWorkout({
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

    if (!newWorkout){
        return (
            <div>
            {(!newWorkout) && <NewWorkout startWorkout={handleWorkoutClick} />}
            </div>
    )}
    
    return(
      <div>
       <WorkoutTable exercises={exercises} workout={newWorkout} />
       {(!inProgress) && <NewExerciseForm exercises={exercises} updateExercises={setExercises}
        selectExercise={setSelectedExercise}
        exerciseSelected={setInProgress}
        workout={newWorkout} />}
        {(inProgress && selectExercise) && <ExerciseUi 
          setInProgress={setInProgress}
          exercises={exercises}
          exercise={selectExercise}
          updateExercises={setExercises}
          updateselectedExercise={setSelectedExercise}
        />}
        {(inProgress) && <EndWorkout 
          setNewWorkout={setNewWorkout}
          setInProgress={setInProgress}
          setExercises={setExercises}
          setSelectedExercise={setSelectedExercise}
        />}
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
                <td>{exercise.sets}</td>
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
  exerciseSelected: React.Dispatch<React.SetStateAction<boolean>>;
  selectExercise: React.Dispatch<React.SetStateAction<Exercise | undefined>>;
}

function NewExerciseForm({selectExercise, exercises, updateExercises, workout, exerciseSelected}: NewExerciseFromProps){
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
    exerciseSelected(true)
    selectExercise(data)
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

interface ExerciseUiProps{
  updateExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
  setInProgress: React.Dispatch<React.SetStateAction<boolean>>;
  exercise: Exercise;
  exercises: Exercise[];
  updateselectedExercise: React.Dispatch<React.SetStateAction<Exercise | undefined>>;
}

function ExerciseUi({exercises, updateExercises, updateselectedExercise, exercise, setInProgress} : ExerciseUiProps){
  const [newSet, setnewSet] = useState("")
  const [sets, setSets] = useState<string[]>([])
  console.log(exercise)

  const {mutate: saveExercise} = api.getWorkouts.updateExercise.useMutation({
  onSuccess(data, variables, context) {
    const updatedExercise = data
    console.log(updatedExercise)
    console.log("SAVED")
  },
  })

  const handleNewSet = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const updatedExercises = exercises.map((e)=> {
      if (e.description === exercise.description){
        if (e.sets){
          return {
            ...e,
            sets: e.sets.split(", ").map(Number).concat(parseInt(newSet)).join(", "),
          }
        } else {
          return {
            ...e,
            sets: newSet,
          }
        }
      } else {
        return e
      }
    })
    console.log("UPDATED")
    console.log(updatedExercises)
    updateExercises(updatedExercises)
    setnewSet("")
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setnewSet(event.target.value)
  }

  
  function handleNextExercise(){
    const currentExercise = exercises.find((ex)=> ex.exerciseId===exercise.exerciseId)
    if (currentExercise){
      saveExercise({ 
        exerciseId: currentExercise.exerciseId,
        sets: currentExercise.sets,
      })
      setInProgress(false)
    }
  }

  return(
    <div >
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
  
      <br></br>
      <div>
        <button
        onClick={handleNextExercise}
        className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400"
        >Next Exercise</button>
      </div>
      <br></br>
    </div>
)}

interface EndWorkoutProps{
  setNewWorkout: React.Dispatch<React.SetStateAction<Workout | undefined>>;
  setInProgress: React.Dispatch<React.SetStateAction<boolean>>;
  setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
  setSelectedExercise: React.Dispatch<React.SetStateAction<Exercise | undefined>>;
  
}

function EndWorkout({setNewWorkout, setInProgress, setExercises, setSelectedExercise}: EndWorkoutProps){
  function resetValues(){
    console.log("reset")
    setNewWorkout(undefined)
    setInProgress(false)
    setExercises([])
    setSelectedExercise(undefined)
  }
  return(
    <div>
      <button 
      onClick={resetValues}
      className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400"
       >End Workout</button>
    </div>
  )
}