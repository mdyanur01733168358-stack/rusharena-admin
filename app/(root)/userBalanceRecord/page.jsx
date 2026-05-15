"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { showToast } from "@/app/component/application/tostify";

export default function WithdrawListPage() {
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(false);

  const [copiedId, setCopiedId] = useState(null);

  const fetchWithdraws = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/wallets/userBalanceRecord`);
      if (data.success) setWithdraws(data.data);
      else showToast("error", data.message);
    } catch {
      showToast("error", "Failed to fetch withdraws");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdraws();
  }, []);

  // COPY
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-xl font-bold text-center mb-6">
        All User balance Records
      </h1>

      {/* LIST */}
      {withdraws.length === 0 ? (
        <p className="text-gray-400 text-center">No pending withdraws found.</p>
      ) : (
        <div className="space-y-4">
          {withdraws.map((w) => (
            <div
              key={w._id}
              className={`bg-[#1f1f1f] border border-gray-800 p-5 rounded-xl flex flex-col sm:flex-row justify-between gap-4
                 `}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-gray-500">
                    {new Date(w.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400">UserName:</span>
                  <span>{w.name}</span>
                  <button
                    onClick={() => handleCopy(w.name, w._id)}
                    className="text-xs px-2 py-1 bg-gray-700 rounded "
                  >
                    {copiedId === w._id ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Deposit Added:</span>
                  <span className="font-bold test-md text-green-400">
                    {w.deposit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Winning Added:</span>
                  <span className="font-bold test-md text-green-400">
                    {w.winning}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
