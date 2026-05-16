"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { showToast } from "@/app/component/application/tostify";
import ButtonLoading from "@/app/component/buttonLoading";

export default function DepositListPage() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    trxId: "",
    phone: "",
  });

  // Fetch all deposit requests
  const fetchDeposits = async () => {
    try {
      const { data } = await axios.get(`/api/diposit`);
      if (data?.success) {
        setDeposits(data?.data);
      } else {
        showToast("error", data?.message || "Failed to load deposits");
      }
    } catch {
      showToast("error", "Failed to fetch deposits");
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  // Copy trxId
  const handleCopy = (trxId, id) => {
    navigator.clipboard.writeText(trxId);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Open modal and set selected deposit info
  const openModal = (deposit) => {
    setSelectedDeposit(deposit);
    setFormData({
      amount: deposit.amount || "",
      trxId: deposit.trxId || "",
      phone: deposit.phone || "",
    });
    setShowModal(true);
  };

  // Handle form input changes
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit deposit receive request
  const handleReceive = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`/api/diposit/receive`, {
        transactionId: formData?.trxId,
        amount: Number(formData?.amount),
        senderNumber: formData?.phone,
        service: selectedDeposit?.method, // send payment method
      });

      if (res.data?.success) {
        showToast(
          "success",
          res.data?.message || "Deposit received successfully",
        );
        setDeposits((prev) =>
          prev.filter((d) => d._id !== selectedDeposit._id),
        );
        setShowModal(false);
      } else {
        showToast("error", res.data?.message || "Failed to receive deposit");
      }
    } catch {
      showToast("error", "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  const deleteDeposit = async (id) => {
    try {
      setLoading(true);
      const res = await axios.post(`/api/wallets/deleteRecord`, {
        deleteId: id,
        type: "deposit",
      });

      if (res?.data?.success) {
        showToast(
          "success",
          res?.data?.message || "Deposit Deleted successfully",
        );
        setDeposits((prev) => prev.filter((d) => d._id !== id));
        setDeleteId(null);
      } else {
        showToast("error", res?.data?.message || "Failed to Delete deposit");
      }
    } catch {
      showToast("error", "Failed to send request");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-xl font-bold text-center mb-6">
        All Deposit Requests
      </h1>

      {deposits.length === 0 ? (
        <p className="text-gray-400 text-center mt-10">
          No pending deposits found.
        </p>
      ) : (
        <div className="grid gap-4">
          {deposits.map((deposit) => (
            <div
              key={deposit._id}
              className={`group bg-gradient-to-br from-[#535353] to-[#362c2c] border border-gray-800 hover:border-blue-500  p-5 rounded-2xl shadow-lg  
                 ${deposit.userId.isBanned && "bg-[url('/images/assets/banned.png')] bg-cover bg-center"}`}
            >
              {/* Left Content */}
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-white">
                    💳 {deposit.method}
                  </p>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    Pending
                  </span>
                </div>

                <p className="text-sm text-gray-300">
                  <span className="text-gray-500">UserName:</span>{" "}
                  {deposit.userId.name}
                </p>
                <p className="text-sm text-gray-300">
                  <span className="text-gray-500">Phone:</span> {deposit.phone}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-500 text-sm">TrxID:</span>
                  <span className="text-gray-200 font-mono truncate max-w-[180px]">
                    {deposit.trxId}
                  </span>

                  <button
                    onClick={() => handleCopy(deposit.trxId, deposit._id)}
                    className="text-xs px-3 py-1 rounded-md bg-gray-800 transition"
                  >
                    {copiedId === deposit._id ? "✓ Copied" : "Copy"}
                  </button>
                </div>

                <p className="text-md text-gray-400">
                  {new Date(deposit.createdAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-around gap-4  mt-2">
                <button
                  onClick={() => setDeleteId(deposit._id)}
                  className="px-6 py-2 rounded-xl text-sm font-medium  bg-red-400 border border-red-500/3 text-white transition"
                >
                  Delete
                </button>

                <button
                  onClick={() => openModal(deposit)}
                  className="px-6 py-2 rounded-xl text-sm font-medium border border-blue-500/30 bg-blue-500 text-white transition"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Popup Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md relative">
            <h2 className="text-lg font-semibold mb-4 text-center">
              Approve Deposit
            </h2>

            <form onSubmit={handleReceive} className="space-y-4">
              {/* Amount (editable) */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData?.amount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-900 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* TrxID (read-only) */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  TrxID
                </label>
                <input
                  type="text"
                  name="trxId"
                  value={formData?.trxId}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-900 rounded border border-gray-700 text-gray-400 cursor-not-allowed"
                />
              </div>

              {/* Phone (read-only) */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData?.phone}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-900 rounded border border-gray-700 text-gray-400 cursor-not-allowed"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <ButtonLoading
                  loading={loading}
                  text="Submit"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium"
                />
              </div>
            </form>
          </div>
        </div>
      )}
      {/* delete deposit */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md relative">
            <h2 className="text-lg font-semibold mb-4 text-center">
              Delete This Deposit
            </h2>

            {/* Buttons */}
            <div className="flex justify-around gap-4 mt-6">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-6  py-2 bg-gray-600 rounded"
              >
                Cancel
              </button>
              <ButtonLoading
                onclick={async () => {
                  (await deleteDeposit(deleteId), setDeleteId(null));
                }}
                loading={loading}
                text="Delete"
                className="bg-red-600  px-6 py-2 rounded "
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
