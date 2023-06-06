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
import type { User, Workout, WorkoutPlan, ActualWorkout, ActualExercise, exerciseSet, WorkoutPlanTwo } from "@prisma/client"
import { prisma } from "~/server/db";
import { empty } from "@prisma/client/runtime";

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
<nav className="flex items-center justify-between flex-wrap bg-black-500">
        <SignedIn>

            <div className="text-white   items-end flex p-6 items-right flex-col ">
                <UserButton appearance={{ 
                  elements: { 
                    userButtonAvatarBox: { width: 60, height: 60 } } }} /> </div> </SignedIn> <div className="flex items-center flex-shrink-0 text-white"> </div> <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto"> <div className="text-sm lg:flex-grow"> <Link href="home" className="block mt-4 lg:inline-block lg:mt-0 text-slate-200 hover:text-white mr-4">Home</Link> <Link href="makeplan" className="block mt-4 lg:inline-block lg:mt-0 text-slate-200 hover:text-white mr-4">Edit Workout Plan</Link> < Link href="allworkouts" className="block mt-4 lg:inline-block lg:mt-0 text-slate-200 hover:text-white mr-4">Workout History</Link>
    </div>
    <div>
    </div>
  </div>
</nav>
        <div>
          <SignedIn>
          <br></br>
          <NewWorkoutUi />
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

function NewWorkoutUi(){
  return(
    <div>
      <TestButton></TestButton>
      <br></br>
      <div>or make your own</div>
      <br></br>
      <WeekForm></WeekForm>
      <br></br>
      <WorkoutDisplay/>
    </div>
  )
}

function WeekForm(){
  const [daysSelected, setDaysSelected] = useState<string[]>([])
  const daysOfWeek : string[]= ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  function handleCheck(newDay: string, checked: boolean){
    if (checked) {
      setDaysSelected(prevDays => [...prevDays, newDay]);
    } else {
      setDaysSelected(prevDays => prevDays.filter(day => day !== newDay));
    }
  }

  const [newPlan, setNewPlan] = useState<WorkoutTemplate[]>([])

  const handlePlanUpdate = (newDay: WorkoutTemplate) => {
    const updatedPlan = [...newPlan, newDay]
    setNewPlan(updatedPlan)
    console.log(updatedPlan)
  }

  const {mutate: makePlan, isLoading} = api.getWorkouts.newTestPlanTwo.useMutation({
    onSuccess(data, variables, context) {
      console.log(data)
    },
    })
    
  const saveWorkout = () => {
    console.log("workout saved: ")
    console.log(newPlan) //here
    const updatedPlan: WorkoutTemplate[] = emptyWorkoutPlan.map((emptyWorkout)=>{
      const matchingWorkout = newPlan.find((workout) => workout.nominalDay=== emptyWorkout.nominalDay)
      if (matchingWorkout){
        return matchingWorkout
      }
      return emptyWorkout
    })
    console.log(updatedPlan)
    makePlan( { workouts: updatedPlan })
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
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-3xl font-bold text-slate-300 text-center mb-4">
        Select Workout Days
      </div>
      <div className="flex flex-wrap justify-between">
        {daysOfWeek.map((day) => (
          <div key={day} className="flex items-end mb-4 sm:mb-0 sm:mr-4 mx-4">
            <label htmlFor={day} className="text-lg mr-2">
              {day}
            </label>
            <input
              id={day}
              type="checkbox"
              onChange={(event) => handleCheck(day, event.target.checked)}
              className="form-checkbox h-6 w-6"
            />
          </div>
        ))}
      </div>
      <WorkoutForm
        savePlan={saveWorkout}
        days={daysSelected}
        handlePlanUpdate={handlePlanUpdate}
      />
    </div>
  )
}

interface WorkoutFormProps {
  days: string[],
  handlePlanUpdate: (newDay: WorkoutTemplate) => void;
  savePlan: () => void;
}

interface WorkoutPlanInput {
  sunday: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
}


function WorkoutForm( {days, handlePlanUpdate, savePlan} : WorkoutFormProps){

  if (days.length === 0){ return <div></div>}

  const sortedDays = [...days].sort((a, b) => {
    const order = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return order.indexOf(a) - order.indexOf(b);
  });

  return(
    <div>
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Create Your Weekly Workout Plan</h1>
          {sortedDays.map((day) => (
            <div className="flex flex-wrap mb-4" key={day}>
              <div className="w-full sm:w-3/4">
                <NewDay day={day} updatePlan={handlePlanUpdate}/>
              </div>
            </div>
          ))}
          <div className="mt-4">
            <button onClick={savePlan} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Save Plan</button>
          </div>
    </div>
    </div>
  )
}

interface NewExerciseProps {
  exercises: ExerciseTemplate[] | undefined;
  setExercises: React.Dispatch<React.SetStateAction<ExerciseTemplate[] | undefined>>;
}


function NewExercise({exercises, setExercises}: NewExerciseProps){
  const [description, setDescription] = useState('')
  const [weight, setWeight] = useState(0)
  const [sets, setSets] = useState<SetTemplate[]>()

  const handleSubmit = (event:React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sets){
    const newExercise: ExerciseTemplate ={
      description: description,
      weight: weight,
      sets: sets,
    };
    console.log(newExercise)
    if (exercises){
      const newExercises: ExerciseTemplate[] = [...exercises, newExercise]
      setExercises(newExercises)
    } else {
      setExercises([newExercise])
    }
    }
    setDescription('')
    setWeight(0)
    setSets([])
  }
  const handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(event.target.value);
  };
  const handleWeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWeight(parseInt(event.target.value));
  };
  const handleSetsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSets(Array(parseInt(event.target.value)).fill({...emptySet, weight: weight}));
  };

  return(
    <div className="w-full flex justify-end">
      <form onSubmit={handleSubmit} className="flex flex-wrap">
        <div className="flex items-center mb-4">
          <label htmlFor="description" className="mr-2">Exercise:</label>
          <input
            id="description"
            type="text"
            required
            className="text-black w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md"
            value={description}
            onChange={handleDescriptionChange}
          />
        </div>

        <div className="flex items-center mb-4 ml-auto">
          <label htmlFor="weight" className="mr-2">Weight:</label>
          <input
            id="weight"
            type="number"
            required
            className="text-black w-20 sm:w-auto px-4 py-2 border ml-auto border-gray-300 rounded-md"
            value={weight}
            onChange={handleWeightChange}
          />
        </div>

        <div className="flex items-center mb-4 mx-1 ml-auto">
          <label htmlFor="sets" className="mr-2">Sets:</label>
          <input
            id="sets"
            type="number"
            min="1"
            required
            className="text-black w-20 sm:w-auto px-4 py-2 border border-gray-300 rounded-md"
            value={sets?.length}
            onChange={handleSetsChange}
          />
        </div>
        <div className="ml-auto">
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Add Exercise
          </button>
        </div>

      </form>
    </div>
  )
}

interface NewDayProps {
  day: string,
  updatePlan: (newDay: WorkoutTemplate) => void;
}

function NewDay({day, updatePlan}: NewDayProps){
  const [exercises, setExercises] = useState<ExerciseTemplate[]>()
  const [description, setDescription] = useState('')
  const [submittedDescription, setSubmittedDescription] = useState('');
  const [descriptionset, setdescriptionset] = useState(false)
  const [daySaved, setDaySaved] = useState(false)

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setDescription(event.target.value);
};

const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setSubmittedDescription(description);
  setdescriptionset(true)
};
//need to have a running day plan and populate with exercises as they add
const handleSetDay = () => {
  if (description && exercises){
    const dayWorkout: WorkoutTemplate = {
      description: description,
      nominalDay: day,
      exercises: exercises,
    }
    console.log('newday comp')
    console.log(dayWorkout)
    setDescription("");
    updatePlan(dayWorkout)
    setDaySaved(true)
  }
}

  return(

     <div className="max-w-md mx-auto">
      <div className="w-full sm:w-1/4">{day}</div>
      <div>
        {!submittedDescription && (
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="flex flex-wrap">
              <div className="flex items-center mb-2 sm:mb-0 sm:w-1/4">
                <label className="mr-2">Description:</label>
                <input
                  type="text"
                  className="w-full max-w-xs px-4 py-2 border text-black border-gray-300 rounded-md"
                  value={description}
                  onChange={handleDescriptionChange}
                />
              </div>
            </div>
            <div className="flex justify-end w-full sm:w-3/4">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Enter
              </button>
            </div>
          </form>
        )}
        {submittedDescription && <div className="mb-4">{submittedDescription}</div>}
      </div>

      {exercises && (
        <div className="flex flex-col mb-4">
          <table className="min-w-full divide-y">
            <thead>
              <tr>
                <th className="py-2">Description</th>
                <th className="py-2">Weight</th>
                <th className="py-2">Sets</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {exercises.map((exercise) => (
                <tr key={exercise.description}>
                  <td className="py-2">{exercise.description}</td>
                  <td className="py-2">{exercise.weight}</td>
                  <td className="py-2">{exercise.sets.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!daySaved && descriptionset && (
        <NewExercise exercises={exercises} setExercises={setExercises} />
      )}

      {!daySaved && descriptionset && (
        <button
          onClick={handleSetDay}
          className="bg-blue-500 m-2 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Save Day
        </button>
      )}
    </div>
)
}

function MakePplSplit(){
  const {mutate: makePlan, isLoading} = api.getWorkouts.newTestPlan.useMutation({
    onSuccess(data, variables, context) {
      console.log(data)
      window.location.reload()
    },
    })

  function handleClick(){
    makePlan( {workouts: pplPlanArray})
  }
  return(<div>
      <div className="text-3xl font-bold text-slate-300 text-center mb-4">Our Recommended Plan</div>
      <div className="text-2xl font-bold text-slate-300 text-center mb-4">(Push, Pull, Legs)</div>
    <button
     onClick={handleClick}
     className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400">Use Recommended</button>
  </div>)
}

type ExerciseTemplate = {
  description: string;
  weight: number;
  sets: SetTemplate[];
};

type SetTemplate = {
  weight: number;
  reps: number;
  rir: number
}

type WorkoutTemplate = {
  description: string;
  nominalDay: string;
  exercises: ExerciseTemplate[];
}

const emptyWorkoutPlan : WorkoutTemplate[]= [
  {
    description: '',
    nominalDay: 'Sunday',
    exercises: [],
  },
  {
    description: '',
    nominalDay: 'Monday',
    exercises: [],
  },
  {
    description: '',
    nominalDay: 'Tuesday',
    exercises: [],
  },
  {
    description: '',
    nominalDay: 'Wednesday',
    exercises: [],
  },
  {
    description: '',
    nominalDay: 'Thursday',
    exercises: [],
  },
  {
    description: '',
    nominalDay: 'Friday',
    exercises: [],
  },
  {
    description: '',
    nominalDay: 'Saturday',
    exercises: [],
  },
]
const PushFirst = {
  description: "Push #1",
  nominalDay: "Monday",
  exercises: [
    {description: "Atlantis Side Raise", weight: 90, sets: 4},
    {description: "Calf Raise", weight: 220, sets: 4},
    {description: "Machine Press", weight: 185, sets: 3},
    {description: "Incline DB Press", weight: 60, sets: 2},
    {description: "Cable Pushdown", weight: 120, sets: 4},

  ]
}
const PushSecond = {
  description: "Push #2",
  nominalDay: "Thursday",
  exercises: [
    {description: "Machine Press", weight: 185, sets: 3},
    {description: "Incline DB Press", weight: 60, sets: 2},
    {description: "Cable Upright Row", weight: 70, sets: 4},
    {description: "Cable Pushdown", weight: 120, sets: 4},
    {description: "Leg Raise", weight: 0, sets: 4},
  ]
}
const LegFirst = {
  description: "Legs #1",
  nominalDay: "Tuesday",
  exercises: [
    {description: "DB RDL", weight: 100, sets: 2},
    {description: "Belt Squat", weight: 135, sets: 4},
    {description: "Candlesticks", weight: 0, sets: 4},
  ]
}
const LegSecond = {
  description: "Legs #2",
  nominalDay: "Friday",
  exercises: [
    {description: "Belt Squat", weight: 135, sets: 4},
    {description: "Ham Curl", weight: 100, sets: 4},
    {description: "Calf Raise", weight: 220, sets: 4},
  ]
}
const PullFirst = {
  description: "Pull #1",
  nominalDay: "Wednesday",
  exercises: [
    {description: "Calf Raise", weight: 220, sets: 4},
    {description: "Lat Pulldown", weight: 140, sets: 4},
    {description: "Machine Row", weight: 185, sets: 4},
    {description: "Bicep Curl", weight: 40, sets: 4},
  ]
}
const PullSecond = {
  description: "Pull #2",
  nominalDay: "Saturday",
  exercises: [
    {description: "Machine Row", weight: 185, sets: 4},
    {description: "Lat Pulldown", weight: 140, sets: 4},
    {description: "Atlantis Side Raise", weight: 90, sets: 4},
    {description: "Bicep Curl", weight: 40, sets: 4},
    {description: "Candlesticks", weight: 0, sets: 4},
  ]
}
const pplPlanArray = [PushFirst, PushSecond, LegFirst, LegSecond, PullFirst, PullSecond];
const emptySet = {rir: 3, reps: 5, weight: 0}
const PushFirstTwo = {
  description: "Push #1",
  nominalDay: "Monday",
  exercises: [
    {description: "Atlantis Side Raise", weight: 90, sets: Array(3).fill(emptySet)},
    {description: "Calf Raise", weight: 220, sets: Array(3).fill(emptySet)},
    {description: "Machine Press", weight: 185, sets: Array(3).fill(emptySet)},
    {description: "Incline DB Press", weight: 60, sets: Array(3).fill(emptySet)},
    {description: "Cable Pushdown", weight: 120, sets: Array(3).fill(emptySet)},
  ]}
const PushSecondTwo = {
  description: "Push #2", 
  nominalDay: "Thursday",
  exercises: [
    {description: "Machine Press", weight: 185, sets: Array(3).fill(emptySet)},
    {description: "Incline DB Press", weight: 60, sets: Array(3).fill(emptySet)},
    {description: "Cable Upright Row", weight: 70, sets: Array(3).fill(emptySet)},
    {description: "Cable Pushdown", weight: 120, sets: Array(3).fill(emptySet)},
    {description: "Leg Raise", weight: 0, sets: Array(3).fill(emptySet)},
  ]
}
const LegFirstTwo = {
  description: "Legs #1",
  nominalDay: "Tuesday",
  exercises: [
    {description: "DB RDL", weight: 100, sets: Array(3).fill(emptySet)},
    {description: "Belt Squat", weight: 135, sets: Array(3).fill(emptySet)},
    {description: "Candlesticks", weight: 0, sets: Array(3).fill(emptySet)},
  ]}

const LegSecondTwo= {
  description: "Legs #2",
  nominalDay: "Friday",
  exercises: [
    {description: "Belt Squat", weight: 135, sets: Array(3).fill(emptySet)},
    {description: "Ham Curl", weight: 100, sets: Array(3).fill(emptySet)},
    {description: "Calf Raise", weight: 220, sets: Array(3).fill(emptySet)},
  ]}

const PullFirstTwo={
  description: "Pull #1",
  nominalDay: "Wednesday",
  exercises:[
    {description: "Calf Raise", weight: 220, sets: Array(3).fill(emptySet)},
    {description: "Lat Pulldown", weight: 140, sets: Array(3).fill(emptySet)},
    {description: "Machine Row", weight: 185, sets: Array(3).fill(emptySet)},
    {description: "Bicep Curl", weight: 40, sets: Array(3).fill(emptySet)},
  ]
}

const PullSecondTwo = {
  description: "Push #2",
  nominalDay: "Saturday",
  exercises:[
    {description: "Machine Row", weight: 185, sets: Array(3).fill(emptySet)},
    {description: "Lat Pulldown", weight: 140, sets: Array(3).fill(emptySet)},
    {description: "Atlantis Side Raise", weight: 90, sets: Array(3).fill(emptySet)},
    {description: "Bicep Curl", weight: 40, sets: Array(3).fill(emptySet)},
    {description: "Candlesticks", weight: 0, sets: Array(3).fill(emptySet)},
  ]}


const pplPlanArrayTwo= [PushFirstTwo, PushSecondTwo, LegFirstTwo, LegSecondTwo, PullFirstTwo, PullSecondTwo];

function TestButton(){
  const {mutate: makePlan, isLoading} = api.getWorkouts.newTestPlanTwo.useMutation({
    onSuccess(data, variables, context) {
      console.log(data)
      window.location.reload()
    }})

  function handleClick(){
    makePlan( {workouts: pplPlanArrayTwo})
  }
  return(<div>
    <button 
    className="p-5 hover:underline hover:bg-slate-300 rounded-full bg-slate-400"
    onClick={handleClick}>Use Recommended Plan</button>
  </div>)
}


function WorkoutDisplay(){
  const [workoutSchedule, setWorkoutSchedule] = useState<ActualWorkout[]>()
  const {data: workoutPlan, isLoading} = api.getWorkouts.getPlanByUserId.useQuery()

  function sortWorkoutsByNominalDay(workouts: ActualWorkout[]) {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  workouts.sort((a, b) => {
    const dayA = daysOfWeek.indexOf(a.nominalDay);
    const dayB = daysOfWeek.indexOf(b.nominalDay);
    return dayA - dayB;
  });

  return workouts;
}

  if (workoutPlan && workoutPlan[0] && !workoutSchedule && !isLoading){
    const workouts = sortWorkoutsByNominalDay(workoutPlan[0].workouts)
    setWorkoutSchedule(workouts)
    console.log("workouts: ")
    console.log(workouts)
  }
  if (isLoading){
    return(<div>Loading</div>)
  }
  if (!workoutPlan){return(<div>No Workouts</div>)}

  return(<div>
      <div className="text-2xl font-bold text-slate-300 text-center mb-4">Current Workouts: </div>
    {workoutSchedule?.map((workout: ActualWorkout & { exercises?: ActualExercise[] })=>(
      <div key={workout.workoutId}><div>{workout.description}</div>
      <div>{workout.nominalDay}</div>
        <div>
          { workout.exercises && workout.exercises.map((exercise: ActualExercise & {sets?: exerciseSet[]}) => (
             exercise.sets && exercise.sets.length>0 &&
              (<div key={exercise.exerciseId}>
                {exercise.description}: {exercise.sets[0]?.weight} lbs x {exercise.sets.length}
              </div>)
            ))
          }
        </div>
      <br></br>
      </div>
    ))}
  </div>)
}
