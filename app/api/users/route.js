// app/api/admin/users/route.js

import { connectDB } from "@/lib/connectDB";
import User from "@/models/user";
import { response } from "@/lib/healperFunc";
import BalanceRecord from "@/models/balanceRacord";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    // If no search provided
    if (!search) {
      return response(false, 400, "Search query is required");
    }
    const query = search !== "allUser" ? { name: search } : {};

    const users = await User.find(query).lean();
    if (!users.length) {
      return response(false, 404, "No users found");
    }

    return response(true, 200, "Users fetched", users);
  } catch (err) {
    console.error(err);
    return response(false, 500, "Server error", err.message);
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    const { userId, winbalance, dipositbalance } = await req.json();

    if (!userId || winbalance === undefined || dipositbalance === undefined) {
      return response(
        false,
        400,
        "userId, winbalance, and dipositbalance are required",
      );
    }

    // 1. Get user first (needed for name + old values)
    const user = await User.findById(userId);

    if (!user) {
      return response(false, 404, "User not found");
    }

    // 2. Create balance history record BEFORE update
    const balanceRecord = await BalanceRecord.create({
      userId: user._id,
      name: user.name,
      deposit: dipositbalance - user.dipositbalance,
      winning: winbalance - user.winbalance,
    });

    if (!balanceRecord) {
      return response(false, 404, "balance not Updated !");
    }

    // 3. Update user balances
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { winbalance, dipositbalance },
      { new: true },
    ).lean();

    return response(true, 200, "Balance updated successfully", updatedUser);
  } catch (error) {
    console.error(error);
    return response(false, 500, "Internal server error");
  }
}
