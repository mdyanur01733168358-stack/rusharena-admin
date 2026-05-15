import User from "@/models/user";

import { connectDB } from "@/lib/connectDB";
import { NextResponse } from "next/server";
import { catchError, response } from "@/lib/healperFunc";
import withdrawSchema from "@/models/withdrawSchema";
import Transactions from "@/models/transection";
import BannedUsers from "@/models/bannedUser";

export async function GET() {
  try {
    await connectDB();

    const withDraws = await withdrawSchema
      .find()
      .populate("userId", "name email")
      .lean()
      .sort({ createdAt: -1 });

    const emails = withDraws.map((w) => w.userId?.email).filter(Boolean);

    const bannedUsers = await BannedUsers.find({
      email: { $in: emails },
    }).lean();

    const bannedEmailSet = new Set(bannedUsers.map((b) => b.email));

    const data = withDraws.map((w) => ({
      ...w,
      userId: {
        ...w.userId,
        isBanned: bannedEmailSet.has(w.userId?.email),
      },
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    return catchError(err);
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const { userId, amount, method, phone, id } = await req.json();

    if (!userId || !amount || !method || !phone || !id) {
      return response(false, 400, "Missing required fields");
    }

    // 1. Create transaction
    const transaction = await Transactions.create({
      userId,
      type: "withdraw",
      method,
      phone,
      amount,
    });

    // 2. Delete withdraw request
    await withdrawSchema.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      data: transaction,
      message: "Withdraw approved and transaction recorded successfully",
    });
  } catch (err) {
    console.error("POST error:", err);
    return catchError(err);
  }
}
