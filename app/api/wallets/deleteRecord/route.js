import { connectDB } from "@/lib/connectDB";
import User from "@/models/user";
import Diposits from "@/models/dipositScema";
import { NextResponse } from "next/server";
import withdrawSchema from "@/models/withdrawSchema";

import Tokens from "@/models/Tokens";
import { fcm } from "@/lib/firebaseAdmin";
const FIXED_TITLE = "Rush Arena";
const MAX_TOKENS_PER_BATCH = 500;

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { type, deleteId } = body;

    // Validate request data
    if (!type || !deleteId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing specific data",
        },
        { status: 400 },
      );
    }

    // Find record
    let existingRecord;

    if (type === "deposit") {
      existingRecord = await Diposits.findById(deleteId);
    } else if (type === "withdraw") {
      existingRecord = await withdrawSchema.findById(deleteId);
    }

    if (!existingRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "Record not found",
        },
        { status: 404 },
      );
    }

    const foundUser = await User.findById(existingRecord.userId);
    // Refund balance if withdraw
    if (type === "withdraw") {
      // Find user

      if (!foundUser) {
        return NextResponse.json(
          {
            success: false,
            message: "User not found",
          },
          { status: 404 },
        );
      }

      await User.findByIdAndUpdate(
        foundUser._id,
        {
          $inc: { winbalance: existingRecord.amount },
        },
        { new: true },
      );
    }

    // Delete record
    if (type === "deposit") {
      await Diposits.findByIdAndDelete(deleteId);
    } else if (type === "withdraw") {
      await withdrawSchema.findByIdAndDelete(deleteId);
    }

    //  send notifications ------------
    const message = `Your ${type} has been canceled !`;
    let notifyStatus = "";
    // 2. Get tokens for match players
    const tokenDocs = await Tokens.find({
      userId: { $in: foundUser._id },
    });

    const tokens = tokenDocs.map((item) => item.token).filter(Boolean);

    if (tokens.length === 0) {
      notifyStatus = "Notification not sent ";
    }

    // 3. Notification payload
    const payload = {
      notification: {
        title: FIXED_TITLE,
        body: message,
      },
    };

    let totalSuccess = 0;
    let totalFailure = 0;

    // 4. Send in batches of 500
    for (let i = 0; i < tokens.length; i += MAX_TOKENS_PER_BATCH) {
      const batchTokens = tokens.slice(i, i + MAX_TOKENS_PER_BATCH);

      const response = await fcm.sendEachForMulticast({
        tokens: batchTokens,
        ...payload,
      });

      totalSuccess += response.successCount;
      totalFailure += response.failureCount;
    }
    notifyStatus = `${totalSuccess} Device notification sent`;

    return NextResponse.json({
      success: true,
      message: `Record removed successfully and ${notifyStatus}`,
    });
  } catch (error) {
    console.error("POST /api/wallets/deleteRecord error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
