"use client";

import { useState } from "react";
import axios from "axios";
import { showToast } from "@/app/component/application/tostify";
import ConfirmModal from "./modals";
import UserCard from "./user-cards";

/* ================= MAIN PAGE ================= */
export default function AdminUserControl() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [tokenFinding, setTokenFinding] = useState(null);
  const [allusrModal, setAllusrModal] = useState(false);

  const [banUserId, setBanUserId] = useState(null);
  const [banLoading, setBanLoading] = useState(false);

  const [unbanUserId, setUnbanUserId] = useState(null);
  const [unbanLoading, setUnbanLoading] = useState(false);

  /* ================= FETCH ================= */
  const fetchUsers = async () => {
    setAllusrModal(false);

    if (!searchTerm.trim()) {
      showToast("error", "Enter username");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`/api/users?search=${searchTerm}`);
      if (!res.data.success) {
        showToast("error", res.data.message || "Failed to fetch users");
        setUsers([]);
        return;
      }
      if (res.data.success) {
        setUsers(res?.data?.data.users || []);
        setTotalUsers(
          res?.data?.data.totalUsers || res?.data?.data.users.length || 0,
        );
      }
    } catch (err) {
      showToast("error", err.message || "Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const bannedUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/users/banned-user`);

      if (!res.data.success) {
        showToast("error", res.data.message || "Failed to fetch users");
        setUsers([]);
        return;
      }
      if (res.data.success) {
        setUsers(res?.data?.data || []);
      }
    } catch (err) {
      showToast("error", err.message || "Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= HELPERS ================= */
  const handleInputChange = (userId, field, value) => {
    setUsers((prev) =>
      prev.map((user) =>
        user._id === userId ? { ...user, [field]: Number(value) } : user,
      ),
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("info", "Copied to clipboard");
  };

  /* ================= UPDATE ================= */
  const updateBalance = async (userId, winbalance, dipositbalance) => {
    try {
      setUpdatingId(userId);
      const res = await axios.put("/api/users", {
        userId,
        winbalance,
        dipositbalance,
      });

      res.data.success
        ? showToast("success", "Balance updated")
        : showToast("error", res.data.message);
    } catch {
      showToast("error", "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  /* ================= TOKEN ================= */
  const handleTokenCopy = async (userId) => {
    try {
      setTokenFinding(userId);
      const res = await axios.post("/api/get-admintoken", { userId });

      if (res.data.success) {
        navigator.clipboard.writeText(res.data.data.token);
        showToast("success", "Admin token copied");
      }
    } catch {
      showToast("error", "Failed to get token");
    } finally {
      setTokenFinding(null);
    }
  };

  /* ================= BAN ================= */
  const confirmBan = async (email) => {
    try {
      setBanLoading(true);
      const res = await axios.post("/api/ban-user", {
        userId: banUserId,
        email,
      });
      if (!res.data.success) {
        showToast("error", res.data.message || "Failed to ban user");
        return;
      }
      if (res.data.success) {
        showToast("success", "User banned");
      }
    } catch {
      showToast("error", "Failed to ban user");
    } finally {
      setBanLoading(false);
      setBanUserId(null);
    }
  };

  /* ================= UNBAN ================= */
  const confirmUnban = async (email) => {
    try {
      setUnbanLoading(true);
      const res = await axios.post("/api/unban-user", {
        userId: unbanUserId,
        email,
      });

      res.data.success
        ? showToast("success", "User unbanned")
        : showToast("error", res.data.message);
    } catch {
      showToast("error", "Failed to unban user");
    } finally {
      setUnbanLoading(false);
      setUnbanUserId(null);
    }
  };

  return (
    <div className="p-8 w-full min-h-screen bg-[#0f0f0f] text-gray-200">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-4">Admin User Control</h1>
        <div className="flex justify-between mb-8">
          <button
            onClick={() => {
              bannedUsers();
            }}
            className="px-6 py-2 bg-red-700 rounded-lg font-medium"
          >
            Banned Users
          </button>
          <button
            onClick={() => {
              setSearchTerm("allUser");
              setAllusrModal(true);
            }}
            className="px-6 py-2 bg-green-700 rounded-lg font-medium"
          >
            All Users
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex justify-center mb-4 gap-3">
        <input
          type="text"
          placeholder="Search username.."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
          className="w-full md:w-[420px] bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2"
        />
        <button
          onClick={fetchUsers}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Search
        </button>
      </div>

      {loading && <p className="text-center">Searching users...</p>}
      {users.length > 1 && (
        <div className="w-full text-green-600  text-xl m-4 text-bold">
          Total Users : {totalUsers}
        </div>
      )}
      {/* USERS */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 justify-centre gap-6">
        {users.map((user) => (
          <UserCard
            key={user._id}
            user={user}
            updatingId={updatingId}
            tokenFinding={tokenFinding}
            handleInputChange={handleInputChange}
            updateBalance={updateBalance}
            handleTokenCopy={handleTokenCopy}
            copyToClipboard={copyToClipboard}
            setBanUserId={setBanUserId}
            setUnbanUserId={setUnbanUserId}
          />
        ))}
      </div>

      {/* MODALS */}
      {banUserId && (
        <ConfirmModal
          title="Confirm Ban"
          message="Are you sure?"
          onCancel={() => setBanUserId(null)}
          onConfirm={() =>
            confirmBan(users.find((u) => u._id === banUserId)?.email)
          }
          loading={banLoading}
          confirmText="Confirm Ban"
        />
      )}

      {unbanUserId && (
        <ConfirmModal
          title="Confirm Unban"
          message="Are you sure?"
          onCancel={() => setUnbanUserId(null)}
          onConfirm={() =>
            confirmUnban(users.find((u) => u._id === unbanUserId)?.email)
          }
          loading={unbanLoading}
          confirmText="Confirm Unban"
          color="green"
        />
      )}

      {allusrModal && (
        <ConfirmModal
          title="Fetch All Users"
          message="This is a lot of data. Continue?"
          onCancel={() => {
            setAllusrModal(false);
            setSearchTerm("");
          }}
          onConfirm={fetchUsers}
          loading={loading}
          confirmText="Fetch"
        />
      )}
    </div>
  );
}
