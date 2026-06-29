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

    await session.startTransaction();

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

    // Get all valid player ids
    const playerIds = joinedPlayers
      .filter((player) => player?.authId)
      .map((player) => player.authId);

    // Check if every user exists
    const users = await User.find({
      _id: { $in: playerIds },
    }).session(session);

    if (users.length !== playerIds.length) {
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

    // Refund all users using bulkWrite
    if (playerIds.length > 0) {
      const bulkOperations = playerIds.map((id) => ({
        updateOne: {
          filter: { _id: id },
          update: {
            $inc: {
              // Verify this field name matches your schema
              dipositbalance: depositRefund,
              winbalance: winRefund,
            },
          },
        },
      }));

      await User.bulkWrite(bulkOperations, { session });
    }

    // Create refund history
    for (const player of joinedPlayers) {
      if (!player?.authId) continue;

      const refund = new Refund({
        userId: player.authId,
        matchId: existingMatch._id,
        name: player.name,
        title: existingMatch.title,
        time: existingMatch.startTime,

        refund: entryFee,
        depositRefund,
        winRefund,
      });

      await refund.save({ session });
    }

    // Delete match
    await Match.findByIdAndDelete(matchId, { session });

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Match deleted and refunds processed successfully.",
      refundedPlayers: playerIds.length,
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
