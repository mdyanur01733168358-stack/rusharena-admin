import { connectDB } from "@/lib/connectDB";
import User from "@/models/user";
import Transactions from "@/models/transection";
import smsLog from "@/models/smsLog";
import dipositScema from "@/models/dipositScema";
import { catchError, response } from "@/lib/healperFunc";

/**
 * ----------------------------
 * SERVICE PARSERS
 * ----------------------------
 */
const parsers = {
  bkash: {
    amount: /received Tk\s*([\d.]+)/i,
    sender: /from\s*(01[3-9]\d{8})/i,
    trx: /TrxID\s*([A-Z0-9]+)/i,
  },
  nagad: {
    amount: /Amount:\s*Tk\s*([\d.]+)/i,
    sender: /Sender:\s*(01[3-9]\d{8})/i,
    trx: /TxnID:\s*([A-Z0-9]+)/i,
  },
  rocket: {
    amount: /Tk\s*([\d.]+)\s*received/i,
    sender: /A\/C:\*+\d+/i,
    trx: /TxnId:\s*([A-Z0-9]+)/i,
  },
};

/**
 * ----------------------------
 * SAFE EXTRACTION
 * ----------------------------
 */
function extract(text, regex) {
  const match = text.match(regex);
  return match ? match[1] : null;
}

/**
 * ----------------------------
 * IMPROVED SERVICE DETECTION (scoring system)
 * ----------------------------
 */
function detectService(text) {
  if (!text) return null;

  let bkash = 0;
  let nagad = 0;
  let rocket = 0;

  // bKash signals
  if (/you have received tk/i.test(text)) bkash += 2;
  if (/trxid/i.test(text)) bkash += 2;
  if (/from\s*01[3-9]\d{8}/i.test(text)) bkash += 2;

  // Nagad signals
  if (/amount:\s*tk/i.test(text)) nagad += 2;
  if (/sender:\s*01[3-9]\d{8}/i.test(text)) nagad += 2;
  if (/txnid/i.test(text)) nagad += 2;

  // Rocket signals
  if (/a\/c:\*+\d+/i.test(text)) rocket += 2;
  if (/txn[i]?d/i.test(text)) rocket += 2;
  if (/fee\s*:?tk/i.test(text)) rocket += 1;

  const max = Math.max(bkash, nagad, rocket);

  // require minimum confidence
  if (max < 3) return null;

  if (bkash === max) return "bkash";
  if (nagad === max) return "nagad";
  if (rocket === max) return "rocket";

  return null;
}

/**
 * ----------------------------
 * PARSE MESSAGE
 * ----------------------------
 */
function parseMessage(text, service) {
  const rules = parsers[service];
  if (!rules) return null;

  const amount = parseFloat(extract(text, rules.amount));
  const senderNumber = extract(text, rules.sender);
  const trxId = extract(text, rules.trx);

  return {
    amount: Number.isFinite(amount) ? amount : null,
    senderNumber,
    trxId,
    service,
  };
}

/**
 * ----------------------------
 * MAIN ROUTE
 * ----------------------------
 */
export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json().catch(async () => {
      const text = await req.text();
      return Object.fromEntries(new URLSearchParams(text));
    });

    const key = body?.key;

    // ---------------- VALIDATION ----------------
    if (typeof key !== "string" || key.trim().length < 10) {
      return response(false, 400, "Invalid SMS payload");
    }

    const service = detectService(key);
    if (!service) {
      return response(false, 400, "Could not detect payment service");
    }

    const data = parseMessage(key, service);

    if (!data) {
      return response(false, 400, "Failed to parse message");
    }

    if (!data.amount || data.amount <= 0) {
      return response(false, 400, "Invalid amount detected");
    }

    if (!data.trxId || data.trxId.length < 5) {
      return response(false, 400, "Invalid transaction ID");
    }

    // ---------------- DUPLICATE CHECK ----------------
    const existing = await smsLog.exists({ transactionId: data.trxId });
    if (existing) {
      return response(false, 409, "Duplicate transaction");
    }

    const method = service.charAt(0).toUpperCase() + service.slice(1);

    // ---------------- FIND DEPOSIT ----------------
    const deposit = await dipositScema.findOne({ trxId: data.trxId });

    // ---------------- NO MATCH → LOG ----------------
    if (!deposit) {
      await smsLog.create({
        service: method,
        senderNumber: data.senderNumber,
        amount: data.amount,
        transactionId: data.trxId,
        receivedAt: new Date(),
      });

      return response(true, 200, "Logged for later matching");
    }

    // ---------------- TRANSACTION ----------------
    await Transactions.create({
      userId: deposit.userId,
      type: "deposit",
      method,
      phone: data.senderNumber,
      trxId: data.trxId,
      amount: data.amount,
      createdAt: new Date(),
    });

    // ---------------- BALANCE UPDATE ----------------
    const updatedUser = await User.findByIdAndUpdate(
      deposit.userId,
      { $inc: { dipositbalance: data.amount } },
      { new: true },
    );

    if (!updatedUser) {
      return response(false, 404, "User not found");
    }

    // ---------------- CLEANUP ----------------
    await deposit.deleteOne();

    return response(true, 200, "Deposit successful and balance updated");
  } catch (err) {
    console.error("Deposit route error:", err);
    return catchError(err);
  }
}
