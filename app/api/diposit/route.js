import { NextResponse } from "next/server";

import { connectDB } from "@/lib/connectDB";
import Deposits from "@/models/dipositScema";
import BannedUsers from "@/models/bannedUser";

export async function GET() {
  try {
    // ================= CONNECT DB =================

    await connectDB();

    // ================= FETCH DEPOSITS =================

    const deposits = await Deposits.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // ================= HANDLE EMPTY =================

    if (!deposits?.length) {
      return NextResponse.json(
        {
          success: true,
          count: 0,
          data: [],
        },
        { status: 200 },
      );
    }

    // ================= GET UNIQUE EMAILS =================

    const emails = deposits
      .map((deposit) => deposit?.userId?.email)
      .filter(Boolean);

    // ================= FETCH BANNED USERS =================

    const bannedUsers = await BannedUsers.find({
      email: { $in: emails },
    })
      .select("email")
      .lean();

    // ================= CREATE SET =================

    const bannedEmailSet = new Set(bannedUsers.map((user) => user.email));

    // ================= FORMAT RESPONSE =================

    const data = deposits.map((deposit) => {
      const user = deposit.userId;

      return {
        ...deposit,

        userId: user
          ? {
              ...user,
              isBanned: bannedEmailSet.has(user.email),
            }
          : null,
      };
    });

    // ================= RESPONSE =================

    return NextResponse.json(
      {
        success: true,
        count: data.length,
        data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/deposits error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
