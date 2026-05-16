import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import Diposits from "@/models/dipositScema";
import { catchError } from "@/lib/healperFunc";
import BannedUsers from "@/models/bannedUser";
export async function GET() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Fetch all deposits (no populate)
    const deposits = await Diposits.find()
      .populate("userId", "name email")
      .lean()
      .sort({ createdAt: -1 });

    const emails = deposits.map((w) => w.userId?.email).filter(Boolean);

    const bannedUsers = await BannedUsers.find({
      email: { $in: emails },
    }).lean();

    const bannedEmailSet = new Set(bannedUsers.map((b) => b.email));

    const data = deposits.map((w) => ({
      ...w,
      userId: {
        ...w.userId,
        isBanned: bannedEmailSet.has(w.userId?.email),
      },
    }));

    return NextResponse.json({
      success: true,
      data: deposits,
    });
  } catch (err) {
    return catchError(err);
  }
}
