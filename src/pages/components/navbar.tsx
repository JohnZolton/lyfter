import {
  SignedIn,
  UserButton,
} from "@clerk/nextjs";

import Link from "next/link";

export const NavBar = () => {
    return (
        <div>
        <nav className="flex items-center justify-between">
          <SignedIn>
            <div className="m-2 flex flex-col text-white">
              <UserButton
                appearance={{
                  elements: { userButtonAvatarBox: { width: 45, height: 45 } },
                }}
              />
            </div>
          </SignedIn>
          <div className="flex space-x-6 pr-4">
            <Link
              href="home"
              className="text-slate-300 hover:text-white hover:underline"
            >
              Home
            </Link>
            <Link
              href="newplan"
              className="text-gray-300 hover:text-white hover:underline"
            >
              New Plan
            </Link>
            <Link
              href="makeplan"
              className="text-slate-300 hover:text-white hover:underline"
            >
              Edit Plan
            </Link>
            <Link
              href="allworkouts"
              className="text-slate-300 hover:text-white hover:underline"
            >
              History
            </Link>
          </div>
        </nav>
        </div>
    )
}

export default NavBar