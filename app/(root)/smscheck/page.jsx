"use client";

import { useState } from "react";

export default function XGSPage() {
  const [responseMsg, setResponseMsg] = useState("");

  // const parsers = {
  //   bkash: {
  //     amount: /received Tk\s*([\d.]+)/i,
  //     sender: /from\s*(01[3-9]\d{8})/i,
  //     trx: /TrxID\s*([A-Z0-9]+)/i,
  //   },
  //   nagad: {
  //     amount: /Amount:\s*Tk\s*([\d.]+)/i,
  //     sender: /Sender:\s*(01[3-9]\d{8})/i,
  //     trx: /TxnID\s*([A-Z0-9]+)/i,
  //   },
  //   rocket: {
  //     amount: /Tk\s*([\d.]+)\s*received/i,
  //     sender: /A\/C:\s*([*\d]+)/i,
  //     trx: /TxnId:\s*([A-Z0-9]+)/i,
  //   },
  // };

  // function extract(key, regex) {
  //   const match = key.match(regex);
  //   return match ? match[1] : null;
  // }

  // function detectService(key) {
  //   if (/TrxID/i.test(key)) return "Bkash";
  //   if (/TxnID/i.test(key)) return "Nagad";
  //   if (/A\/C:/i.test(key)) return "Rocket";
  //   return null;
  // }

  // function parseMessage(key, service) {
  //   const rules = parsers[service];
  //   if (!rules) return null;

  //   return {
  //     amount: parseFloat(extract(key, rules.amount)),
  //     senderNumber: extract(key, rules.sender),
  //     trxId: extract(key, rules.trx),
  //     service,
  //   };
  // }

  // const handleClick = async () => {
  //   const key =
  //     "You have received Tk 800.00 from 01986414272. Fee Tk 0.00. Balance Tk 5,378.07. TrxID DEC25RJG78 at 12/05/2026 23:58";
  //   const service = detectService(key);
  //   const data = parseMessage(key, service);
  //   console.log(service);
  //   console.log(data);
  // };

  const handleClick = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/diposit/autoAdd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: " You have received Tk 100.00 from 01986414272. Fee Tk 0.00. Balance Tk 5,378.07. TrxID DE71W4U71R at 12/05/2026 23:58",
        }),
      });

      const data = await res.json();
      setResponseMsg(data.message);
    } catch (error) {
      console.error("Error:", error);
      setResponseMsg("Request failed!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">XGS Page</h1>
      <button
        onClick={handleClick}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg transition"
      >
        Send POST Request
      </button>

      {responseMsg && <p className="mt-4 text-green-400">{responseMsg}</p>}
    </div>
  );
}
