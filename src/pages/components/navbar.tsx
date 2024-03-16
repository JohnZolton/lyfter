import { SignOutButton, SignedIn, UserButton } from "@clerk/nextjs";

import Link from "next/link";
import { useState } from "react";
import { Menu, Newspaper } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  function handleMenuToggle() {
    setIsMenuOpen((prevState) => !prevState);
  }
  return (
    <div>
      <nav className="flex items-center justify-end">
        <div className={`flex flex-col items-end space-x-6 pr-4 sm:flex-row`}>
        <DropdownMenu>
          <DropdownMenuTrigger><Menu/></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem ><Link href={"/home"}>Home</Link></DropdownMenuItem>
            <DropdownMenuItem ><Link href={"/newplan"}>New Plan</Link></DropdownMenuItem>
            <DropdownMenuItem ><Link href={"/makeplan"}>Edit Plan</Link></DropdownMenuItem>
            <DropdownMenuItem ><Link href={"/allworkouts"}>All Workouts</Link></DropdownMenuItem>
            <DropdownMenuItem >
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
      className={`flex flex-col items-end space-y-1 sm:flex-row sm:gap-x-3`}
    >
      <li>
        <Link
          href="home"
          className="text-slate-300 hover:text-white hover:underline"
        >
          Home
        </Link>
      </li>
      <li>
        <Link
          href="newplan"
          className="text-gray-300 hover:text-white hover:underline"
        >
          New Plan
        </Link>
      </li>
      <li>
        <Link
          href="makeplan"
          className="text-slate-300 hover:text-white hover:underline"
        >
          Edit Plan
        </Link>
      </li>
      <li>
        <Link
          href="allworkouts"
          className="text-slate-300 hover:text-white hover:underline"
        >
          History
        </Link>
      </li>
      <li>
      </li>
    </ul>
  );
}
