import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { catchError } from "@/lib/healperFunc";
import Transactions from "@/models/transection";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const filterTime = searchParams.get("time");

    // ✅ start of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // ✅ last 2 days
    const startOftwoDay = new Date();
    startOftwoDay.setDate(startOftwoDay.getDate() - 1);
    startOftwoDay.setHours(0, 0, 0, 0);

    // ✅ start of week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // ✅ start of month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let timeLimit;

    switch (filterTime) {
      case "today":
        timeLimit = startOfToday;
        break;

      case "twoDay":
        timeLimit = startOftwoDay;
        break;

      case "week":
        timeLimit = startOfWeek;
        break;

      case "month":
        timeLimit = startOfMonth;
        break;

      case "all":
      default:
        timeLimit = new Date(0); // all time
        break;
    }

    // // ✅ aggregation with user join
    const transactions = await Transactions.aggregate([
      {
        $match: {
          createdAt: { $gte: timeLimit },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          userName: "$user.name",
        },
      },
      {
        $project: {
          user: 0, // remove full user object
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    const totalDipositsToday = Number(
      transactions
        .reduce((total, tx) => {
          if (tx.type === "deposit") {
            return total + Number(tx.amount || 0);
          }
          return total;
        }, 0)
        .toFixed(2),
    );

    const totalWithdrawToday = Number(
      transactions
        .reduce((total, tx) => {
          if (tx.type === "withdraw") {
            return total + Number(tx.amount || 0);
          }
          return total;
        }, 0)
        .toFixed(2),
    );

    return NextResponse.json({
      success: true,
      data: transactions,
      totalDipositsToday,
      totalWithdrawToday,
    });
  } catch (err) {
    return catchError(err);
  }
}
