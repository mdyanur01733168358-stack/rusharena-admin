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
  const [showModal, setShowModal] = useState(false);
  const [inputError, setInputError] = useState(false);
  const [removePlayer, setRemovePlayer] = useState({});
  const [searching, setSearching] = useState(false);

  // ✅ total winning calculation
  const totalWinning = useMemo(() => {
    return players.reduce((sum, p) => sum + (Number(p.wining) || 0), 0);
  }, [players]);

  useEffect(() => {
    if (!matchId) return;

    const fetchData = async () => {
      try {
        setFetching(true);

        const res = await axios.get(`/api/matches/details/?matchId=${matchId}`);

        setMatch(res.data.match);
        setPlayers(res.data.match.joinedPlayers || []);
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
      (sum, p) => sum + (Number(p.wining) || 0),
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

  const handleSave = async () => {
    try {
      setLoading(true);

      if (totalWinning > match.winPrize) {
        showToast("error", "Winning exceeds total prize!");
        return;
      }

      const results = players.map((player) => ({
        playerId: player.authId,
        playerName: player.name,
        kills: Number(player.kills) || 0,
        winning: Number(player.wining) || 0,
      }));

      const res = await axios.post(`/api/matches/updateResults`, {
        matchId,
        results,
      });

      if (res.data.success) {
        showToast("success", "Results saved successfully!");
        router.back();
      } else {
        showToast("error", res.data.message || "Failed to save results");
      }
    } catch (err) {
      console.error("Save error:", err);
      showToast("error", "Server error! Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUserSearch = (query) => {
    if (!query || query.trim() === "") {
      setSearching(false);
      setPlayers(match.joinedPlayers || []);
      return;
    }
    setSearching(true);

    const filtered = (match.joinedPlayers || []).filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()),
    );
    setPlayers(filtered);
  };

  const removeSinglePlayer = async (playerId) => {
    try {
      setLoading(true);
      const res = await axios.post(`/api/matches/removePlayer`, {
        matchId,
        playerId,
      });
      if (res?.data?.success) {
        showToast("success", "Player removed successfully");
        setPlayers(players.filter((p) => p._id !== playerId)); // Optimistically update UI
      } else {
        showToast("error", "Failed to remove player");
      }
    } catch (err) {
      console.error("Remove player error:", err);
      showToast("error", "Failed to remove player");
    } finally {
      setLoading(false);
    }
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
          <div className="w-1/2 flex items-center ">
            <input
              onChange={(e) => handleUserSearch(e.target.value)}
              type="text"
              placeholder="Search by username"
              className=" bg-transparent border  border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
                  <th className="p-2 ">Result</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={player._id} className="border-t border-gray-700 ">
                    <td className="p-2">{index + 1}</td>
                    <td
                      className="p-2"
                      onClick={() =>
                        setRemovePlayer({
                          playerId: player._id,
                          name: player.name,
                        })
                      }
                    >
                      {player.name}
                    </td>
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
                        className="border border-blue-600 bg-transparent px-2 py-1 w-12 rounded"
                      />

                      <input
                        type="number"
                        min="0"
                        placeholder="Win"
                        value={player.wining || ""}
                        onChange={(e) =>
                          handleInputChange(index, "wining", e.target.value)
                        }
                        className="border border-blue-600 bg-transparent px-2 py-1 w-12 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400">No players joined yet.</p>
        )}

        {players.length > 0 && !searching && (
          <div className="mt-4">
            <ButtonLoading
              className={`w-full ${
                inputError
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              text="Save Results"
              onclick={() => {
                if (!inputError) setShowModal(true);
              }}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      {removePlayer.playerId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-[90%] max-w-md">
            <h2 className="text-xl font-bold mb-3">Confirm Submission</h2>

            <p className="text-gray-300 mb-6">
              Remove and Refund{" "}
              <strong className="p-2 text-green-600 bg-gray-800 rounded font-bold ">
                {" "}
                {removePlayer.name}
              </strong>{" "}
              from this match.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setRemovePlayer({})}
                className="w-1/2 bg-gray-700 py-2 rounded"
              >
                Cancel
              </button>

              <ButtonLoading
                className={`w-1/2 py-2 rounded   bg-red-700    `}
                type="button"
                text="Delete"
                loading={loading}
                onclick={async () => {
                  await removeSinglePlayer(removePlayer.playerId);
                  setRemovePlayer({});
                }}
              />
            </div>
          </div>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-[90%] max-w-md">
            <h2 className="text-xl font-bold mb-3">Confirm Submission</h2>

            <p className="text-gray-300 mb-6">This action cannot be undone.</p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gray-700 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  if (inputError) return;
                  setShowModal(false);
                  await handleSave();
                }}
                disabled={inputError}
                className={`w-full py-2 rounded ${
                  inputError
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
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
