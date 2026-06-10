"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  all_deposit,
  all_withdraws,
  analytic,
  control_user,
  edit_number,
  admin_password,
  match_results,
  transactions,
  userBalanceRecord,
  secretTransections,
} from "@/routes/websiteRoute";
import ButtonLoading from "./buttonLoading";
import { Preferences } from "@capacitor/preferences";
import { showToast } from "./application/tostify";

import {
  FilePlus,
  DollarSign,
  ArrowDownCircle,
  Settings,
  Edit,
  UserPen,
  BarChart3,
  ListChecks,
} from "lucide-react";

// ✅ Menu Data
const menuData = [
  { label: "Control User", link: control_user, icon: FilePlus },
  { label: "Pending Diposits", link: all_deposit, icon: DollarSign },
  { label: "Pending withdraws", link: all_withdraws, icon: ArrowDownCircle },
  { label: "Transactions", link: transactions, icon: ListChecks },
  { label: "Others", link: analytic, icon: Settings },
  { label: "Edit Numbers", link: edit_number, icon: Edit },
  { label: "Admin Passwords", link: admin_password, icon: UserPen },
  { label: "Match Results", link: match_results, icon: BarChart3 },
];

// 🔐 Secret Menu
const extraMenu = [
  { label: "Transactions", link: secretTransections, icon: ListChecks },
  { label: "User Balance Records", link: userBalanceRecord, icon: BarChart3 },
];

export default function FullScreenMobileMenu() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [clickCount, setClickCount] = useState(false);
  const [clickTimes, setClickTimes] = useState([]);

  // 🔐 Secret click handler (5 clicks in 3 seconds)
  const handleDashboardClick = () => {
    const now = Date.now();

    const updatedClicks = [...clickTimes, now].filter(
      (time) => now - time <= 3000,
    );

    setClickTimes(updatedClicks);

    if (updatedClicks.length >= 5) {
      setClickCount(true);
      setClickTimes([]);
      showToast("success", "Secret menu unlocked!");
    }
  };

  // 🔥 Final menu (dynamic)
  const finalMenuData = clickCount ? [...extraMenu, ...menuData] : menuData;

  // 🔴 Logout
  const handleLogout = useCallback(async () => {
    setLoading(true);

    try {
      await Preferences.remove({ key: "access_token" });

      document.cookie =
        "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

      showToast("success", "Logged out successfully!");
      router.replace("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      showToast("error", "Failed to logout. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // 📌 Navigation
  const handleMenuClick = useCallback(
    (item) => {
      router.push(item.link);
    },
    [router],
  );

  return (
    <div className="w-full bg-white dark:bg-gray-900 mt-[-50px] text-gray-800 dark:text-gray-200 overflow-y-auto py-6">
      {/* Header */}
      <div className="mb-6 bg-gray-800 p-4 px-6 rounded flex justify-between items-center">
        <ButtonLoading
          className="rounded-full bg-red-600 hover:bg-red-700"
          onclick={handleLogout}
          text="Logout"
          loading={loading}
        />
        <h1
          onClick={handleDashboardClick}
          className="text-2xl font-bold text-yellow-600 underline cursor-pointer"
        >
          Dashboard
        </h1>
      </div>

      {/* Menu */}
      <nav className="space-y-3 p-4">
        {finalMenuData.map((item, idx) =>
          item.subMenu ? (
            <Accordion key={idx} type="single" collapsible>
              <AccordionItem value={item.label}>
                <AccordionTrigger className="flex items-center justify-between w-full px-4 py-3 text-base font-medium bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                  <div className="flex items-center gap-3">
                    {item.icon && <item.icon className="w-5 h-5" />}
                    <span>{item.label}</span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pl-10 space-y-2 pt-2">
                  {item.subMenu.map((sub, sidx) => (
                    <Link
                      key={sidx}
                      href={sub.link}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition"
                    >
                      {sub.icon && <sub.icon className="w-4 h-4" />}
                      <span>{sub.label}</span>
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <button
              key={idx}
              onClick={() => handleMenuClick(item)}
              className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition text-left"
            >
              {item.icon && <item.icon className="w-5 h-5" />}
              <span>{item.label}</span>
            </button>
          ),
        )}
      </nav>
    </div>
  );
}
