/* ================= USER CARD ================= */
function UserCard({
  user,
  updatingId,
  tokenFinding,
  handleInputChange,
  updateBalance,
  handleTokenCopy,
  copyToClipboard,
  setBanUserId,
  setUnbanUserId,
}) {
  return (
    <div className=" bg-gradient-to-br from-[#1c1c1c] to-[#111] border border-gray-800 rounded-xl p-5 shadow-lg hover:border-blue-500 transition">
      {/* Header */}
      <div className=" flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white">{user.name}</h2>
        <button
          onClick={() => handleTokenCopy(user._id)}
          className="text-xs bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
        >
          {tokenFinding === user._id ? "Finding..." : "Copy Token"}
        </button>
      </div>

      {/* Info */}
      {[
        { label: "Email", value: user.email },
        { label: "Phone", value: user.phone },
        { label: "Password", value: user.password },
      ].map((item) => (
        <div
          key={item.label}
          className="flex justify-between items-center border-b border-gray-800 py-2"
        >
          <div>
            <p className="text-xs text-gray-400">{item.label}</p>
            <p className="text-sm break-all">{item.value || "N/A"}</p>
          </div>
          {item.value && (
            <button
              onClick={() => copyToClipboard(item.value)}
              className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
            >
              Copy
            </button>
          )}
        </div>
      ))}

      {/* Balance */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <label className="text-xs text-gray-400">Win Balance</label>
          <input
            type="number"
            value={user.winbalance ?? ""}
            onChange={(e) =>
              handleInputChange(user._id, "winbalance", e.target.value)
            }
            className="w-full mt-1 bg-[#1a1a1a] border border-gray-700 rounded p-2"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">Deposit Balance</label>
          <input
            type="number"
            value={user.dipositbalance ?? ""}
            onChange={(e) =>
              handleInputChange(user._id, "dipositbalance", e.target.value)
            }
            className="w-full mt-1 bg-[#1a1a1a] border border-gray-700 rounded p-2"
          />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={() =>
          updateBalance(user._id, user.winbalance, user.dipositbalance)
        }
        disabled={updatingId === user._id}
        className={`mt-5 w-full py-2 rounded font-medium ${
          updatingId === user._id
            ? "bg-gray-600"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {updatingId === user._id ? "Updating..." : "Save Changes"}
      </button>

      {/* Danger */}
      <div className="mt-5 border-t border-red-800 pt-3">
        <p className="text-xs text-red-400 mb-2">Danger Zone</p>
        <div className="flex gap-2">
          <button
            onClick={() => setUnbanUserId(user._id)}
            className="flex-1 bg-green-600 py-2 rounded text-sm"
          >
            Unban User
          </button>
          <button
            onClick={() => setBanUserId(user._id)}
            className="flex-1 bg-red-600 py-2 rounded text-sm"
          >
            Ban User
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserCard;
