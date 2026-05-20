import mongoose from "mongoose";

const MyMatheschema = new mongoose.Schema(
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
      trim: true,
    },
    myKills: {
      type: String,
      required: true,
      trim: true,
    },
    myWin: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.MyMathes ||
  mongoose.model("MyMathes", MyMatheschema);
