import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";
import React, { FormEvent, useState, useTransition, useRef, useEffect } from 'react'
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
import { ActualWorkout, ActualExercise, User, Workout, Exercise, TestExercise, TestWorkout, ModelWorkout, ModelExercise } from "@prisma/client"
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
        <LoadingSpinner/>
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

interface WorkoutWithExercise {
  workoutId: string;
  date: Date;
  nominalDay: string;
  userId: string;
  description: string;
  exercises: ModelExercise[];
}

interface WorkoutActual {
  nominalDay: string | undefined;
  description: string | undefined;
  exercises: ExerciseActual[];
}
interface ExerciseActual {
  description: string | undefined;
  sets: resultOfSet[];
}

function LoadingSpinner(){
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

function CurrentWorkout(){
  const [todaysWorkout, setTodaysWorkout] = useState<WorkoutWithExercise>()
  const [workoutStarted, setWorkoutStarted] = useState(false)
  const [currentExercise, setCurrentExercise] = useState<ModelExercise | undefined >()
  const {data: workoutPlan, isLoading} = api.getWorkouts.getWorkoutPlan.useQuery()
  const [workoutActual, setWorkoutActual] = useState<WorkoutActual>()
  const [exerciseActual, setExerciseActual] = useState<ExerciseActual | undefined>()

  console.log("workout: ")
  console.log(workoutActual)

  console.log("exercise: ")
  console.log(exerciseActual)

  const today = new Date()
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = weekdays[today.getDay()];

  //populate exercises and weight
  if (!workoutActual && todaysWorkout){
    const newWorkoutActual : WorkoutActual = {
      nominalDay: todaysWorkout?.nominalDay,
      description: todaysWorkout?.description,
      exercises: [],
    }
    todaysWorkout.exercises.forEach((exercise)=>(
      newWorkoutActual.exercises.push({
        description: exercise.description,
        sets: [],
      } as ExerciseActual)
    ))
    setWorkoutActual(newWorkoutActual)
  }

  function updateWorkout(newExercise: ExerciseActual) {
  setWorkoutActual(prev => {
    const existingExerciseIndex = prev?.exercises.findIndex(exercise => exercise.description === newExercise.description);
    if (existingExerciseIndex !== -1 && existingExerciseIndex!== undefined) {
      if (!prev){return}
      const updatedExercises = [...prev.exercises];
      updatedExercises[existingExerciseIndex] = newExercise;
      return {
        ...prev,
        exercises: updatedExercises
      };
    } else {
      const newExercises = prev?.exercises ? [...prev.exercises, newExercise] : [newExercise];
      return {
        ...prev,
        exercises: newExercises,
        nominalDay: todaysWorkout?.nominalDay ?? "",
        description: todaysWorkout?.description ?? '',
      } ;
    }
  });
}

  if (workoutPlan && !todaysWorkout){
    const newWorkout = workoutPlan[0]?.workouts.find((workout) => workout.nominalDay === todayName)
    //const newWorkout = workoutPlan[0]?.workouts.find((workout) => workout.nominalDay === "Saturday")
    if (newWorkout){
      setTodaysWorkout(newWorkout)
    }
  }
  if (isLoading){return(<LoadingSpinner/>)}

  if (!todaysWorkout){
    return(<div>No Workout</div>)
  }
  if (todaysWorkout ){

  return(
    <div>
      {(!workoutStarted) && todaysWorkout?.exercises?.map((exercise, index)=> (
      <div key={index}>{exercise.description}: {exercise.weight} x {exercise.sets}</div>
    ))}
    <br></br>
    <StartWorkoutButton startWorkout={setWorkoutStarted}/>
    <WorkoutHandler setCurrentExercise={setCurrentExercise} workout={todaysWorkout}/>
    <ExerciseForm 
    updateWorkout={updateWorkout}
    exerciseActual={exerciseActual}
    updateExercise={setExerciseActual}
    setWorkoutActual={updateWorkout}
    setCurrentExercise={setCurrentExercise} exercise={currentExercise}/>
    {(workoutActual) && <CompletedWork workout={workoutActual}/>}
    {(workoutActual) && <EndWorkout workout={workoutActual}/>}
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
      <button 
      className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400"
      onClick={handleClick}>Begin Workout</button>
    </div>
  )
}


interface WorkoutHandlerProps{
  setCurrentExercise: React.Dispatch<React.SetStateAction<ModelExercise | undefined>>;
  workout: WorkoutWithExercise;
}

function WorkoutHandler( {workout, setCurrentExercise}: WorkoutHandlerProps){

  function handleClick( thisexercise: ModelExercise){
    setCurrentExercise(thisexercise)
  }
  return(
    <div>
      <div className="flex flex-col items-center">{workout.exercises?.map((exercise, index)=>(
        <div className="flex flex-row items-center m-2" key={index}>
          <div>{exercise.description}</div>
          <button
          onClick={()=> handleClick(exercise)}
        className="p-1 mx-2 hover:underline hover:bg-slate-300 rounded-full bg-slate-400"
          >Begin</button>
        </div>
      ))}</div>
    </div>
  )
}

interface CurrentExerciseProps{
  exercise: ModelExercise | undefined; 
  exerciseActual: ExerciseActual | undefined;
  setCurrentExercise: React.Dispatch<React.SetStateAction<ModelExercise | undefined>>;
  updateExercise: React.Dispatch<React.SetStateAction<ExerciseActual | undefined>>;
  updateWorkout: (newExercise: ExerciseActual)=> void;
  setWorkoutActual: (newExercise: ExerciseActual)=> void;
}

type resultOfSet = {
    weight: number;
    reps: number;
    rir: number;
}

interface saveSetProps {
  weight: number;
  reps: number;
  rir: number;
  event: React.FormEvent<HTMLFormElement>;
}

function ExerciseForm({exercise, setCurrentExercise, updateExercise, exerciseActual, updateWorkout, setWorkoutActual} : CurrentExerciseProps) {
  //needs to know current exercise, update exerciseActual
  const [data, setData] = useState<resultOfSet[]>([])


  const handleSaveSet = ({weight, reps, rir, event}: saveSetProps ) => {
    event.preventDefault();
    const newSet : resultOfSet = {
      weight: weight,
      reps: reps,
      rir: rir,
    }
    if (exerciseActual){
      const newExerciseSets = [...exerciseActual.sets, newSet]
      const newExerciseActual: ExerciseActual = {
        description: exercise?.description ??  "",
        sets: newExerciseSets,
      }
      updateExercise(newExerciseActual)
      setWorkoutActual(newExerciseActual)
    } else {
      const newExerciseSets = [newSet]
      const newExerciseActual: ExerciseActual = {
        description: exercise?.description ??  "",
        sets: newExerciseSets,
      }
      updateExercise(newExerciseActual)
      setWorkoutActual(newExerciseActual)
    }

    const newData = [...data, newSet]
    setData(newData)
    console.log(`weight: ${weight}, reps: ${reps}, rir: ${rir}`)
  };
  function handleSaveExercise(){
    if (exerciseActual){
      updateWorkout(exerciseActual)
    }
    setCurrentExercise(undefined)
    updateExercise(undefined)
    setData([])
  }


  return (
    <div className="p-4">
      <div>{exercise?.description} ({exercise?.weight} x {exercise?.sets})</div>
      <DisplayTotalSets sets={data}/>
      <SetForm saveSet={handleSaveSet} exercisePlan={exercise} exerciseActual={exerciseActual}/>
      <button
      onClick={handleSaveExercise}
      >Next Exercise</button>
    </div>)

  }

type exerciseResult = {
  sets: resultOfSet[];
}

  function DisplayTotalSets({sets}: exerciseResult){
    if (!sets){
      return(<div></div>)
    }
    return(
      <div>
        {sets?.map((currentSet, index)=>(
          <div key={index}>{currentSet.weight} x {currentSet.reps} ({currentSet.rir} RIR)</div>
        ))}
      </div>
    )
  }

interface setFormProps {
  saveSet: ({ weight, reps, rir, event }: { weight: number, reps: number, rir: number, event: React.FormEvent<HTMLFormElement>}) => void;
  exercisePlan: ModelExercise | undefined;
  exerciseActual: ExerciseActual | undefined;
}

function SetForm( {saveSet, exerciseActual, exercisePlan}: setFormProps ) {
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);
  const [rir, setRir] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const repsInputRef = useRef<HTMLInputElement>(null)


  useEffect(() => {
    const defaultWeight = getMaxWeight(exerciseActual) ?? exercisePlan?.weight ?? 0;
    if (defaultWeight > 0) {
      setWeight(defaultWeight);
    }
  }, [exerciseActual, exercisePlan]);


  const handleWeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWeight(parseInt(event.target.value));
  };

  const handleRepsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReps(parseInt(event.target.value));
  };

  const handleRirChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRir(parseInt(event.target.value));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveSet({weight: weight, reps: reps, rir: rir, event: event})
    setReps(0)
    setIsSubmitted(true);
    repsInputRef.current?.focus()
  };


  return (
    <div className="p-4">
      <div>Set Form:</div>
      <form onSubmit={handleSubmit}>
        <label>
          Weight:
          <input
            className="text-black"
            type="number"
            value={weight}
            onChange={handleWeightChange}
          />
        </label>
        <label>
          Reps:
          <input
            className="text-black"
            type="number"
            ref={repsInputRef}
            value={reps}
            onChange={handleRepsChange}
          />
        </label>
        <label>
          RIR:
          <input
            className="text-black"
            type="number"
            value={rir}
            onChange={handleRirChange}
          />
        </label>
        <button type="submit">Save</button>
      </form>
    </div>)

  }

function getMaxWeight(exercise: ExerciseActual | undefined):number|undefined{
  if (!exercise){return undefined}
  let maxWeight = 0
  for (const set of exercise.sets){
    if (set.weight > maxWeight){
      maxWeight = set.weight
    }
  }
  return maxWeight
}


  interface CompletedWorkProps{
    workout: WorkoutActual;
  }

  function CompletedWork({workout}: CompletedWorkProps){
    return(
      <div>
      <div>{workout.description}</div>
      <div>
        {workout.exercises.map((exercise, index)=>(
        <div key={index}>
          <div>{exercise.description}</div>
          <div>{exercise.sets.map((setData, place) => (
            <div key={place}>{setData.weight === 0? "BW" : setData.weight} x {setData.reps} at {setData.rir} RIR</div>
          ))}</div>
        </div>
      ))}</div>
      </div>
 )} 

interface EndWorkoutProps{
  workout: WorkoutActual
}

 function EndWorkout({workout}: EndWorkoutProps){
    const {mutate: saveWorkout, isLoading} = api.getWorkouts.saveWorkout.useMutation({
    onSuccess(data, variables, context) {
      //setNewWorkout(data)
      console.log(data)
    },
    })
  function saveTodaysWorkout(){
    console.log(workout)
    console.log("attempting to save...")
    if ((workout.description!==undefined) && (workout.nominalDay!==undefined)){
      //saveWorkout(workout)
      //type error, string | undefined cant be assigned to string
    }
  }
  return(<div>
    <button
    onClick={saveTodaysWorkout}
    >Save Workout</button>
  </div>)
 }