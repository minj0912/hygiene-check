import React from "react";
import { Complaint } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

interface AdminComplaintListProps {
  complaints: Complaint[];
}

export function AdminComplaintList({ complaints }: AdminComplaintListProps) {
  if (complaints.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
        <p className="text-slate-400 text-sm">접수된 불편 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {complaints.map((item) => (
        <div
          key={item.id}
          className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${
            !item.isRead ? "border-orange-300 bg-orange-50" : "border-slate-100"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {!item.isRead && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white">
                  NEW
                </span>
              )}
              <span className="font-bold text-slate-800">{item.title}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {item.isResolved ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold">
                  <CheckCircle size={13} /> 처리완료
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-orange-500 font-semibold">
                  <Clock size={13} /> 처리대기
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">
            <span className="font-medium text-slate-600">위치:</span> {item.location}
          </p>
          <p className="text-sm text-slate-600 mb-2">{item.detail}</p>
          <p className="text-xs text-slate-400">{formatDateTime(item.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}
