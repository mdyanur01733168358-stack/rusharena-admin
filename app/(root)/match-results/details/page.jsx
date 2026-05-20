"use client";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import ButtonLoading from "@/app/component/buttonLoading";
import { showToast } from "@/app/component/application/tostify";

export default function MatchDetails() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId");
  const router = useRouter();

  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [modalMode, setModalMode] = useState(null);
  const [inputError, setInputError] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);

  // ✅ total winning calculation
  const totalWinning = useMemo(() => {
    return players.reduce((sum, p) => sum + (Number(p.winning) || 0), 0);
  }, [players]);

  useEffect(() => {
    if (!matchId) return;

    const fetchData = async () => {
      try {
        setFetching(true);

        const res = await axios.get(
          `/api/matchResults/details/?matchId=${matchId}`,
        );

        setMatch(res?.data?.match);
        setPlayers(res?.data?.match.joinedPlayers || []);
      } catch (err) {
        console.error("Fetch error:", err);
        showToast("error", "Failed to load match data");
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [matchId]);

  // ✅ Input handler with strict validation
  const handleInputChange = (index, field, value) => {
    let val = Number(value);

    if (val < 0) val = 0;

    const updated = [...players];
    updated[index][field] = val;

    const newTotal = updated.reduce(
      (sum, p) => sum + (Number(p.winning) || 0),
      0,
    );

    if (match?.winPrize && newTotal > match.winPrize) {
      showToast("error", "Total winning exceeds prize limit!");

      // revert change
      updated[index][field] = players[index][field] || 0;

      setInputError(true);
    } else {
      setInputError(false);
    }

    setPlayers(updated);
  };

  const editSinglePlayer = async (playerId) => {
    try {
      if (totalWinning > match.winPrize) {
        showToast("error", "Winning exceeds total prize!");
        return;
      }

      const res = await axios.post(`/api/matchResults/updatePlayer`, {
        matchId,
        playerId,
        kills: players.find((p) => p._id === playerId)?.kills || 0,
        winning: players.find((p) => p._id === playerId)?.winning || 0,
      });

      if (res?.data?.success) {
        showToast("success", "Results successfully!");
        // setPlayers(res?.data?.updatedPlayers || players);
      } else {
        showToast("error", res?.data?.message || "Failed to save results");
      }
    } catch (err) {
      console.error("Save error:", err);
      showToast("error", "Server error! Try again.");
    }
  };

  const deleteSinglePlayer = async (playerId) => {
    try {
      const res = await axios.delete("/api/matchResults/updatePlayer", {
        data: {
          matchId,
          playerId,
        },
      });

      if (res?.data?.success) {
        showToast("success", "Player removed successfully!");

        setPlayers((prev) => prev.filter((p) => p._id !== playerId));
      } else {
        showToast("error", res?.data?.message || "Failed to remove player");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showToast("error", "Server error! Try again.");
    }
  };

  const handleUserSearch = (query) => {
    if (!query) {
      setPlayers(match.joinedPlayers || []);
      return;
    }
    const filtered = (match.joinedPlayers || []).filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()),
    );
    setPlayers(filtered);
  };

  // ✅ Loading state
  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white">
        Loading match...
      </div>
    );
  }

  // ✅ Not found state
  if (!match) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white">
        Match not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0620] text-white px-4 py-6">
      <div className="flex items-center justify-between">
        <div className=" w-2/4 text-left">
          <p className="text-xl text-green-500 font-bold ">{match.title}</p>
          <p className="text-md text-gray-400 mt-1">
            Prize Pool: {match.winPrize}
          </p>
        </div>
        <div className=" w-2/4 text-right">
          <p className="w-full text-md font-bold">EntryFee: {match.entryFee}</p>
          <p className="text-xl text-gray-300 mt-1">
            Per Kill: {match.perKill}
          </p>
        </div>
      </div>

      {/* Players List */}
      <div className="mt-8 border-t border-gray-700 pt-4">
        <h3 className="font-bold text-lg mb-3 text-center">Joined Players</h3>

        {inputError && (
          <p className="text-sm text-red-500 mb-4 text-center">
            Total winning exceeds prize limit!
          </p>
        )}
        <div className="p-2 flex justify-between gap-3 w-full text-gray-300 text-sm font-semibold rounded-tl-lg rounded-tr-lg">
          <input
            onChange={(e) => handleUserSearch(e.target.value)}
            type="text"
            placeholder="Search by username"
            className=" bg-transparent border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* Total */}
          <p className="text-right mt-2 text-sm text-gray-400">
            Total Winning: {totalWinning}
          </p>
        </div>
        {players.length > 0 ? (
          <div className="max-h-screen overflow-y-auto bg-gray-900 rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800 text-gray-300">
                  <th className="p-2 ">#</th>
                  <th className="p-2 ">Player</th>
                  <th className="p-2 ">Username</th>
                  <th className="p-2 ">Results</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <React.Fragment key={player._id}>
                    <tr
                      onClick={() => setEditPlayer(player._id)}
                      className={
                        index % 2 === 0 ? "bg-gray-900" : "bg-gray-800"
                      }
                    >
                      <td className="p-2">{index + 1}</td>

                      <td className="p-2">{player.name}</td>

                      <td className="p-2">{player.userName}</td>

                      <td className="p-2 w-1/3 flex gap-3">
                        <input
                          type="number"
                          min="0"
                          placeholder="Kill"
                          value={player.kills || ""}
                          onChange={(e) =>
                            handleInputChange(index, "kills", e.target.value)
                          }
                          onFocus={() => setEditPlayer(player._id)}
                          className="border border-blue-600 bg-transparent px-2 py-1 w-12 rounded"
                        />

                        <input
                          type="number"
                          min="0"
                          placeholder="Win"
                          value={player.winning || ""}
                          onChange={(e) =>
                            handleInputChange(index, "winning", e.target.value)
                          }
                          onFocus={() => setEditPlayer(player._id)}
                          className="border border-blue-600 bg-transparent px-2 py-1 w-12 rounded"
                        />
                      </td>
                    </tr>

                    {editPlayer === player._id && (
                      <tr
                        className={
                          index % 2 === 0 ? "bg-gray-900" : "bg-gray-800"
                        }
                      >
                        <td colSpan={4} className="p-2">
                          <div className="flex gap-6 justify-around">
                            <button
                              onClick={() => {
                                (setEditPlayer(player._id),
                                  setModalMode("delete"));
                              }}
                              className={`w-1/3 py-2 rounded bg-red-600 hover:bg-red-700  `}
                            >
                              Delete
                            </button>

                            <button
                              onClick={() => {
                                (setEditPlayer(player._id),
                                  setModalMode("update"));
                              }}
                              disabled={inputError}
                              className={`w-1/3 py-2 rounded ${
                                inputError
                                  ? "bg-gray-500 cursor-not-allowed"
                                  : "bg-blue-400 hover:bg-blue-700"
                              }`}
                            >
                              Update
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400">No players joined yet.</p>
        )}
      </div>

      {/* Modal */}
      {modalMode && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-[90%] max-w-md">
            <h2 className="text-xl font-bold mb-3">Confirm Submission</h2>

            {modalMode === "update" && (
              <p className="text-gray-300 mb-6">
                Are you sure to update{" "}
                <span className="bg-gray-700 text-green-400 p-2 rounded">
                  {" "}
                  {editPlayer &&
                    players.find((p) => p._id === editPlayer)?.name}
                </span>{" "}
                information ?
              </p>
            )}
            {modalMode === "delete" && (
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete{" "}
                <span className="bg-gray-700 text-green-400 p-2 rounded">
                  {" "}
                  {editPlayer &&
                    players.find((p) => p._id === editPlayer)?.name}
                </span>{" "}
                From this Match ?
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setModalMode(null)}
                className="w-full bg-gray-700 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  if (inputError) return;
                  setModalMode(null);
                  setEditPlayer(null);
                  if (modalMode === "delete") {
                    await deleteSinglePlayer(editPlayer);
                  } else if (modalMode === "update") {
                    await editSinglePlayer(editPlayer);
                  }
                }}
                className={`w-full py-2 rounded ${
                  modalMode === "delete" ? "bg-red-600" : "bg-blue-600"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
