"use client";

import { useState } from "react";
import { ReservationStatus } from "@prisma/client";

const STATUS_LABEL: Record<ReservationStatus, string> = {
  CONFIRMED: "予約済",
  COMPLETED: "利用完了",
  CANCELLED: "キャンセル",
  NO_SHOW: "不在",
};

const STATUS_COLOR: Record<ReservationStatus, string> = {
  CONFIRMED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-400",
  NO_SHOW: "bg-red-50 text-red-500",
};

export default function ReservationCard({
  id,
  memberName,
  planLabel,
  startTime,
  endTime,
  guestCount,
  status: initialStatus,
}: {
  id: string;
  memberName: string;
  planLabel: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  status: ReservationStatus;
}) {
  const [status, setStatus] = useState<ReservationStatus>(initialStatus);
  const [loading, setLoading] = useState(false);

  async function updateStatus(next: ReservationStatus) {
    setLoading(true);
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setStatus(next);
    }
    setLoading(false);
  }

  return (
    <div className="px-4 py-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium text-sm">{memberName}</p>
          <p className="text-xs text-gray-500">
            {startTime} – {endTime}
          </p>
          {guestCount > 0 && (
            <p className="text-xs text-blue-600">同伴者 {guestCount}名</p>
          )}
        </div>
        <div className="text-right">
          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full block mb-1">
            {planLabel}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[status]}`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>

      {/* ステータス操作ボタン（CONFIRMED のみ表示） */}
      {status === ReservationStatus.CONFIRMED && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => updateStatus(ReservationStatus.COMPLETED)}
            disabled={loading}
            className="flex-1 text-xs bg-green-700 text-white rounded px-2 py-1 hover:bg-green-800 transition disabled:opacity-50"
          >
            利用完了 ✓
          </button>
          <button
            onClick={() => updateStatus(ReservationStatus.NO_SHOW)}
            disabled={loading}
            className="text-xs border border-gray-200 text-gray-500 rounded px-2 py-1 hover:bg-gray-50 transition disabled:opacity-50"
          >
            不在
          </button>
        </div>
      )}
    </div>
  );
}
