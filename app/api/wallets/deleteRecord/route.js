import { connectDB } from "@/lib/connectDB";
import User from "@/models/user";
import Diposits from "@/models/dipositScema";
import { NextResponse } from "next/server";
import withdrawSchema from "@/models/withdrawSchema";

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
      existingRecord = await Deposits.findById(deleteId);
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

    // Refund balance if withdraw
    if (type === "withdraw") {
      // Find user
      const foundUser = await User.findById(existingRecord.userId);

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
    await Diposits.findByIdAndDelete(deleteId);

    return NextResponse.json({
      success: true,
      message: "Record removed successfully",
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
