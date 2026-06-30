import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/connectDB";
import Match from "@/models/matches";
import User from "@/models/user";
import Refund from "@/models/refund";

export async function DELETE(req) {
  await connectDB();

  const session = await mongoose.startSession();

  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json(
        {
          success: false,
          message: "matchId is required",
        },
        { status: 400 },
      );
    }

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid matchId",
        },
        { status: 400 },
      );
    }

    session.startTransaction();

    // Find match
    const existingMatch = await Match.findById(matchId).session(session);

    if (!existingMatch) {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message: "Match not found",
        },
        { status: 404 },
      );
    }

    const joinedPlayers = existingMatch.joinedPlayers || [];
    const entryFee = existingMatch.entryFee || 0;

    // Get all player IDs (duplicates allowed)
    const playerIds = joinedPlayers
      .filter((player) => player?.authId)
      .map((player) => player.authId.toString());

    // Get unique IDs only for validation
    const uniquePlayerIds = [...new Set(playerIds)];

    // Check all users exist
    const users = await User.find({
      _id: { $in: uniquePlayerIds },
    }).session(session);

    if (users.length !== uniquePlayerIds.length) {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message:
            "One or more users were not found. Match deletion cancelled.",
        },
        { status: 404 },
      );
    }

    const depositRefund = Math.floor(entryFee / 2);
    const winRefund = entryFee - depositRefund;

    // Group refunds by user
    const refundMap = {};

    for (const id of playerIds) {
      if (!refundMap[id]) {
        refundMap[id] = {
          deposit: 0,
          win: 0,
        };
      }

      refundMap[id].deposit += depositRefund;
      refundMap[id].win += winRefund;
    }

    // Update user balances
    const bulkOperations = Object.entries(refundMap).map(
      ([userId, refund]) => ({
        updateOne: {
          filter: { _id: userId },
          update: {
            $inc: {
              dipositbalance: refund.deposit,
              winbalance: refund.win,
            },
          },
        },
      }),
    );

    if (bulkOperations.length > 0) {
      await User.bulkWrite(bulkOperations, { session });
    }

    // Create refund history (one record per joined slot)
    const refundDocuments = joinedPlayers
      .filter((player) => player?.authId)
      .map((player) => ({
        userId: player.authId,
        matchId: existingMatch._id,
        name: player.name,
        title: existingMatch.title,
        time: existingMatch.startTime,
        refund: entryFee,
        depositRefund,
        winRefund,
      }));

    if (refundDocuments.length > 0) {
      await Refund.insertMany(refundDocuments, { session });
    }

    // Delete match
    await Match.findByIdAndDelete(matchId).session(session);

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Match deleted and refunds processed successfully.",
      refundedPlayers: refundDocuments.length,
      uniqueUsersRefunded: uniquePlayerIds.length,
      refundPerPlayer: entryFee,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("DELETE /api/deleteMatch:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}
