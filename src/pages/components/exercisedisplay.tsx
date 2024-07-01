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
import useWorkoutStore from "~/lib/store";

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
}

function ExerciseDisplay({
  exercise,
  workoutNumber,
  exerciseNumber,
  exerciseIndex,
}: ExerciseDisplayProps) {
  const [description, setDescription] = useState(
    exercise?.description ?? "none"
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [feedbackLogged, setFeedbackLogged] = useState(false);

  const {
    addExercise,
    addSet,
    removeExercise,
    replaceExercise,
    removeSet,
    moveExerciseDown,
    moveExerciseUp,
    updateWorkout,
    updateExercise,
    workout,
  } = useWorkoutStore();

  const currentExercise = useWorkoutStore((state) =>
    state.workout?.workout?.exercises.find(
      (coreExercise) => coreExercise.exerciseId === exercise.exerciseId
    )
  );

  function handleSaveButton() {
    console.log("todo");
  }
  const { mutate: recordNewExercise } =
    api.getWorkouts.addNewExercise.useMutation({
      onSuccess(data) {
        addExercise(data);
      },
    });

  function handleRemoveExercise() {
    removeExercise(exercise);
  }
  const { mutate: deleteSet } = api.getWorkouts.removeSet.useMutation({});
  const { mutate: recordExerciseSoreness } =
    api.getWorkouts.recordExerciseSoreness.useMutation({});

  const { mutate: recordSet } = api.getWorkouts.updateSets.useMutation();

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

  const [soreness, setSoreness] = useState("");
  const [pump, setPump] = useState("");
  const [rpe, setRPE] = useState("");
  function savePreFeedback() {
    setFeedbackLogged(true);
    recordExerciseSoreness({ exerciseId: exercise.exerciseId });
    if (soreness === "a while ago") {
      addSet(exercise.exerciseId);
    }
    if (soreness === "still sore") {
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

  return (
    <div
      key={exercise.description}
      className="rounded-xl bg-slate-700  p-2 shadow-md"
    >
      <div className="flex flex-row items-center pb-1">
        <div className="flex items-center justify-center px-1">
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <EllipsisVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="flex flex-col gap-y-1 text-lg">
              <DropdownMenuItem onClick={() => addSet(exercise.exerciseId)}>
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
                          onClick={() => removeSet(exercise.exerciseId)}
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
                        onChange={(event) => console.log(event.target.value)}
                        className=""
                        type="text"
                        placeholder="Exercise Title"
                      />

                      <DialogClose asChild onBlur={() => setIsMenuOpen(false)}>
                        <div className="flex flex-row items-center gap-x-4">
                          <Button onClick={() => console.log("todo")}>
                            Just once
                          </Button>
                          <Button
                            type="button"
                            onClick={() => console.log("todo")}
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
                <DropdownMenuItem onClick={() => moveExerciseUp(exercise)}>
                  Move up
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => moveExerciseDown(exercise)}>
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
            <div>
              {description}
              <span className="text-sm font-light">
                {" "}
                - {exercise.muscleGroup}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="rounded-md bg-slate-800 py-1">
        <div className="flex flex-row justify-between px-6 text-sm">
          <div className="">Weight</div>
          <div>Reps · RIR {exercise.sets[0]?.rir}</div>
          <div>Target</div>
        </div>
        {currentExercise &&
          currentExercise.sets &&
          currentExercise?.sets
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((set, index) => (
              <SetDisplay
                key={index}
                set={set}
                index={index}
                startSurvey={startSurvey}
                feedbackLogged={feedbackLogged}
              />
            ))}
      </div>
    </div>
  );
}

export default ExerciseDisplay;
