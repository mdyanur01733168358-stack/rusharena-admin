import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResultMatches",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: Date,
      required: true,
    },
    refund: {
      type: Number,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Refund = mongoose.models.Refund || mongoose.model("Refund", refundSchema);

export default Refund;
