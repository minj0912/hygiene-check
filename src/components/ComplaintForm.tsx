import React, { useState } from "react";
import { submitComplaint } from "@/lib/firestore";
import { Restroom } from "@/types";
import { X, CheckCircle } from "lucide-react";

interface ComplaintFormProps {
  restroom: Restroom;
  onClose: () => void;
}

export function ComplaintForm({ restroom, onClose }: ComplaintFormProps) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState(restroom.name);
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "제목을 입력해주세요";
    if (!location.trim()) e.location = "위치를 입력해주세요";
    if (!detail.trim()) e.detail = "상세 내용을 입력해주세요";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await submitComplaint({
        title: title.trim(),
        location: location.trim(),
        detail: detail.trim(),
        restroomId: restroom.id,
        restroomName: restroom.name,
      });
      setDone(true);
      setTimeout(() => {
        setTitle("");
        setDetail("");
        setDone(false);
        onClose();
      }, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">불편접수</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <CheckCircle className="text-green-500" size={48} />
            <p className="text-lg font-semibold text-slate-800">접수 완료되었습니다!</p>
            <p className="text-sm text-slate-500">담당자가 확인 후 처리할 예정입니다.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">제목 *</label>
              <input
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })); }}
                className={`w-full border rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? "border-red-400" : "border-slate-200"}`}
                placeholder="예: 휴지가 없어요"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">위치 *</label>
              <input
                value={location}
                onChange={(e) => { setLocation(e.target.value); setErrors((p) => ({ ...p, location: "" })); }}
                className={`w-full border rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.location ? "border-red-400" : "border-slate-200"}`}
                placeholder="예: 10층 여자화장실 1"
              />
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">상세 내용 *</label>
              <textarea
                value={detail}
                onChange={(e) => { setDetail(e.target.value); setErrors((p) => ({ ...p, detail: "" })); }}
                rows={4}
                className={`w-full border rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.detail ? "border-red-400" : "border-slate-200"}`}
                placeholder="불편사항을 자세히 입력해주세요"
              />
              {errors.detail && <p className="text-red-500 text-xs mt-1">{errors.detail}</p>}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 border border-slate-200 rounded-xl py-3 text-slate-600 hover:bg-slate-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {loading ? "접수 중..." : "접수하기"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
