import { NextResponse } from "next/server";

import { connectDB } from "@/lib/connectDB";
import Diposits from "@/models/dipositScema";
import BannedUsers from "@/models/bannedUser";

import { catchError } from "@/lib/healperFunc";

export async function GET() {
  try {
    // ================= CONNECT DB =================

    await connectDB();

    // ================= FETCH DEPOSITS =================

    const deposits = await Diposits.find()
      .populate({
        path: "userId",
        select: "name email",
      })
      .sort({ createdAt: -1 })
      .lean();

    // ================= GET EMAILS =================

    const emails = [
      ...new Set(deposits.map((d) => d.userId?.email).filter(Boolean)),
    ];

    // ================= FETCH BANNED USERS =================

    const bannedUsers = await BannedUsers.find({
      email: { $in: emails },
    })
      .select("email")
      .lean();

    // ================= CREATE SET =================

    const bannedEmailSet = new Set(bannedUsers.map((b) => b.email));

    // ================= FINAL DATA =================

    const formattedDeposits = deposits.map((deposit) => ({
      ...deposit,

      userId: deposit.userId
        ? {
            ...deposit.userId,

            isBanned: bannedEmailSet.has(deposit.userId.email),
          }
        : null,
    }));

    // ================= RESPONSE =================

    return NextResponse.json(
      {
        success: true,
        count: formattedDeposits.length,
        data: formattedDeposits,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET Deposits Error:", error);

    return catchError(error);
  }
}
