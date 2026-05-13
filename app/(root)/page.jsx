"use client";
import FullScreenMobileMenu from "@/app/component/menu";
import Image from "next/image";
import React from "react";
import MatchCards from "../component/application/match-card";

const Dashboard = () => {
  return (
    <main className="w-full sm:w-3xl m-auto  mb-18">
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
          <h1 className="font-semibold text-lg text-green-400">Rush Arena</h1>
        </div>

        {/* Right side: Profile section */}
        <div className="flex items-center ">
          <strong className="font-medium text-white"> Admin Panel </strong>
        </div>
      </nav>
      <div className="mt-8"></div>
      <FullScreenMobileMenu />
      <MatchCards />
    </main>
  );
};

export default Dashboard;
