import { v4 } from "uuid";
import { Exercise, exerciseSet, MuscleGroup, Pump, RPE } from "@prisma/client";
import { useState } from "react";
import { useEffect } from "react";
import { api } from "~/utils/api";
import SetDisplay from "./setdisplay";
import { Menu, EllipsisVertical } from "lucide-react";
import { Input } from "../../components/ui/input";

import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
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
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
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
  moveUp: (exIndex: number, exId: string) => void;
  moveDown: (exIndex: number, exId: string) => void;
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
  moveUp,
  moveDown,
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
    updatePlan(newData, workoutNumber, exerciseNumber);
  }
  const { mutate: recordNewExercise } =
    api.getWorkouts.addNewExercise.useMutation({
      onSuccess(data) {
        addExercise(exerciseIndex, data);
      },
    });
  const { mutate: deleteExercise } =
    api.getWorkouts.deleteExercise.useMutation();

  const { mutate: recordNewSet } = api.getWorkouts.createSet.useMutation();

  function handleAddSet() {
    const lastSet = sets[sets.length - 1];
    const newSet: exerciseSet & { priorSet?: null } = {
      date: new Date(),
      exerciseId: exercise.exerciseId,
      setId: createUniqueId(),
      weight: 0,
      targetReps: null,
      targetWeight: lastSet?.targetWeight ?? lastSet?.weight ?? null,
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
  const { mutate: deleteSet } = api.getWorkouts.removeSet.useMutation({});
  const { mutate: recordExerciseSoreness } =
    api.getWorkouts.recordExerciseSoreness.useMutation({});
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
      //for every set after current set, update the weight IF set not complete
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
    setSets(newSets);
  }

  const [editingName, setEditingName] = useState(false);
  function handleEditExercise() {
    setEditingName(true);
  }
  const { mutate: updateDescription } =
    api.getWorkouts.updateExerciseDescription.useMutation({});
  function handleSaveExercise() {
    setEditingName(false);
    updateDescription({ exerciseId: exercise.exerciseId, description });
  }

  useEffect(() => {
    handleSaveButton();

    if (sets[activeSet]?.reps) {
      setActiveSet(activeSet + 1);
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
    api.getWorkouts.recordExerciseFeedback.useMutation({});

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
    priorExerciseId: null,
    exerciseOrder: 0,
    muscleGroup: MuscleGroup.Chest,
    temporary: false,
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

  const activeSetNumber = exercise?.sets?.filter(
    (set) =>
      set && set.reps !== undefined && set.reps !== 0 && set.reps !== null
  ).length;
  const [activeSet, setActiveSet] = useState(activeSetNumber || 0);

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

  function handleMissedTarget(index: number) {
    const newSets = sets.slice(0, index + 1);
    setSets(newSets);
  }

  const [newExDescription, setNewExDescription] = useState("");
  const { mutate: replaceExercise } =
    api.getWorkouts.replaceExercise.useMutation({
      onSuccess: (replacementExercise) => {
        if (replacementExercise) {
          console.log(replacementExercise);
          removeExercise(exercise.workoutId, exercise.exerciseId);
          addExercise(replacementExercise.exerciseOrder, replacementExercise);
        }
      },
    });
  function handleReplaceExercise(title: string, temporary: boolean) {
    if (title) {
      replaceExercise({
        exerciseId: exercise.exerciseId,
        title: title,
        temporary: temporary,
      });
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
      <div className="flex flex-row items-center pb-1">
        <div className="flex items-center justify-center px-1">
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <EllipsisVertical />
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
                    Replace Exercise
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Replace Exercise</DialogTitle>
                  </DialogHeader>
                  <DialogDescription>
                    <div className="flex flex-col items-center gap-y-4">
                      <Input
                        value={newExDescription}
                        onChange={(event) =>
                          setNewExDescription(event.target.value)
                        }
                        className=""
                        type="text"
                        placeholder="Exercise Title"
                      />

                      <DialogClose asChild onBlur={() => setIsMenuOpen(false)}>
                        <div className="flex flex-row items-center gap-x-4">
                          <Button
                            onClick={() =>
                              handleReplaceExercise(newExDescription, true)
                            }
                          >
                            Just once
                          </Button>
                          <Button
                            type="button"
                            onClick={() =>
                              handleReplaceExercise(newExDescription, false)
                            }
                          >
                            Permanently
                          </Button>
                        </div>
                      </DialogClose>
                    </div>
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
                    <div className="flex flex-col gap-y-4">
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
                            <SelectItem value="Hamstrings">
                              Hamstrings
                            </SelectItem>
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
                    </div>
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
              {exercise.exerciseOrder !== 0 && (
                <DropdownMenuItem
                  onClick={() =>
                    moveUp(exercise.exerciseOrder, exercise.exerciseId)
                  }
                >
                  Move up
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() =>
                  moveDown(exercise.exerciseOrder, exercise.exerciseId)
                }
              >
                Move down
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog
            open={exerciseCompleted && !postExerciseSurveyCompleted}
            onOpenChange={setExerciseCompleted}
          >
            <DialogContent className="w-xs items-center justify-center px-4 md:max-w-md">
              <DialogHeader className="mx-auto text-center">
                <DialogTitle>Exercise Feedback</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                <div className="flex flex-col items-center gap-y-3">
                  <div className="font text-center text-lg font-semibold">
                    How&apos;s your pump?
                  </div>
                  <ToggleGroup
                    className=""
                    value={pump}
                    type="single"
                    size={"sm"}
                    onValueChange={setPump}
                  >
                    <ToggleGroupItem value={Pump.low}>
                      What pump?
                    </ToggleGroupItem>
                    <ToggleGroupItem value={Pump.medium}>
                      Moderate
                    </ToggleGroupItem>
                    <ToggleGroupItem value={Pump.high}>Solid</ToggleGroupItem>
                    <ToggleGroupItem value={Pump.veryHigh}>
                      Insane
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <div className="text-center text-lg font-semibold">
                    How hard was that?
                  </div>
                  <ToggleGroup
                    type="single"
                    value={rpe}
                    size={"sm"}
                    onValueChange={setRPE}
                  >
                    <ToggleGroupItem value={RPE.easy}>Easy</ToggleGroupItem>
                    <ToggleGroupItem value={RPE.medium}>
                      Moderate
                    </ToggleGroupItem>
                    <ToggleGroupItem value={RPE.hard}>
                      Challenging
                    </ToggleGroupItem>
                    <ToggleGroupItem value={RPE.veryHard}>
                      <div className="flex flex-col text-xs">
                        <span>Pushed</span>
                        <span>my limits</span>
                      </div>
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
                    size={"default"}
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
        <div className="flex flex-row items-end justify-between font-semibold">
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
            <div>{description} - </div>
          )}
          <div className="justify-end px-1 text-sm font-light">
            {exercise.muscleGroup}
          </div>
        </div>
      </div>
      <div className="rounded-md bg-slate-800 py-1">
        <div className="flex flex-row justify-between px-6 text-sm">
          <div className="">Weight</div>
          <div>Reps · RIR {exercise.sets[0]?.rir}</div>
          <div>Target</div>
        </div>
        {sets &&
          sets
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((set, index) => (
              <SetDisplay
                key={index}
                set={set}
                handleMissedTarget={handleMissedTarget}
                activeSet={activeSet}
                index={index}
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
