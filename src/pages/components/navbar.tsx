import { SignedIn, UserButton } from "@clerk/nextjs";

import Link from "next/link";
import { useState } from "react";

export const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  function handleMenuToggle() {
    setIsMenuOpen((prevState) => !prevState);
  }
  return (
    <div>
      <nav className="flex items-center justify-between">
        <SignedIn>
          <div className={`m-2 flex flex-col text-white`}>
            <UserButton
              appearance={{
                elements: { userButtonAvatarBox: { width: 45, height: 45 } },
              }}
            />
          </div>
        </SignedIn>
        <div className={`flex flex-col items-end space-x-6 pr-4 sm:flex-row`}>
          <div className="hidden sm:block">
            <NavMenuItems />
          </div>
        {/* Hamburger menu for mobile */}
          <div
            onClick={handleMenuToggle}
            className={`menu-icon mt-2 px-4 hover:cursor-pointer sm:hidden`}
          >
            ☰
          </div>
        <div className={`sm:hidden ${isMenuOpen ? "block" : "hidden"}`}>
            <NavMenuItems />
        </div>
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
        <a href="https://github.com/JohnZolton/lyfter">
          <div className="flex items-center justify-center gap-2 text-slate-300 hover:text-white hover:underline">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </div>
        </a>
      </li>
    </ul>
  );
}
