import mongoose from "mongoose";
import { connectDB } from "@/lib/connectDB";
import DepositSchema from "@/models/dipositScema";
import SmsLog from "@/models/smsLog";
import Transactions from "@/models/transection";
import User from "@/models/user";

export async function POST(req) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await connectDB();

    const { transactionId, amount, senderNumber, service } = await req.json();

    if (!transactionId || !amount || !senderNumber || !service) {
      return Response.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const deposit = await DepositSchema.findOne(
      { trxId: transactionId },
      null,
      { session },
    );

    if (!deposit) {
      await session.abortTransaction();
      session.endSession();

      return Response.json({
        success: true,
        message: "SMS logged — no matching deposit found yet",
      });
    }

    const numericAmount = Number(amount || deposit.amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      await session.abortTransaction();
      session.endSession();

      return Response.json(
        { success: false, message: "Invalid amount value" },
        { status: 400 },
      );
    }

    // 1. Update user balance
    const updatedUser = await User.findByIdAndUpdate(
      deposit.userId,
      { $inc: { dipositbalance: numericAmount } },
      { new: true, session },
    );

    if (!updatedUser) {
      await session.abortTransaction();
      session.endSession();

      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    // 2. Delete SMS log
    await SmsLog.deleteOne({ transactionId }, { session });

    // 3. Create transaction
    await Transactions.create(
      [
        {
          userId: deposit.userId,
          type: "deposit",
          method: service,
          phone: senderNumber,
          amount: numericAmount,
          trxId: transactionId,
          createdAt: new Date(),
        },
      ],
      { session },
    );

    // 4. Delete deposit record
    await DepositSchema.deleteOne({ trxId: transactionId }, { session });

    // commit all changes
    await session.commitTransaction();
    session.endSession();

    return Response.json({
      success: true,
      message: "Deposit matched and balance credited successfully",
      updatedUser,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("SMS receive error:", err);

    return Response.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500 },
    );
  }
}
