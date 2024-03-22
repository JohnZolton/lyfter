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
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Calf Raise",
      weight: 220,
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Machine Press",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Incline DB Press",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Cable Pushdown",
      sets: Array(3).fill(emptySet),
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
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Incline DB Press",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Cable Upright Row",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Cable Pushdown",
      sets: Array(3).fill(emptySet),
    },
    {
      description: "Leg Raise",
      id: createUniqueId(),
      weight: 0,
      sets: Array(3).fill(emptySet),
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
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Belt Squat",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Candlesticks",
      sets: Array(3).fill(emptySet),
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
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
    {
      description: "Ham Curl",
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
    {
      description: "Calf Raise",
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
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
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
    {
      description: "Lat Pulldown",
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
    {
      description: "Machine Row",
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
    {
      description: "Bicep Curl",
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
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
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
    {
      description: "Lat Pulldown",
      id: createUniqueId(),
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Atlantis Side Raise",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Bicep Curl",
      sets: Array(3).fill(emptySet),
    },
    {
      id: createUniqueId(),
      description: "Candlesticks",
      sets: Array(3).fill(emptySet),
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
