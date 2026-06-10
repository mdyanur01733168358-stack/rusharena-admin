"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { showToast } from "@/app/component/application/tostify";
import ButtonLoading from "@/app/component/buttonLoading";

export default function WithdrawListPage() {
  const [withdraws, setWithdraws] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);

  // modal state
  const [modal, setModal] = useState({
    open: false,
    type: null, // "approve" | "delete"
    data: null,
  });

  const [copiedId, setCopiedId] = useState(null);

  const fetchWithdraws = async () => {
    try {
      const { data } = await axios.get(`/api/withdraw`);
      if (data.success) setWithdraws(data.data);
      else showToast("error", data.message);
    } catch {
      showToast("error", "Failed to fetch withdraws");
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

  // APPROVE
  const handleApprove = async (w) => {
    try {
      setLoadingIds((p) => [...p, w._id]);

      const res = await axios.post(`/api/withdraw`, {
        userId: w.userId._id,
        amount: w.amount,
        method: w.method,
        phone: w.phone,
        id: w._id,
      });

      if (res.data.success) {
        showToast("success", "Withdraw approved");
        setWithdraws((p) => p.filter((d) => d._id !== w._id));
      } else {
        showToast("error", res.data.message);
      }
    } catch {
      showToast("error", "Approval failed");
    } finally {
      setLoadingIds((p) => p.filter((id) => id !== w._id));
      setModal({ open: false, type: null, data: null });
    }
  };

  // DELETE (frontend only UI - you must create API)
  const handleDelete = async (w) => {
    try {
      setLoadingIds((p) => [...p, w._id]);

      const res = await axios.post(`/api/wallets/deleteRecord`, {
        deleteId: w._id,
        type: "withdraw",
      });
      if (res.data.success) {
        showToast("success", "Withdraw deleted");
        setWithdraws((p) => p.filter((d) => d._id !== w._id));
      } else {
        showToast("error", res.data.message);
      }
    } catch {
      showToast("error", "Delete failed");
    } finally {
      setLoadingIds((p) => p.filter((id) => id !== w._id));
      setModal({ open: false, type: null, data: null });
    }
  };

  const confirmAction = () => {
    if (!modal.data) return;

    if (modal.type === "approve") handleApprove(modal.data);
    if (modal.type === "delete") handleDelete(modal.data);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-xl font-bold text-center mb-6">
        All Withdraw Requests
      </h1>

      {/* LIST */}
      {withdraws.length === 0 ? (
        <p className="text-gray-400 text-center">No pending withdraws found.</p>
      ) : (
        <div className="space-y-4">
          <div className="w-full text-green-600  text-xl m-4 text-bold">
            Total Pending Withdraw's : {withdraws.length || 0}
          </div>
          {withdraws.map((w) => (
            <div
              key={w._id}
              className={`bg-gray-800 border border-gray-400 p-5 rounded-xl flex flex-col sm:flex-row justify-between gap-4
                ${w.userId.isBanned && "bg-[url('/images/assets/banned.png')] bg-cover bg-center"} `}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-white">
                    💳 {w.method}
                  </p>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    Pending
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400">UserName:</span>
                  <span>{w.userId.name}</span>
                  <button
                    onClick={() => handleCopy(w.userId.name, w._id)}
                    className="text-xs px-2 py-1 bg-gray-700 rounded "
                  >
                    {copiedId === w._id ? "Copied" : "Copy"}
                  </button>
                </div>

                <p>
                  <span className="text-gray-400">Amount:</span> {w.amount}
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Phone:</span>
                  <span>{w.phone}</span>
                  <button
                    onClick={() => handleCopy(w.phone, w._id)}
                    className="text-xs px-2 py-1 bg-gray-700 rounded "
                  >
                    {copiedId === w._id ? "Copied" : "Copy"}
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  {new Date(w.createdAt).toLocaleString()}
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-4 justify-around">
                <ButtonLoading
                  loading={loadingIds.includes(w._id)}
                  text="Approve"
                  disabled={loadingIds.includes(w._id)}
                  onclick={() =>
                    setModal({
                      open: true,
                      type: "approve",
                      data: w,
                    })
                  }
                  className="bg-blue-600 px-6 py-2 rounded-lg"
                />
                <ButtonLoading
                  loading={loadingIds.includes(w._id)}
                  text="Delete"
                  disabled={loadingIds.includes(w._id)}
                  onclick={() =>
                    setModal({
                      open: true,
                      type: "delete",
                      data: w,
                    })
                  }
                  className="bg-red-600 px-6 py-2 rounded-lg"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1f1f1f] p-6 rounded-xl w-[90%] max-w-md border border-gray-700">
            <h2 className="text-lg font-semibold mb-2">
              Confirm {modal.type === "approve" ? "Approval" : "Delete"}
            </h2>

            <p className="text-gray-400 text-sm mb-4">
              Are you sure you want to{" "}
              <span className="text-white font-medium">{modal.type}</span> this
              withdraw?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() =>
                  setModal({ open: false, type: null, data: null })
                }
                className="px-4 py-2 bg-gray-700 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={confirmAction}
                className={`px-4 py-2 rounded-lg ${
                  modal.type === "approve"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-red-600 hover:bg-red-700"
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
