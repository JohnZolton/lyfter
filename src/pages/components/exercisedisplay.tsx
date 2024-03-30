import { v4 } from "uuid";
import { Workout, Exercise, exerciseSet, MuscleGroup } from "@prisma/client";
import { useState } from "react";
import { useEffect } from "react";
import { api } from "~/utils/api";
import SetDisplay from "./setdisplay";
import { Menu, Newspaper, Radio } from "lucide-react";
import { Input } from "../../components/ui/input";

import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "~/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../../components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

function createUniqueId(): string {
  return v4();
}

interface ExerciseDisplayProps {
  exercise: Exercise & {
    sets: (exerciseSet & {
      priorSet?: exerciseSet | null;
    })[];
  };
  workoutNumber: string;
  exerciseNumber: string;
  exerciseIndex: number;
  addExercise: (
    exerciseIndex: number,
    exercise: Exercise & {
      sets: exerciseSet[];
    }
  ) => void;

  updatePlan: (
    exercise: Exercise & {
      sets: (exerciseSet & {
        priorSet?: exerciseSet | null;
      })[];
    },
    workoutId: string,
    exerciseId: string
  ) => void;

  removeExercise: (workoutNumber: string, exerciseNumber: string) => void;
}

function ExerciseDisplay({
  removeExercise,
  exercise,
  workoutNumber,
  exerciseNumber,
  exerciseIndex,
  addExercise,
  updatePlan,
}: ExerciseDisplayProps) {
  const [description, setDescription] = useState(
    exercise?.description ?? "none"
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [feedbackLogged, setFeedbackLogged] = useState(false);
  const [sets, setSets] = useState<
    (exerciseSet & {
      priorSet?: exerciseSet | null;
    })[]
  >(exercise?.sets);

  useEffect(() => {
    setDescription(exercise.description);
    setSets(exercise.sets);
  }, [exercise?.description, exercise?.sets]);

  useEffect(() => {
    if (sets.every((set) => set.reps && set.reps > 0)) {
      setExerciseCompleted(true);
    }
  }, [exercise?.sets]);

  function handleSetChange(
    set: exerciseSet & { priorSet?: exerciseSet | null },
    index: number
  ) {
    const newSets = [...sets];
    newSets[index] = set;
    setSets(newSets);
  }
  function handleSaveButton() {
    const newData: Exercise & {
      sets: (exerciseSet & { priorSet?: exerciseSet | null })[];
    } = {
      ...exercise,
      sets: sets,
      description: description,
    };
    console.log(newData);
    updatePlan(newData, workoutNumber, exerciseNumber);
  }
  const { mutate: recordNewExercise } =
    api.getWorkouts.addNewExercise.useMutation({
      onSuccess(data) {
        addExercise(exerciseIndex, data);
        console.log(data);
      },
    });
  const { mutate: deleteExercise } = api.getWorkouts.deleteExercise.useMutation(
    {
      onSuccess(data) {
        console.log(data);
      },
    }
  );

  const { mutate: updateSet } = api.getWorkouts.updateSets.useMutation({
    onSuccess(data) {
      console.log(data);
    },
  });

  const { mutate: recordNewSet } = api.getWorkouts.createSet.useMutation({
    onSuccess(data) {
      console.log(data);
    },
  });

  function handleAddSet() {
    const lastSet = sets[sets.length - 1];
    const newSet: exerciseSet & { priorSet?: null } = {
      date: new Date(),
      exerciseId: exercise.exerciseId,
      setId: createUniqueId(),
      weight: 0,
      targetReps: null,
      targetWeight: lastSet?.targetWeight ?? lastSet?.weight ?? 0,
      reps: null,
      rir: 3,
      lastSetId: null,
      priorSet: null,
      setNumber: sets.length + 1,
    };
    if (lastSet !== undefined) {
      newSet.rir = lastSet.rir;
      newSet.weight = lastSet.weight;
    }
    const newSets = [...sets, newSet];
    setSets(newSets);
    recordNewSet({ ...newSet });
  }
  function handleRemoveExercise() {
    removeExercise(workoutNumber, exercise.exerciseId);
    deleteExercise({ exerciseId: exercise.exerciseId });
  }
  const { mutate: deleteSet } = api.getWorkouts.removeSet.useMutation({
    onSuccess(data) {
      console.log(data);
    },
  });
  const { mutate: recordExerciseSoreness } =
    api.getWorkouts.recordExerciseSoreness.useMutation({
      onSuccess(data) {
        console.log(data);
      },
    });
  function handleRemoveSet() {
    deleteSet({ setId: sets[sets.length - 1]?.setId ?? "" });
    const newSets = sets.slice(0, -1);
    setSets(newSets);
    setIsMenuOpen(false);
  }

  function cascadeWeightChange(index: number, weight: number) {
    const newSets = [...sets];
    if (index < newSets.length && index >= 0 && newSets[index]) {
      newSets[index]!.weight = weight;
      //for every set after current set, update the weight IF there is no weight already
      for (let i = index + 1; i < newSets.length; i++) {
        if (
          newSets[i]!.reps === 0 ||
          newSets[i]!.reps === undefined ||
          newSets[i]!.reps === null
        ) {
          newSets[i]!.weight = weight;
        }
      }
    }
    console.log(newSets);
    setSets(newSets);
  }

  const [editingName, setEditingName] = useState(false);
  function handleEditExercise() {
    setEditingName(true);
  }
  const { mutate: updateDescription } =
    api.getWorkouts.updateExerciseDescription.useMutation({
      onSuccess(data) {
        console.log(data);
      },
    });
  function handleSaveExercise() {
    setEditingName(false);
    updateDescription({ exerciseId: exercise.exerciseId, description });
  }

  useEffect(() => {
    handleSaveButton();

    const currentSetIdx = sets.findIndex((set) => !set.reps);
    if (currentSetIdx !== -1) {
      setActiveSet(currentSetIdx);
    } else {
      setActiveSet(sets.length);
    }
  }, [sets]);

  const [soreness, setSoreness] = useState("");
  const [pump, setPump] = useState("");
  const [rpe, setRPE] = useState("");
  function savePreFeedback() {
    setFeedbackLogged(true);
    recordExerciseSoreness({ exerciseId: exercise.exerciseId });
    if (soreness === "a while ago") {
      handleAddSet();
    }
    if (soreness === "still sore") {
      handleRemoveSet();
    }
  }
  function startSurvey() {
    if (!exerciseStarted) {
      setExerciseStarted(true);
    }
  }

  const { mutate: recordExerciseFeedback } =
    api.getWorkouts.recordExerciseFeedback.useMutation({
      onSuccess(data) {
        console.log(data);
      },
    });

  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [postExerciseSurveyCompleted, setPostExerciseSurveyCompleted] =
    useState<boolean>(exercise?.feedbackRecorded ?? false);
  function savePostFeedback() {
    setPostExerciseSurveyCompleted(true);
    recordExerciseFeedback({
      exerciseId: exercise.exerciseId,
      pump: pump,
      RPE: rpe,
    });
  }

  const [newExercise, setNewExercise] = useState<Exercise>({
    exerciseId: "fake",
    date: new Date(),
    description: "",
    exerciseOrder: 0,
    muscleGroup: MuscleGroup.Chest,
    workoutId: "",
    feedbackRecorded: false,
    pump: null,
    RPE: null,
  });

  useEffect(() => {
    setNewExercise((prevExercise) => ({
      ...prevExercise,
      exerciseOrder: exercise.exerciseOrder,
      workoutId: exercise.workoutId,
    }));
  }, [exercise]);
  const [newExUpdated, setNewExUpdated] = useState(false);
  const [newExReady, setNewExReady] = useState(false);
  function isNewExReady(exercise: Exercise) {
    if (!exercise.description || exercise.description.trim() === "") {
      return false;
    }
    if (!newExUpdated) {
      return false;
    }
    return true;
  }

  const [activeSet, setActiveSet] = useState(0);

  useEffect(() => {
    if (isNewExReady(newExercise)) {
      setNewExReady(true);
    }
  }, [newExercise]);

  function handleAddExercise() {
    if (newExercise && newExercise.description && newExUpdated) {
      recordNewExercise({
        workoutId: exercise.workoutId,
        exerciseNumber: exercise.exerciseOrder,
        muscleGroup: newExercise.muscleGroup,
        description: newExercise.description,
      });
      setIsMenuOpen(false);
    }
  }

  if (!exercise) {
    return <div></div>;
  }
  return (
    <div
      key={exercise.description}
      className="mx-1 my-1 w-full rounded-xl bg-slate-700  p-2 shadow-md"
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-row items-end justify-center">
          {editingName ? (
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveExercise}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveExercise();
                }
              }}
            />
          ) : (
            description
          )}
          <div className="ml-1 text-sm"> - {exercise.muscleGroup}</div>
        </div>
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Menu />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleAddSet()}>
              Add Set
            </DropdownMenuItem>

            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Remove Set
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  <DialogClose asChild onBlur={() => setIsMenuOpen(false)}>
                    <div className="flex flex-row items-center justify-between">
                      <Button
                        variant={"destructive"}
                        onClick={() => handleRemoveSet()}
                      >
                        Remove Set
                      </Button>
                      <Button type="button" variant="secondary">
                        Cancel
                      </Button>
                    </div>
                  </DialogClose>
                </DialogDescription>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Add Exercise
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Exercise</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  <Input
                    placeholder="Description"
                    onChange={(value) =>
                      setNewExercise((prevExercise) => ({
                        ...prevExercise,
                        description: value.target.value,
                      }))
                    }
                  ></Input>
                  <Select
                    onValueChange={(value) => {
                      setNewExercise((prevExercise) => ({
                        ...prevExercise,
                        muscleGroup:
                          MuscleGroup[value as keyof typeof MuscleGroup],
                      }));
                      setNewExUpdated(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Muscle Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Muscle Group</SelectLabel>
                        <SelectItem value="Chest">Chest</SelectItem>
                        <SelectItem value="Triceps">Triceps</SelectItem>
                        <SelectItem value="Back">Back</SelectItem>
                        <SelectItem value="Biceps">Biceps</SelectItem>
                        <SelectItem value="Shoulders">Shoulders</SelectItem>
                        <SelectItem value="Abs">Abs</SelectItem>
                        <SelectItem value="Quads">Quads</SelectItem>
                        <SelectItem value="Glutes">Glutes</SelectItem>
                        <SelectItem value="Hamstrings">Hamstrings</SelectItem>
                        <SelectItem value="Calves">Calves</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <DialogClose asChild onBlur={() => setIsMenuOpen(false)}>
                    <div className="flex flex-row items-center justify-between">
                      <Button
                        disabled={!newExReady}
                        onClick={() => handleAddExercise()}
                      >
                        Add Exercise
                      </Button>
                      <Button type="button" variant="secondary">
                        Cancel
                      </Button>
                    </div>
                  </DialogClose>
                </DialogDescription>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Remove Exercise
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  <DialogClose asChild onBlur={() => setIsMenuOpen(false)}>
                    <div className="flex flex-row items-center justify-between">
                      <Button
                        variant={"destructive"}
                        onClick={() => handleRemoveExercise()}
                      >
                        Remove Exercise
                      </Button>
                      <Button type="button" variant="secondary">
                        Cancel
                      </Button>
                    </div>
                  </DialogClose>
                </DialogDescription>
              </DialogContent>
            </Dialog>

            <DropdownMenuItem onClick={() => handleEditExercise()}>
              Edit Exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog
          open={exerciseCompleted && !postExerciseSurveyCompleted}
          onOpenChange={setExerciseCompleted}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exercise Feedback</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              <div className="flex flex-col items-center gap-y-3">
                <div className="font text-center text-lg font-semibold">
                  How&apos;s your pump?
                </div>
                <ToggleGroup
                  value={pump}
                  type="single"
                  size={"lg"}
                  onValueChange={setPump}
                >
                  <ToggleGroupItem value="low">What pump?</ToggleGroupItem>
                  <ToggleGroupItem value="medium">Pretty good</ToggleGroupItem>
                  <ToggleGroupItem value="high">Insane</ToggleGroupItem>
                </ToggleGroup>
                <div className="text-center text-lg font-semibold">
                  How hard was that?
                </div>
                <ToggleGroup
                  type="single"
                  value={rpe}
                  size={"lg"}
                  onValueChange={setRPE}
                >
                  <ToggleGroupItem value="easy">Easy</ToggleGroupItem>
                  <ToggleGroupItem value="medium">Pretty solid</ToggleGroupItem>
                  <ToggleGroupItem value="hard">
                    Pushed my limits
                  </ToggleGroupItem>
                </ToggleGroup>
                <div className="flex items-center justify-center">
                  <Button
                    onClick={() => savePostFeedback()}
                    disabled={!pump || !rpe}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogContent>
        </Dialog>
        <Dialog
          open={
            exerciseStarted && !feedbackLogged && !postExerciseSurveyCompleted
          }
          onOpenChange={setExerciseStarted}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exercise Feedback</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              <div className="flex flex-col gap-y-3">
                <div className="text-center">
                  How sore were you from last time?
                </div>
                <ToggleGroup
                  type="single"
                  size={"lg"}
                  onValueChange={setSoreness}
                >
                  <ToggleGroupItem value="a while ago">
                    <div className="">Healed a while ago</div>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="on time">
                    <div className="">Healed just in time</div>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="still sore">
                    <div className="">Still sore</div>
                  </ToggleGroupItem>
                </ToggleGroup>
                <div className="flex items-center justify-center">
                  <Button
                    onClick={() => savePreFeedback()}
                    disabled={!soreness}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogContent>
        </Dialog>
      </div>
      <div>
        {sets &&
          sets
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((set, index) => (
              <SetDisplay
                key={index}
                set={set}
                activeSet={activeSet}
                index={index}
                removeSet={handleRemoveSet}
                updateSets={handleSetChange}
                cascadeWeightChange={cascadeWeightChange}
                startSurvey={startSurvey}
                feedbackLogged={feedbackLogged}
              />
            ))}
      </div>
    </div>
  );
}

export default ExerciseDisplay;
