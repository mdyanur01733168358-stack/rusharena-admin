import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/user";
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
    if (!deposits || deposits.length === 0) {
      return NextResponse.json(
        {
          success: true,
          count: 0,
          data: [],
        },
        { status: 200 },
      );
    }

    // ================= EXTRACT EMAILS SAFELY =================
    const emails = deposits
      .map((d) => d?.userId?.email)
      .filter((email) => typeof email === "string");

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
      const user = deposit?.userId;

      return {
        ...deposit,
        userId: user
          ? {
              ...user,
              isBanned: user.email ? bannedEmailSet.has(user.email) : false,
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
        message: error?.message || "Internal Server Error",
        stack: error?.stack, // remove in production later
      },
      { status: 500 },
    );
  }
}
