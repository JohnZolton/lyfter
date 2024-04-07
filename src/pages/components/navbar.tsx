import { SignOutButton, SignedIn, UserButton } from "@clerk/nextjs";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Newspaper } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
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
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { useRouter } from "next/router";
import { Workout } from "@prisma/client";

import { api } from "~/utils/api";

interface NavBarProps {
  workout?: Workout;
}

export const NavBar = ({ workout }: NavBarProps) => {
  const router = useRouter();
  const [newDay, setNewDay] = useState(workout?.nominalDay);
  const [newTitle, setNewTitle] = useState(workout?.description);

  const { mutate: updateWorkout } =
    api.getWorkouts.updateWorkoutDescription.useMutation();

  useEffect(() => {
    console.log(newDay);
    console.log(newTitle);
    console.log(workout);
  }, [newDay, newTitle]);

  function handleFormSubmit() {
    console.log("form submit");
    console.log(workout?.workoutId);
    if (newDay && newTitle && workout) {
      updateWorkout({
        nominalDay: newDay,
        description: newTitle,
        workoutId: workout?.workoutId,
      });
    }
  }

  return (
    <div>
      <nav className="flex items-center justify-end">
        <div className="hidden flex-col items-end space-x-6 pr-4 sm:flex sm:flex-row">
          <NavMenuItems />
        </div>
        <div
          className={`flex flex-col items-end space-x-6 pr-4 sm:hidden sm:flex-row`}
        >
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Menu />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Link href={"/home"} prefetch>
                  Home
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href={"/newplan"}>New Plan</Link>
              </DropdownMenuItem>
              {/* IF on /workout/[id] i want to display this option */}
              {router.pathname.startsWith("/workout/") && (
                <Dialog>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Edit Workout
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Workout Info</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                      <div className="mb-3 flex flex-row items-center justify-between gap-x-2">
                        <Input
                          value={newTitle}
                          onChange={(event) => setNewTitle(event.target.value)}
                          className=""
                          type="text"
                          placeholder="Workout Title"
                        />
                        <Select
                          required
                          value={newDay}
                          onValueChange={(value) => {
                            setNewDay(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={workout?.nominalDay} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Day</SelectLabel>
                              <SelectItem value="Monday">Monday</SelectItem>
                              <SelectItem value="Tuesday">Tuesday</SelectItem>
                              <SelectItem value="Wednesday">
                                Wednesday
                              </SelectItem>
                              <SelectItem value="Thursday">Thursday</SelectItem>
                              <SelectItem value="Friday">Friday</SelectItem>
                              <SelectItem value="Saturday">Saturday</SelectItem>
                              <SelectItem value="Sunday">Sunday</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogClose asChild onBlur={() => console.log("close")}>
                        <div className="flex flex-row items-center justify-between">
                          <Button
                            //variant={""}
                            onClick={() => handleFormSubmit()}
                          >
                            Save
                          </Button>
                          <Button type="button" variant="secondary">
                            Cancel
                          </Button>
                        </div>
                      </DialogClose>
                    </DialogDescription>
                  </DialogContent>
                </Dialog>
              )}
              <DropdownMenuItem>
                <Link href={"/allworkouts"}>All Workouts</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SignedIn>
                  <SignOutButton></SignOutButton>
                </SignedIn>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </div>
  );
};

export default NavBar;

function NavMenuItems() {
  return (
    <ul
      className={`flex flex-col items-end space-y-1 text-base sm:flex-row sm:gap-x-3`}
    >
      <li>
        <Link
          href="/home"
          prefetch
          className="hover:text-white hover:underline"
        >
          <Button variant={"ghost"}>Home</Button>
        </Link>
      </li>
      <li>
        <Link href="/newplan" className=" hover:text-white hover:underline">
          <Button variant={"ghost"}>New Plan</Button>
        </Link>
      </li>
      <li>
        <Link href="/allworkouts" className=" hover:text-white hover:underline">
          <Button variant={"ghost"}>History</Button>
        </Link>
      </li>
      <li></li>
    </ul>
  );
}
