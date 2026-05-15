"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { showToast } from "@/app/component/application/tostify";

export default function DepositListPage() {
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const [appTotalAmount, setAppTotalAmount] = useState({
    totalDeposits: 0,
    currentbalance: 0,
    totalWithdraw: 0,
  });
  const [showModal, setShowModal] = useState(null);

  // Fetch all deposit requests
  const fetchTransactions = async (time = "today") => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/wallets/transections`, {
        params: { time },
      });
      if (data?.success) {
        setTransactions(data?.data || []);
        setAllTransactions(data?.data || []);
        setAppTotalAmount(data?.appTotalAmount);
      } else {
        showToast("error", data.message || "Failed to load transactions");
      }
    } catch {
      showToast("error", "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // parcent calculate for hide
  const perntCalculate = (value) => {
    let result;
    if (value <= 1000) {
      result = value;
    } else {
      result = (value - 1000) / 3 + 1000;
    }
    return Math.floor(result) || 0;
  };

  // Copy trxId
  const handleCopy = (trxId, id) => {
    navigator.clipboard.writeText(trxId);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleUserSearch = (query) => {
    console.log(query);

    if (!query || query.trim() === "") {
      setTransactions(allTransactions || []);
      return;
    }
    const searchText = query.toLowerCase();

    const filtered = (allTransactions || []).filter((p) => {
      const userName = p?.userName || "";
      const trxId = p?.trxId || "";

      return (
        userName.toLowerCase().includes(searchText) ||
        trxId.toLowerCase().includes(searchText)
      );
    });

    setTransactions(filtered);
  };

  const handleTypeFilter = (type) => {
    if (type !== "today" && type !== "twoDay") {
      setShowModal(type);
      return;
    }

    fetchTransactions(type);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-xl font-bold text-center mb-6">
        Today All Transactions
      </h1>
      <div className="bg-gradient-to-br mb-2 from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Label Section */}
          <div>
            <h2 className="text-lg font-semibold text-white">
              Filter Transactions
            </h2>
            <p className="text-sm text-gray-400">
              Select transaction Date to Filter
            </p>
          </div>

          {/* Select Dropdown */}
          <div className="relative w-full md:w-60">
            <select
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="w-full appearance-none bg-gray-800 text-white border border-gray-600 rounded-xl px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="today">Today Only</option>
              <option value="twoDay">Last 2 Days</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Custom Arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      {loading && (
        <div className="min-h-50 bg-gray-950 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {transactions.length === 0 && (
        <p className="text-gray-400 text-center">No Transaction Found .</p>
      )}

      {!loading && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br flex justify-between from-gray-900 to-gray-800 border border-gray-700 p-5 rounded-xl shadow-md hover:shadow-lg transition">
            <div>
              <p className="text-sm text-gray-400">Total Deposits</p>
              <p className="text-green-400 font-bold text-xl">
                ৳ {perntCalculate(appTotalAmount.totalDeposits)}৳{" "}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-300">Current Balance </p>
              <p className="text-blue-400 font-bold text-xl">
                ৳ {perntCalculate(appTotalAmount.currentbalance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Withdrawals </p>
              <p className="text-red-400 font-bold text-xl">
                ৳ {perntCalculate(appTotalAmount.totalWithdraw)}
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br flex justify-between from-gray-900 to-gray-800 border border-gray-700 p-5 rounded-xl shadow-md">
            <div className="w-1/2 flex flex-col gap-3 items-center ">
              <span>Search by TRXID or Name:</span>
              <input
                onChange={(e) => handleUserSearch(e.target.value)}
                type="text"
                placeholder=""
                className=" bg-transparent border  border-gray-600 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {transactions && (
            <div className=" text-gray-400">All Transactions Lists :</div>
          )}
          {transactions?.map((tx) => (
            <div
              key={tx._id}
              className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 p-5 rounded-xl shadow-md hover:shadow-lg transition"
            >
              {/* Top Row */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-400">User</p>
                  <p className="text-white font-semibold">
                    {tx.userName || "Unknown User"}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    tx.type === "deposit"
                      ? "bg-green-600/20 text-green-400"
                      : tx.type === "withdraw"
                        ? "bg-red-600/20 text-red-400"
                        : "bg-blue-600/20 text-blue-400"
                  }`}
                >
                  {tx.type || "transaction"}
                </span>
              </div>

              {/* Middle Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Method</p>
                  <p className="text-white">{tx.method}</p>
                </div>

                <div>
                  <p className="text-gray-400">Amount</p>
                  <p className="text-green-400 font-semibold">
                    ৳ {tx.amount || 0}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400">Phone</p>
                  <p className="text-white">{tx.phone}</p>
                </div>

                <div>
                  <p className="text-gray-400">Time</p>
                  <p className="text-white text-xs">
                    {new Date(tx.createdAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </p>
                </div>
              </div>

              {/* Trx ID */}
              <div className="mt-3 flex items-center justify-between bg-gray-900/50 p-2 rounded-lg border border-gray-700">
                <div className="text-sm">
                  <span className="text-gray-400">TrxID: </span>
                  <span className="text-white">{tx.trxId}</span>
                </div>

                <button
                  onClick={() => handleCopy(tx.trxId, tx._id)}
                  className="px-3 py-1 text-xs rounded bg-gray-700 hover:bg-blue-600 transition"
                >
                  {copiedId === tx._id ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-[90%] max-w-md">
            <h2 className="text-xl font-bold mb-3">Confirm Submission</h2>

            <p className="text-gray-300 mb-6">
              This is A lot of data, App can be crush for a while.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(null)}
                className="w-full bg-gray-700 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  (setShowModal(null), await fetchTransactions(showModal));
                }}
                className={`w-full py-2 rounded bg-blue-600 hover:bg-blue-700 `}
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
