"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Countdown from "@/app/component/countdown";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import ButtonLoading from "../buttonLoading";
import { showToast } from "./tostify";
import axios from "axios";

import RoomPopup from "./roomDetalpopup";
import PrizePopup from "./prizePopup";

import {
  MatchType1,
  MatchType2,
  MatchType3,
  MatchType4,
  MatchType5,
  MatchType6,
  MatchType7,
  MatchType8,
  MatchType9,
  MatchType10,
  MatchType1Img,
  MatchType2Img,
  MatchType3Img,
  MatchType4Img,
  MatchType5Img,
  MatchType6Img,
  MatchType7Img,
  MatchType8Img,
  MatchType9Img,
  MatchType10Img,
} from "@/config";

// ✅ helper to get image based on type
const getMatchImage = (matchType) => {
  switch (matchType) {
    case MatchType1:
      return MatchType1Img;
    case MatchType2:
      return MatchType2Img;
    case MatchType3:
      return MatchType3Img;
    case MatchType4:
      return MatchType4Img;
    case MatchType5:
      return MatchType5Img;
    case MatchType6:
      return MatchType6Img;
    case MatchType7:
      return MatchType7Img;
    case MatchType8:
      return MatchType8Img;
    case MatchType9:
      return MatchType9Img;
    case MatchType10:
      return MatchType10Img;
    default:
      return "/images/logo.jpg";
  }
};

const PlayMatch = ({ type }) => {
  const router = useRouter();
  const matchType = type;

  const [matches, setMatches] = useState([]);
  const [roomIdFor, setRoomIdFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [popupData, setPopupData] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // ✅ holds match id to delete

  const defaultValues = {
    roomId: "",
    roomPass: "",
    notification: "",
  };
  const form = useForm({
    defaultValues,
  });

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  // ✅ Fetch matches
  useEffect(() => {
    if (!matchType) return;
    const fetchMatches = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/matches?type=${encodeURIComponent(matchType)}`,
        );
        if (!res.ok) throw new Error("No matches found!");

        const data = await res.json();
        const allMatches = data?.data || [];

        const filtered = allMatches
          .filter((m) => m.matchType === matchType)
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        setMatches(filtered);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [matchType]);

  // ✅ Set Room ID
  const handleRoomIdSubmit = async (data) => {
    try {
      setLoading(true);
      data.matchId = roomIdFor;
      const res = await axios.post("/api/set-roomid", { data });
      if (res?.data?.success) {
        showToast("success", res.data.message || "Added successfully");
      } else {
        showToast("error", res?.data?.message || "Something went wrong");
        return;
      }

      const notificationRes = await axios.post(`/api/roomId-notification`, {
        message: data.notification,
        matchId: roomIdFor,
      });

      if (notificationRes?.data?.success) {
        showToast(
          "success",
          `${notificationRes.data.sent} Device Notification sent!`,
        );
      } else {
        showToast("error", "Notification did not sent!");
      }
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
      setRoomIdFor("");
      form.reset();
    }
  };

  // ✅ Delete Match (after confirmation)
  const deleteMatch = async (matchId) => {
    try {
      setLoading(true);
      const res = await axios.delete(
        `/api/matches/deleteMatch/?matchId=${matchId}`,
      );
      if (res.data.success) {
        showToast("success", res.data.message || "Match deleted successfully");
        setMatches((prev) => prev.filter((m) => m._id !== matchId));
      } else {
        showToast("error", res.data.message || "Failed to delete match");
      }
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
      setConfirmDelete(null);
    }
  };

  // ✅ UI states
  if (loading && !roomIdFor && !confirmDelete) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !matchType) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-black text-white p-4">
        <h1 className="text-3xl font-extrabold mb-4 text-center">
          {error || "Something went wrong!"}
        </h1>
      </div>
    );
  }

  if (!matches.length) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-800 text-white p-4">
        <h1 className="text-3xl font-bold mb-4 text-center">
          No Matches Found
        </h1>
        <p className="text-lg text-center">
          Sorry, there are no matches available for <strong>{matchType}</strong>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-gray-400 min-h-screen p-4 sm:flex sm:flex-col gap-4">
      <h1 className="text-center text-2xl text-fuchsia-50 font-bold mb-6">
        {matchType}
      </h1>

      {matches.map((match) => {
        const hasRoomId = match.roomId && match.roomPass;

        return (
          <Card
            key={match._id}
            className="bg-gray-800 text-white border border-gray-700 sm:w-full hover:bg-gray-700 transition cursor-pointer"
            onClick={() => router.push(`/matches/details?matchId=${match._id}`)}
          >
            <CardHeader>
              <div className="flex gap-4 justify-start">
                <div className="w-16 h-16 rounded-full overflow-hidden relative">
                  <Image
                    src={getMatchImage(match.matchType)}
                    alt={match.matchType}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardTitle className="flex flex-col justify-center gap-1">
                  <strong>{match.title}</strong>
                  <p className="text-sm text-gray-300">
                    {formatDate(match.startTime)}
                  </p>
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex justify-around">
                <div className="text-green-500 font-bold flex flex-col items-center">
                  <strong>WIN PRIZE</strong>
                  <span>{match.winPrize} TK</span>
                </div>
                <div className="text-blue-500 font-bold flex flex-col items-center">
                  <strong>PER KILL</strong>
                  <span>{match.perKill} TK</span>
                </div>
                <div className="text-red-500 font-bold flex flex-col items-center">
                  <strong>ENTRY</strong>
                  <span>{match.entryFee} TK</span>
                </div>
              </div>

              <div className="flex justify-between text-gray-300 mt-2">
                <div className="flex flex-col items-center w-full">
                  <strong>ENTRY TYPE</strong>
                  <span>{match.entryType}</span>
                </div>
                <div className="flex flex-col items-center border-x-4 border-amber-600 w-full">
                  <strong>MAP</strong>
                  <span>{match.map}</span>
                </div>
                <div className="flex flex-col items-center w-full">
                  <strong>VERSION</strong>
                  <span>MOBILE</span>
                </div>
              </div>

              <div className="flex justify-between items-center my-4 gap-3">
                <div className="w-2/3">
                  <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-green-500 h-4"
                      style={{
                        width: `${
                          match.totalSpots
                            ? (match.joinedPlayers.length / match.totalSpots) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">
                    {match.totalSpots - match.joinedPlayers.length} spots left (
                    {match.joinedPlayers.length}/{match.totalSpots})
                  </p>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();

                    form.reset({
                      roomId: match.roomId || "",
                      roomPass: match.roomPass || "",
                      notification: "",
                    });
                    setRoomIdFor(match._id);
                  }}
                  className={`w-1/3 ${
                    hasRoomId
                      ? "bg-gray-500 hover:bg-gray-400"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Set Room Id
                </Button>
              </div>

              {/* Popups */}
              <div className="flex justify-between mt-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPopupData({
                      type: "room",
                      data: {
                        roomId: match.roomId,
                        roomPass: match.roomPass,
                        isJoined: hasRoomId,
                      },
                    });
                  }}
                  variant="outline"
                  className="border-gray-600 text-black"
                >
                  Room Details
                </Button>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(match._id);
                  }}
                  variant="outline"
                  className="border-gray-600 bg-red-500 text-white px-8"
                >
                  Delete
                </Button>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPopupData({
                      type: "prize",
                      data: {
                        totalPrize: match.winPrize,
                        perKill: match.perKill,
                        allPrize: match.prizeDetails,
                      },
                    });
                  }}
                  variant="outline"
                  className="border-gray-600 text-black"
                >
                  Total Prize
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="w-2/3 p-2 bg-green-600 rounded text-center font-bold">
                  <Countdown targetDate={match.startTime} />
                </div>
                <strong className="w-1/3 p-2 bg-green-800 rounded text-center font-bold">
                  #{match.serialNumber}
                </strong>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* ✅ Room Id Popup */}
      {roomIdFor && (
        <div className="fixed top-0 left-0 w-screen h-screen bg-black/40 z-50 flex items-center justify-center">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleRoomIdSubmit)}
              className="space-y-4 w-full mx-6 bg-white p-4 border rounded"
            >
              <FormField
                control={form.control}
                name="roomId"
                rules={{ required: "Room Id is required!" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Id</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roomPass"
                rules={{ required: "Room pass is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notification"
                rules={{ required: "Notification is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between w-full gap-4">
                <Button
                  type="button"
                  onClick={() => {
                    setRoomIdFor(null);
                    form.reset();
                  }}
                  className="px-12 py-2 bg-gray-500 hover:bg-gray-400 text-white rounded"
                >
                  Cancel
                </Button>

                <ButtonLoading
                  type="submit"
                  className="px-12 py-2 text-white rounded"
                  text="Save"
                  loading={loading}
                />
              </div>
            </form>
          </Form>
        </div>
      )}

      {/* ✅ Delete Confirmation Popup */}
      {confirmDelete && (
        <div className="fixed top-0 left-0 w-screen h-screen bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Are you sure you want to delete this match?
            </h2>
            <div className="flex justify-center gap-4 mt-4">
              <ButtonLoading
                className={`bg-red-600 hover:bg-red-700 text-white  `}
                type="button"
                text="Delete"
                loading={loading}
                onclick={() => deleteMatch(confirmDelete)}
              />

              <Button
                variant="outline"
                onClick={() => setConfirmDelete(null)}
                className="border-gray-400 text-gray-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Dynamic Popup */}
      {popupData && popupData.type === "room" && (
        <RoomPopup {...popupData.data} onClose={() => setPopupData(null)} />
      )}
      {popupData && popupData.type === "prize" && (
        <PrizePopup {...popupData.data} onClose={() => setPopupData(null)} />
      )}
    </div>
  );
};

export default PlayMatch;
