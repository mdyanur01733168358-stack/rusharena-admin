"use client";

import Image from "next/image";

import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
export default function Navbar() {
  const [reloadSpin, setReloadSpin] = useState(false);

  const handleReload = () => {
    setReloadSpin(true);
    setTimeout(() => {
      window.location.reload();
    }, 700);
  };
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 min-h-[38px] bg-[#0A0020] flex justify-between py-3 px-6 shadow-[0_-1px_10px_rgba(0,0,0,0.4)] z-99">
        {/* Left side: Logo and company name */}
        <div className="flex items-center space-x-2">
          <Image
            src="/images/logo.jpg"
            alt="Logo"
            width={52}
            height={52}
            className="rounded-full"
          />
          <h1 className="font-semibold text-lg text-green-500">Rush Arena</h1>
        </div>

        {/* Right side: Profile section */}
        <div className="flex items-center ">
          <strong className="font-medium text-white"> Admin Panel </strong>
          <button
            onClick={handleReload}
            className="flex items-center gap-2 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
          >
            <RotateCcw
              className={`w-5 h-5 ${reloadSpin ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </nav>
    </>
  );
}
