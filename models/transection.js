import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      enum: ["deposit", "withdraw", "bonus"],
    },
    method: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    trxId: {
      type: String,

      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

export default mongoose.models.Transactions ||
  mongoose.model("Transactions", TransactionSchema);
