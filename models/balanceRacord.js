import mongoose from "mongoose";

const balanceRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    deposit: {
      type: Number,
      default: 0,
    },

    winning: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const BalanceRecord =
  mongoose.models.BalanceRecord ||
  mongoose.model("BalanceRecord", balanceRecordSchema);

export default BalanceRecord;
