import mongoose from "mongoose";
import { connectDB } from "@/lib/connectDB";
import { response } from "@/lib/healperFunc";

import User from "@/models/user";
import MyMatches from "@/models/myMatch";
import ResultMatches from "@/models/resultMatch";

// ======================================================
// UPDATE PLAYER RESULT
// ======================================================

export async function POST(req) {
  const session = await mongoose.startSession();

  try {
    await connectDB();

    const body = await req.json();

    const { matchId, playerId, kills = 0, winning = 0 } = body;

    // ================= VALIDATION =================

    if (!matchId || !playerId) {
      return response(false, 400, "matchId and playerId are required");
    }

    if (Number(kills) < 0 || Number(winning) < 0) {
      return response(false, 400, "Invalid kills or winning amount");
    }

    let updatedPlayer = null;

    await session.withTransaction(async () => {
      // ================= FIND MATCH =================

      const match = await ResultMatches.findById(matchId).session(session);

      if (!match) {
        throw new Error("Match not found");
      }

      // ================= FIND PLAYER =================

      const player = match.joinedPlayers.find(
        (p) => p._id.toString() === playerId.toString(),
      );

      if (!player) {
        throw new Error("Player not found");
      }

      // ================= PRIZE VALIDATION =================

      const previousWinning = Number(player.winning || 0);

      const currentPrizeDistributed = match.joinedPlayers.reduce(
        (sum, p) => sum + Number(p.winning || 0),
        0,
      );

      const updatedPrizeDistributed =
        currentPrizeDistributed - previousWinning + Number(winning);

      if (updatedPrizeDistributed > Number(match.winPrize || 0)) {
        throw new Error("Prize pool exceeded");
      }

      // ================= FIND USER =================

      const user = await User.findById(player.authId).session(session);

      if (!user) {
        throw new Error("User not found");
      }

      // ================= UPDATE USER BALANCE =================

      const diff = Number(winning) - previousWinning;

      user.winbalance = Number(user.winbalance || 0) + diff;

      // Prevent negative balance
      if (user.winbalance < 0) {
        user.winbalance = 0;
      }

      await user.save({ session });

      // ================= UPDATE PLAYER =================

      player.kills = Number(kills);
      player.winning = Number(winning);

      // ================= UPDATE MY MATCH =================

      await MyMatches.updateOne(
        {
          userId: user._id,
          matchId: match.myMatchId,
        },
        {
          $set: {
            myKills: String(kills),
            myWin: String(winning),
          },
        },
        { session },
      );

      // ================= MATCH STATUS =================

      match.status = "completed";

      await match.save({ session });

      updatedPlayer = player;
    });

    return response(true, 200, "Player updated successfully", {
      player: updatedPlayer,
    });
  } catch (error) {
    console.error("POST Result Match Error:", error);

    return response(false, 500, error.message || "Something went wrong");
  } finally {
    await session.endSession();
  }
}

// ======================================================
// REMOVE PLAYER
// ======================================================

export async function DELETE(req) {
  const session = await mongoose.startSession();

  try {
    await connectDB();

    const body = await req.json();

    const { matchId, playerId } = body;

    // ================= VALIDATION =================

    if (!matchId || !playerId) {
      return response(false, 400, "matchId and playerId are required");
    }

    await session.withTransaction(async () => {
      // ================= FIND MATCH =================

      const match = await ResultMatches.findById(matchId).session(session);

      if (!match) {
        throw new Error("Match not found");
      }

      // ================= FIND PLAYER =================

      const player = match.joinedPlayers.find(
        (p) => p._id.toString() === playerId.toString(),
      );

      if (!player) {
        throw new Error("Player not found");
      }

      // ================= FIND USER =================

      const user = await User.findById(player.authId).session(session);

      if (!user) {
        throw new Error("User not found");
      }

      const playerWinning = Number(player.winning || 0);

      // =====================================================
      // REMOVE WINNING FROM USER
      // First from winbalance
      // Then remaining from dipositbalance
      // =====================================================
      const entryfee = match.entryFee;
      let remaining = playerWinning;
      user.winbalance += entryfee / 2;
      user.dipositbalance += entryfee / 2;

      const deductFromWin = Math.min(Number(user.winbalance || 0), remaining);

      remaining -= deductFromWin;

      const deductFromDeposit = Math.min(
        Number(user.dipositbalance || 0),
        remaining,
      );

      remaining -= deductFromDeposit;

      // Insufficient balance protection
      if (remaining > 0) {
        throw new Error(`User has insufficient balance. Missing ${remaining}`);
      }

      user.winbalance -= deductFromWin;
      user.dipositbalance -= deductFromDeposit;

      await user.save({ session });

      await match.save({ session });

      // ================= DELETE MY MATCH =================

      await MyMatches.deleteOne(
        {
          userId: player.authId,
          matchId: match.myMatchId,
        },
        { session },
      );
    });

    return response(true, 200, "Player Updated successfully");
  } catch (error) {
    console.error("DELETE Result Match Error:", error);

    return response(false, 500, error.message || "Something went wrong");
  } finally {
    await session.endSession();
  }
}
