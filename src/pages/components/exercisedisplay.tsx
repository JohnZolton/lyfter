import { v4 } from "uuid";
import autoAnimate from "@formkit/auto-animate";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Exercise, exerciseSet, MuscleGroup, Pump, RPE } from "@prisma/client";
import { useState, useRef, useEffect } from "react";
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
}

function ExerciseDisplay({ exercise }: ExerciseDisplayProps) {
  const [description, setDescription] = useState(exercise?.description ?? null);
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
    updateExercise,
    workout,
  } = useWorkoutStore();

  const currentExerciseIndex = useWorkoutStore((state) =>
    state.workout?.workout?.exercises.findIndex(
      (coreExercise) => coreExercise.exerciseId === exercise.exerciseId
    )
  );
  const currentExercise = useWorkoutStore((state) =>
    state.workout?.workout?.exercises.find(
      (coreExercise) => coreExercise.exerciseId === exercise.exerciseId
    )
  );

  const { mutate: recordNewExercise } =
    api.getWorkouts.addNewExercise.useMutation({
      onSuccess(data) {
        addExercise(data);
      },
    });

  const { mutate: deleteExercise } =
    api.getWorkouts.deleteExercise.useMutation();
  function handleRemoveExercise(permanent: boolean) {
    removeExercise(exercise);
    deleteExercise({ exerciseId: exercise.exerciseId, permanent: permanent });
    setIsMenuOpen(false);
  }
  const { mutate: deleteSet } = api.getWorkouts.removeSet.useMutation({});
  const { mutate: recordExerciseSoreness } =
    api.getWorkouts.recordExerciseSoreness.useMutation({});

  const [editingName, setEditingName] = useState(false);

  const { mutate: updateDescription } =
    api.getWorkouts.updateExerciseDescription.useMutation({});
  function handleSaveExercise() {
    setEditingName(false);
    if (description) {
      updateDescription({ exerciseId: exercise.exerciseId, description });
      updateExercise({ ...exercise, description: description });
    }
  }

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
      onSuccess: (updatedExercise) => updateExercise(updatedExercise),
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
  useEffect(() => {
    if (exercise.sets.every((set) => set.reps && set.reps > 0)) {
      setExerciseCompleted(true);
    }
  }, [exercise]);

  const [newExDescription, setNewExDescription] = useState("");
  const [newExMuscleGroup, setNewExMuscleGroup] = useState<MuscleGroup | null>(
    null
  );

  function handleAddExercise() {
    if (newExDescription && newExMuscleGroup) {
      recordNewExercise({
        workoutId: exercise.workoutId,
        exerciseNumber: exercise?.exerciseOrder ?? 0,
        muscleGroup: newExMuscleGroup,
        description: newExDescription,
      });
      setIsMenuOpen(false);
      setNewExDescription("");
      setNewExMuscleGroup(null);
    }
  }
  function handleRemoveSet() {
    const removedSet = exercise.sets[exercise.sets.length - 1];
    if (removedSet?.setId) {
      deleteSet({ setId: removedSet.setId });
      removeSet(exercise.exerciseId);
    }
    setIsMenuOpen(false);
  }
  const { mutate: recordNewSet } = api.getWorkouts.createSet.useMutation();
  function handleAddSet() {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet: exerciseSet & { priorSet?: null } = {
      date: new Date(),
      exerciseId: exercise.exerciseId,
      isActive: true,
      setId: createUniqueId(),
      weight: lastSet?.weight ?? 0,
      targetReps: null,
      targetWeight: lastSet?.targetWeight ?? lastSet?.weight ?? null,
      reps: null,
      rir: lastSet?.rir ?? 3,
      lastSetId: null,
      priorSet: null,
      setNumber: exercise?.sets.length,
    };
    recordNewSet(newSet);
    addSet(newSet);
    setIsMenuOpen(false);
  }

  const [replacementExDescription, setReplacementExDescripion] = useState("");
  const { mutate: saveReplacementEx } =
    api.getWorkouts.replaceExercise.useMutation();
  function handleReplaceExercise(temporary: boolean) {
    setIsMenuOpen(false);
    const newExId = createUniqueId();
    const newSets = exercise.sets.map((curSet, index) => ({
      date: new Date(),
      exerciseId: newExId,
      setId: createUniqueId(),
      weight: 0,
      isActive: true,
      targetReps: 5,
      targetWeight: null,
      reps: null,
      rir: curSet.rir ?? 3,
      lastSetId: null,
      priorSet: null,
      setNumber: index + 1,
    }));
    const newEx = {
      ...exercise,
      description: replacementExDescription,
      temporary: temporary,
      exerciseId: newExId,
      MuscleGroup: exercise.muscleGroup,
      sets: newSets,
    };
    replaceExercise(newEx, exercise);
    saveReplacementEx({
      exerciseId: exercise.exerciseId,
      temporary: temporary,
      title: replacementExDescription,
    });
  }

  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(exercise?.note ? exercise.note : "");
  const { mutate: recordNote } =
    api.getWorkouts.updateExerciseNote.useMutation();
  function handleSaveNote() {
    setEditingNote(false);
    const updatedEx = { ...exercise, note: note };
    updateExercise(updatedEx);
    recordNote({ exerciseId: updatedEx.exerciseId, note: updatedEx.note });
  }
  const { mutate: updateCardio } = api.getWorkouts.updateCardio.useMutation();

  const [parent, enableAnimations] = useAutoAnimate({ duration: 500 });

  const { mutate: updateExOrder } =
    api.getWorkouts.updateExerciseOrder.useMutation();

  function handleMoveDown() {
    const curIndex = workout?.workout.exercises.findIndex(
      (ex) => ex.exerciseId === currentExercise?.exerciseId
    );
    if (
      curIndex !== undefined &&
      workout &&
      curIndex >= 0 &&
      curIndex < workout?.workout.exercises.length - 1
    ) {
      const upperExercise = workout?.workout.exercises[curIndex + 1];
      if (currentExercise && upperExercise) {
        moveExerciseDown(currentExercise);
        updateExOrder({
          exerciseId1: currentExercise.exerciseId,
          exerciseId2: upperExercise.exerciseId,
        });
      }
    }
  }
  function handleMoveUp() {
    const curIndex = workout?.workout.exercises.findIndex(
      (ex) => ex.exerciseId === currentExercise?.exerciseId
    );
    if (curIndex && curIndex > 0) {
      const upperExercise = workout?.workout.exercises[curIndex - 1];
      if (currentExercise && upperExercise) {
        moveExerciseUp(currentExercise);
        updateExOrder({
          exerciseId1: currentExercise.exerciseId,
          exerciseId2: upperExercise.exerciseId,
        });
      }
    }
  }

  return (
    <div
      key={exercise?.description ?? "default-key"}
      className="rounded-xl border border-[#333] bg-[#lalala] p-2 shadow-md"
    >
      <div className="flex flex-row items-center pb-1">
        <div className="flex items-center justify-center">
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <EllipsisVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="flex flex-col gap-y-1 text-lg">
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
                        onChange={(event) =>
                          setReplacementExDescripion(event.target.value)
                        }
                        value={replacementExDescription}
                        className=""
                        type="text"
                        placeholder="Exercise Title"
                      />

                      <DialogClose asChild onBlur={() => setIsMenuOpen(false)}>
                        <div className="flex flex-row items-center gap-x-4">
                          <Button
                            disabled={replacementExDescription.length === 0}
                            onClick={() => handleReplaceExercise(true)}
                          >
                            Just once
                          </Button>
                          <Button
                            type="button"
                            disabled={replacementExDescription.length === 0}
                            onClick={() => handleReplaceExercise(false)}
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
                        onChange={(event) =>
                          setNewExDescription(event.target.value)
                        }
                      ></Input>
                      <Select
                        onValueChange={(value) => {
                          setNewExMuscleGroup(value as MuscleGroup);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent
                          className="max-h-[30vh] overflow-y-auto"
                          position="popper"
                          side="bottom"
                          align="start"
                          sideOffset={5}
                        >
                          <SelectGroup>
                            <SelectLabel>Muscle Group</SelectLabel>
                            <SelectItem value={MuscleGroup.Chest}>
                              Chest
                            </SelectItem>
                            <SelectItem value={MuscleGroup.Triceps}>
                              Triceps
                            </SelectItem>
                            <SelectItem value={MuscleGroup.Back}>
                              Back
                            </SelectItem>
                            <SelectItem value={MuscleGroup.Biceps}>
                              Biceps
                            </SelectItem>
                            <SelectItem value={MuscleGroup.Shoulders}>
                              Shoulders
                            </SelectItem>
                            <SelectItem value={MuscleGroup.Abs}>Abs</SelectItem>
                            <SelectItem value={MuscleGroup.Quads}>
                              Quads
                            </SelectItem>
                            <SelectItem value={MuscleGroup.Glutes}>
                              Glutes
                            </SelectItem>
                            <SelectItem value={MuscleGroup.Hamstrings}>
                              Hamstrings
                            </SelectItem>
                            <SelectItem value={MuscleGroup.Calves}>
                              Calves
                            </SelectItem>
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel>Cardio</SelectLabel>
                            <SelectItem value={MuscleGroup.Cardio}>
                              Cardio
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <DialogClose asChild>
                        <div className="flex flex-row items-center justify-between">
                          <Button
                            disabled={!(newExDescription && newExMuscleGroup)}
                            onClick={() => {
                              setIsMenuOpen(false);
                              handleAddExercise();
                            }}
                          >
                            Add Exercise
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setIsMenuOpen(false)}
                            variant="secondary"
                          >
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
                    <DialogTitle>Delete Exercise</DialogTitle>
                  </DialogHeader>
                  <DialogDescription>
                    <DialogClose asChild>
                      <div className="flex flex-row items-center justify-between">
                        <Button
                          variant={"destructive"}
                          onClick={() => handleRemoveExercise(false)}
                        >
                          Just this time
                        </Button>
                        <Button
                          variant={"destructive"}
                          onClick={() => handleRemoveExercise(true)}
                        >
                          This and future
                        </Button>
                      </div>
                    </DialogClose>
                  </DialogDescription>
                </DialogContent>
              </Dialog>

              <DropdownMenuItem onClick={() => setEditingName(true)}>
                Edit Exercise
              </DropdownMenuItem>
              {currentExerciseIndex !== 0 && (
                <DropdownMenuItem onClick={handleMoveUp}>
                  Move up
                </DropdownMenuItem>
              )}
              {workout &&
                currentExerciseIndex !==
                  workout.workout.exercises.length - 1 && (
                  <DropdownMenuItem onClick={handleMoveDown}>
                    Move down
                  </DropdownMenuItem>
                )}
              <DropdownMenuItem onClick={() => setEditingNote(true)}>
                {exercise?.note ? "Edit Note" : "Add Note"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog
            open={
              exerciseCompleted &&
              !postExerciseSurveyCompleted &&
              feedbackLogged
            }
            onOpenChange={setExerciseCompleted}
          >
            <DialogContent className="w-xs items-center justify-center px-4 md:max-w-md">
              <DialogHeader className="mx-auto text-center">
                <DialogTitle>
                  Exercise Feedback{" "}
                  {exercise?.description && `- ${exercise.description}`}
                </DialogTitle>
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
              value={description ?? ""}
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
              {description ?? ""}
              <span className="text-sm font-light">
                {" "}
                - {exercise?.muscleGroup ?? ""}
              </span>
            </div>
          )}
        </div>
      </div>
      {editingNote ? (
        <Input
          type="text"
          onChange={(e) => setNote(e.target.value)}
          value={note ?? ""}
          onBlur={() => handleSaveNote()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSaveNote();
            }
          }}
        />
      ) : (
        <div className="mb-1 rounded  px-3 text-sm font-light">
          {exercise?.note ?? ""}
        </div>
      )}
      {currentExercise?.muscleGroup !== MuscleGroup.Cardio && (
        <div className="rounded-md bg-[#262626]  py-1">
          <div
            key={`${currentExercise?.exerciseId ?? "error no header"}-header`}
            className="flex flex-row justify-between px-6 text-sm shadow-md"
          >
            <div className="">Weight</div>
            <div>Reps · RIR {exercise?.sets[0]?.rir}</div>
            <div>Target</div>
          </div>
          <div ref={parent}>
            {currentExercise &&
              currentExercise?.sets &&
              currentExercise?.sets
                .sort((a, b) => a.setNumber - b.setNumber)
                .filter((set) => set.isActive)
                .map((set, index) => (
                  <SetDisplay
                    key={`${index}-${currentExercise.exerciseId}`}
                    set={set}
                    index={index}
                    startSurvey={startSurvey}
                    feedbackLogged={feedbackLogged}
                  />
                ))}
          </div>
        </div>
      )}
      {currentExercise?.muscleGroup === MuscleGroup.Cardio && (
        <div className="rounded-md bg-slate-800 py-1">
          <div className="flex flex-row justify-between px-6 text-sm shadow-md">
            <div className="">Duration</div>
            <div>Intensity</div>
            <div>Last Time</div>
          </div>
          <div className="flex flex-row justify-between px-4 py-1 text-sm shadow-md">
            <div>
              <select
                className="rounded bg-gray-700 p-2 px-3 text-center text-sm text-white"
                onChange={(e) => {
                  updateCardio({
                    exerciseId: currentExercise?.exerciseId,
                    RPE: currentExercise.RPE ?? RPE.easy,
                    duration: Number(e.target.value) ?? 0,
                  });
                  updateExercise({
                    ...currentExercise,
                    duration: Number(e.target.value),
                  });
                }}
                value={currentExercise?.duration ?? 0}
              >
                <option value={0}>0</option>
                {Array.from({ length: 300 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="rounded bg-gray-700 p-2 text-center text-sm text-white"
                onChange={(e) => {
                  updateCardio({
                    exerciseId: currentExercise?.exerciseId,
                    RPE: e.target.value as RPE,
                    duration: currentExercise?.duration ?? 0,
                  });
                  updateExercise({
                    ...currentExercise,
                    RPE: e.target.value as RPE,
                  });
                }}
                value={currentExercise?.RPE ?? RPE.easy}
              >
                <option value={RPE.easy}>Easy</option>
                <option value={RPE.medium}>Moderate</option>
                <option value={RPE.hard}>Hard</option>
                <option value={RPE.veryHard}>Very Hard</option>
              </select>
            </div>
            <div className="flex h-8 w-16 items-center justify-center text-lg">
              {currentExercise.targetDuration ?? ""}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExerciseDisplay;
