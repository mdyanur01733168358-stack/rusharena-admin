import { connectDB } from "@/lib/connectDB";
import matches from "@/models/matches";
import Refund from "@/models/refund";
import User from "@/models/user";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST(req) {
  const session = await mongoose.startSession();

  try {
    await connectDB();

    const body = await req.json();
    const { matchId, playerId } = body;

    // Validate request
    if (!matchId || !playerId) {
      return NextResponse.json(
        {
          success: false,
          message: "matchId and playerId are required",
        },
        { status: 400 },
      );
    }

    session.startTransaction();

    // Find match
    const existingMatch = await matches.findById(matchId).session(session);

    if (!existingMatch) {
      await session.abortTransaction();
      session.endSession();

      return NextResponse.json(
        {
          success: false,
          message: "Match not found",
        },
        { status: 404 },
      );
    }

    // Find player in joinedPlayers
    const player = existingMatch.joinedPlayers?.find(
      (p) => String(p._id) === String(playerId),
    );

    if (!player) {
      await session.abortTransaction();
      session.endSession();

      return NextResponse.json(
        {
          success: false,
          message: "Player not found in this match",
        },
        { status: 404 },
      );
    }

    const entryFee = existingMatch.entryFee || 0;

    // Split refund
    const depositRefund = Math.floor(entryFee / 2);
    const winRefund = entryFee - depositRefund;

    // Update user balance
    const updatedUser = await User.findByIdAndUpdate(
      player.authId,
      {
        $inc: {
          dipositbalance: depositRefund,
          winbalance: winRefund,
        },
      },
      {
        new: true,
        session,
      },
    );

    if (!updatedUser) {
      await session.abortTransaction();
      session.endSession();

      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    // Remove player from match
    await matches.findByIdAndUpdate(
      matchId,
      {
        $pull: {
          joinedPlayers: {
            _id: playerId,
          },
        },
      },
      { session },
    );

    // Save refund history
    await Refund.create(
      [
        {
          userId: updatedUser._id,
          matchId: existingMatch._id,
          name: player.name,
          title: existingMatch.title,
          time: existingMatch.startTime,
          refund: entryFee,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      success: true,
      message: "Player removed and refund processed successfully",
      refundedAmount: entryFee,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("POST /api/matches/removePlayer error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
