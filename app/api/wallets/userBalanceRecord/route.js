import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import BalanceRecord from "@/models/balanceRacord";
import { catchError } from "@/lib/healperFunc";

export async function GET() {
  try {
    // Connect DB
    await connectDB();

    // Fetch all balance records
    const balanceRecords = await BalanceRecord.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: balanceRecords.length,
      data: balanceRecords,
    });
  } catch (err) {
    return catchError(err);
  }
}
