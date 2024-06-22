import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, UsersIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import SignedIn, { SignOutButton, SignedOut } from "./auth";
import { api } from "~/utils/api";
import NDK, {
  NDKSubscriptionCacheUsage,
  NDKSubscriptionOptions,
  NDKUser,
} from "@nostr-dev-kit/ndk";

interface NavBarProps {
  workout?: Workout;
  updateTitleDay?: (description: string, newDay: string) => void;
}

export const NavBar = ({ workout, updateTitleDay }: NavBarProps) => {
  const router = useRouter();
  const [newDay, setNewDay] = useState(workout?.nominalDay);
  const [newTitle, setNewTitle] = useState(workout?.description);

  const { mutate: updateWorkout } =
    api.getWorkouts.updateWorkoutDescription.useMutation();

  function handleFormSubmit() {
    if (newDay && newTitle && workout) {
      const updated = updateWorkout({
        nominalDay: newDay,
        description: newTitle,
        workoutId: workout?.workoutId,
      });
      if (updateTitleDay) {
        updateTitleDay(newTitle, newDay);
      }
    }
    setIsMenuOpen(false);
  }

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div>
      <nav className="flex items-center justify-end">
        <div className="hidden flex-col items-end space-x-6 sm:flex sm:flex-row">
          <NavMenuItems />
        </div>
        <div
          className={`flex flex-col items-end space-x-6 sm:hidden sm:flex-row`}
        >
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger>
              <Avatar />
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
              {router.pathname.startsWith("/workout/") && (
                <Dialog>
                  <DialogTrigger asChild>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={(e) => e.preventDefault()}
                    >
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
                          onValueChange={(value) => {
                            setNewDay(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={"Select Day"} />
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
                      <DialogClose asChild onBlur={() => setIsMenuOpen(false)}>
                        <div className="flex flex-row items-center justify-between">
                          <Button
                            disabled={!(newTitle && newDay)}
                            //variant={""}
                            onClick={() => handleFormSubmit()}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </DialogClose>
                    </DialogDescription>
                  </DialogContent>
                </Dialog>
              )}
              <SignedIn>
                <DropdownMenuItem>
                  <Link href={"/allworkouts"}>All Workouts</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SignOutButton />
                </DropdownMenuItem>
              </SignedIn>
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
      <li>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <SignOutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    </ul>
  );
}

function Avatar() {
  const [url, setUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [retry, setRetry] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userNpub = sessionStorage.getItem("userNpub");
      const imgUrl = sessionStorage.getItem("profileImage");
      const displayName = sessionStorage.getItem("displayName");
      setUrl(imgUrl ?? "");
      setDisplayName(displayName ?? "");
      void getProfile(userNpub);
    }
  }, []);

  useEffect(() => {
    const userNpub = sessionStorage.getItem("userNpub");
    if ((!url || !displayName) && userNpub) {
      const timeout = setTimeout(() => {
        void getProfile(userNpub);
        setRetry((prev) => !prev);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [url, displayName, retry]);

  async function getProfile(npub: string | null) {
    const ndk = new NDK({
      explicitRelayUrls: [
        "wss://nos.lol",
        "wss://relay.nostr.band",
        "wss://relay.damus.io",
        "wss://relay.plebstr.com",
      ],
    });
    await ndk.connect();
    if (npub) {
      const user = ndk.getUser({ pubkey: npub });
      console.log(user);
      await user.fetchProfile();
      console.log(user.profile);
      sessionStorage.setItem("profileImage", user.profile?.image ?? "");
      sessionStorage.setItem("displayName", user.profile?.displayName ?? "");
    }
  }

  if (url) {
    return (
      <div className="flex items-center justify-center">
        <img src={url} className="h-14 w-14 rounded-full object-cover" />
      </div>
    );
  }
  return null;
}
