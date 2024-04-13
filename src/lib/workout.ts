import { v4 } from "uuid";

function createUniqueId(): string {
  return v4();
}

const emptySet = { rir: 3, weight: 0, reps: 0 };
const PushFirstTwo = {
  description: "Push #1",
  nominalDay: "Monday",
  workoutId: createUniqueId(),
  exercises: [
    {
      id: createUniqueId(),
      description: "Atlantis Side Raise",
      muscleGroup: "Shoulders",
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Calf Raise",
      muscleGroup: "Calves",
      weight: 220,
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Machine Press",
      muscleGroup: "Chest",
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Incline DB Press",
      muscleGroup: "Chest",
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Cable Pushdown",
      muscleGroup: "Triceps",
      sets: 3,
    },
  ],
};
const PushSecondTwo = {
  description: "Push #2",
  workoutId: createUniqueId(),
  nominalDay: "Thursday",
  exercises: [
    {
      id: createUniqueId(),
      description: "Machine Press",
      muscleGroup: "Chest",
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Incline DB Press",
      muscleGroup: "Chest",
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Cable Upright Row",
      muscleGroup: "Triceps",
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Cable Pushdown",
      muscleGroup: "Triceps",
      sets: 3,
    },
    {
      description: "Leg Raise",
      muscleGroup: "Abs",
      id: createUniqueId(),
      weight: 0,
      sets: 3,
    },
  ],
};
const LegFirstTwo = {
  description: "Legs #1",
  workoutId: createUniqueId(),
  nominalDay: "Tuesday",
  exercises: [
    {
      id: createUniqueId(),
      description: "DB RDL",
      muscleGroup: "Hamstrings",
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Belt Squat",
      muscleGroup: "Quads",
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Candlesticks",
      muscleGroup: "Abs",
      sets: 3,
    },
  ],
};

const LegSecondTwo = {
  description: "Legs #2",
  nominalDay: "Friday",
  workoutId: createUniqueId(),
  exercises: [
    {
      description: "Belt Squat",
      muscleGroup: "Quads",
      id: createUniqueId(),
      sets: 3,
    },
    {
      description: "Ham Curl",
      muscleGroup: "Hamstrings",
      id: createUniqueId(),
      sets: 3,
    },
    {
      description: "Calf Raise",
      muscleGroup: "Calves",
      id: createUniqueId(),
      sets: 3,
    },
  ],
};

const PullFirstTwo = {
  description: "Pull #1",
  nominalDay: "Wednesday",
  workoutId: createUniqueId(),
  exercises: [
    {
      description: "Calf Raise",
      muscleGroup: "Calves",
      id: createUniqueId(),
      sets: 3,
    },
    {
      description: "Lat Pulldown",
      muscleGroup: "Back",
      id: createUniqueId(),
      sets: 3,
    },
    {
      description: "Machine Row",
      muscleGroup: "Back",
      id: createUniqueId(),
      sets: 3,
    },
    {
      description: "Bicep Curl",
      muscleGroup: "Biceps",
      id: createUniqueId(),
      sets: 3,
    },
  ],
};

const PullSecondTwo = {
  description: "Pull #2",
  nominalDay: "Saturday",
  workoutId: createUniqueId(),
  exercises: [
    {
      description: "Machine Row",
      muscleGroup: "Back",
      id: createUniqueId(),
      sets: 3,
    },
    {
      description: "Lat Pulldown",
      muscleGroup: "Back",
      id: createUniqueId(),
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Atlantis Side Raise",
      muscleGroup: "Shoulders",
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Bicep Curl",
      muscleGroup: "Biceps",
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Candlesticks",
      muscleGroup: "Abs",
      sets: 3,
    },
  ],
};

export const pplPlanArrayTwo = [
  PushFirstTwo,
  PushSecondTwo,
  LegFirstTwo,
  LegSecondTwo,
  PullFirstTwo,
  PullSecondTwo,
];

const maintenanceOne = {
  description: "Maintenance #1",
  nominalDay: "Monday",
  workoutId: createUniqueId(),
  exercises: [
    {
      id: createUniqueId(),
      description: "Atlantis Side Raise",
      muscleGroup: "Shoulders",
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Machine Press",
      muscleGroup: "Chest",
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Machine Row",
      muscleGroup: "Back",
      sets: 3,
    },
    {
      description: "Hack Squat",
      muscleGroup: "Quads",
      id: createUniqueId(),
      sets: 3,
    },
  ],
};
const maintenanceTwo = {
  description: "Maintenance #2",
  workoutId: createUniqueId(),
  nominalDay: "Thursday",
  exercises: [
    {
      id: createUniqueId(),
      description: "DB RDL",
      muscleGroup: "Hamstrings",
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Machine Press",
      muscleGroup: "Chest",
      sets: 3,
    },
    {
      id: createUniqueId(),
      description: "Assisted Pullup",
      muscleGroup: "Back",
      sets: 3,
    },
    {
      description: "Bicep Curl",
      muscleGroup: "Biceps",
      id: createUniqueId(),
      sets: 3,
    },
  ],
};

export const maintenance = [maintenanceOne, maintenanceTwo];
