import { SignOutButton, SignedIn, UserButton } from "@clerk/nextjs";

import Link from "next/link";
import { useState } from "react";
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

export const NavBar = () => {
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
              <DropdownMenuItem>
                <Link href={"/makeplan"}>Edit Plan</Link>
              </DropdownMenuItem>
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
