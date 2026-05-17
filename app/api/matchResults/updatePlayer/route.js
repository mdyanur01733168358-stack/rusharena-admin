import mongoose from "mongoose";
import { connectDB } from "@/lib/connectDB";
import { response } from "@/lib/healperFunc";
import User from "@/models/user";
import MyMatches from "@/models/myMatch";
import ResultMatches from "@/models/resultMatch";

export async function POST(req) {
  const session = await mongoose.startSession();

  try {
    await connectDB();

    const { matchId, playerId, kills = 0, winning = 0 } = await req.json();

    // ✅ Validation
    if (!matchId || !playerId) {
      return response(false, 400, "matchId and playerId are required");
    }

    let updatedPlayer = null;

    await session.withTransaction(async () => {
      // ✅ Find match
      const match = await ResultMatches.findById(matchId).session(session);

      if (!match) {
        throw new Error("Match not found");
      }

      // ✅ Find player from joinedPlayers
      const player = match.joinedPlayers.find(
        (p) => p._id.toString() === playerId.toString(),
      );

      if (!player) {
        throw new Error("Player not found");
      }

      // ✅ Prize validation
      const currentTotalWinning = match.joinedPlayers.reduce(
        (sum, p) => sum + (p.winning || 0),
        0,
      );

      const prevWinning = player.winning || 0;

      const updatedTotalWinning =
        currentTotalWinning - prevWinning + Number(winning);

      if (updatedTotalWinning > match.winPrize) {
        throw new Error("Prize pool exceeded");
      }

      // ✅ Find actual user using authId
      const user = await User.findById(player.authId).session(session);

      if (!user) {
        throw new Error("User not found");
      }

      // ✅ Update user balance
      const diff = Number(winning) - prevWinning;

      user.winbalance = (user.winbalance || 0) + diff;

      await user.save({ session });

      // ✅ Update player data
      player.kills = Number(kills);
      player.winning = Number(winning);

      // ✅ Update MyMatches
      await MyMatches.updateOne(
        {
          userId: user._id,
          matchId: match.myMatchId,
        },
        {
          $set: {
            myKills: kills.toString(),
            myWin: winning.toString(),
          },
        },
        { session },
      );

      match.status = "completed";

      await match.save({ session });

      updatedPlayer = player;
    });

    return response(true, 200, "Player updated successfully", {
      player: updatedPlayer,
    });
  } catch (error) {
    console.error("Transaction Error:", error);

    return response(false, 500, error.message || "Something went wrong");
  } finally {
    session.endSession();
  }
}

export async function DELETE(req) {
  try {
    await connectDB();

    const body = await req.json();

    const { matchId, playerId } = body;

    // ✅ Validation
    if (!matchId || !playerId) {
      return response(false, 400, "matchId and playerId are required");
    }

    // ✅ Find match
    const existingMatch = await ResultMatches.findById(matchId);

    if (!existingMatch) {
      return response(false, 404, "Match not found");
    }

    // ✅ Find player inside joinedPlayers
    const player = existingMatch.joinedPlayers.find(
      (p) => p._id?.toString() === playerId,
    );

    if (!player) {
      return response(false, 404, "Player not found in this match");
    }

    // ✅ Find user
    const foundUser = await User.findById(player.authId);

    if (!foundUser) {
      return response(false, 404, "User not found");
    }

    // ✅ Refund entry fee
    const entryFee = existingMatch.entryFee || 0;

    await User.findByIdAndUpdate(
      player.authId,
      {
        $inc: {
          dipositbalance: entryFee,
          winbalance: -(player.winning || 0),
        },
      },
      { new: true },
    );

    // ✅ Remove player from joinedPlayers
    await ResultMatches.findByIdAndUpdate(
      matchId,
      {
        $pull: {
          joinedPlayers: {
            _id: playerId,
          },
        },
      },
      { new: true },
    );

    // ✅ Remove from MyMatches
    await MyMatches.deleteOne({
      userId: player.authId,
      matchId: existingMatch.myMatchId,
    });
    if (
      foundUser.winbalance + foundUser.dipositbalance <
      player.winning - winbalance
    ) {
      return response(
        true,
        200,
        `Player Balance was only ${foundUser.winbalance + foundUser.dipositbalance} `,
      );
    }
    return response(true, 200, "Player removed successfully");
  } catch (error) {
    console.error("DELETE /api/resultMatch/removePlayer error:", error);

    return response(false, 500, "Internal server error");
  }
}
