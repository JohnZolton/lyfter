# [Lyfter](https://lyfter.vercel.app/): Workout Tracker/Coaching App

This is a powerful workout tracking and coaching application, inspired by the match-or-beat algorithm used by Renaissance Periodization for workout progression and planning. It is built using a robust technology stack that emphasizes type safety.

## Tech Stack
This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.
- **Next.js**: Used as the React framework for server-rendered applications.
- **React**: Used for building user interfaces.
- **TypeScript**: Used for writing typed JavaScript at any scale.
- **tRPC**: An end-to-end typesafe API layer.
- **Clerk**: Used for user authentication (analogous to NextAuth).
- **Prisma**: Used as the open-source database ORM.
- **Tailwind**: A utility-first CSS framework.

## The Algorithm
The match-or-beat system compares the current workouts performance to last week's performance. As long as performance is improving, keep going. Performance is measured by weight, reps, or both. The app warns you when performance declines and when its time to take a deload.

## Features

- **Workout Management**: Users can create, plan, edit, and log their workouts with ease.
- **Progress Monitoring**: The app keeps track of users' progress and sends alerts when performance declines.
- **Missed Workouts Handling**: The app handles missed workouts gracefully, ensuring users can get back on track without any hassle.
- **Customization**: Use our premade plan or create your own
- **Target Display**: Displays target weight and reps for each exercise, making it easy for users to understand their goals.
- **Add & Remove**: Users can easily add and remove sets, exercises, and workouts.
- **User Experience**: The app is designed with a clean, easy-to-use interface, ensuring a smooth user experience.
<p align="center">
  <img src="https://github.com/JohnZolton/lyfter/assets/102374100/38664c11-1fe4-4c80-933e-675d7aeb99da"/>
</p>
<p align="center">
  <img src="https://github.com/JohnZolton/lyfter/assets/102374100/281b027f-1da3-421c-bcb3-7b26644cbfe1"/>
</p>



## Emphasis on Type Safety

We emphasize type-safe development practices in this project. TypeScript is used throughout the application to ensure types are checked during compile time. Furthermore, tRPC is employed to maintain end-to-end type safety in our API layer.



