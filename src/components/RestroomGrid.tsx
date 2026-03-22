import React, { useEffect, useState } from "react";
import {
  Toilet, Droplets, ScrollText, Trash2, WashingMachine, ScanFace,
  FileText, FlaskConical, LayoutGrid, Wind, Pin, AlertCircle,
} from "lucide-react";
import { Restroom, Inspection, InspectionItem } from "@/types";
import { subscribeLatestInspectionByRestroom } from "@/lib/firestore";
import { toDate } from "@/lib/utils";
import { DEFAULT_INSPECTION_ITEMS } from "@/data/restrooms";

const ITEM_ICONS: Record<string, React.ReactNode> = {
  toilet: <Toilet size={26} />,
  urinal: <Droplets size={26} />,
  paper: <ScrollText size={26} />,
  bin: <Trash2 size={26} />,
  sink: <WashingMachine size={26} />,
  mirror: <ScanFace size={26} />,
  towel: <FileText size={26} />,
  soap: <FlaskConical size={26} />,
  floor: <LayoutGrid size={26} />,
  vent: <Wind size={26} />,
  notices: <Pin size={26} />,
};

interface RestroomGridProps {
  restroom: Restroom;
  inspectionItems: InspectionItem[];
  onComplaintClick: () => void;
}

function InspectionStatusBanner({
  inspection,
}: {
  inspection: Inspection | null | undefined;
}) {
  if (inspection === undefined) return null;

  if (!inspection) {
    return (
      <div className="bg-slate-100 rounded-xl px-4 py-2.5 text-center">
        <span className="text-sm text-slate-400">점검 내역 없음</span>
      </div>
    );
  }

  const date = toDate(inspection.checkedAt);
  const m = date ? date.getMonth() + 1 : "-";
  const d = date ? date.getDate() : "-";
  const pass = Object.values(inspection.items ?? {}).filter((v) => v === "O").length;
  const fail = Object.values(inspection.items ?? {}).filter((v) => v === "X").length;

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
      <span className="text-sm font-semibold text-green-700">
        {m}월 {d}일 {inspection.period} 점검 완료
      </span>
      <div className="flex gap-2">
        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">
          O {pass}
        </span>
        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-bold">
          X {fail}
        </span>
      </div>
    </div>
  );
}

export function RestroomGrid({
  restroom,
  inspectionItems,
  onComplaintClick,
}: RestroomGridProps) {
  const [inspection, setInspection] = useState<Inspection | null | undefined>(undefined);

  useEffect(() => {
    setInspection(undefined);

    if (!restroom?.id) {
      setInspection(null);
      return;
    }

    const unsub = subscribeLatestInspectionByRestroom(restroom.id, setInspection);
    return () => unsub();
  }, [restroom?.id]);

  const itemsToShow =
    inspectionItems.length > 0 ? inspectionItems : DEFAULT_INSPECTION_ITEMS;

  return (
    <div className="space-y-3">
      <InspectionStatusBanner inspection={inspection} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {itemsToShow.map((item) => {
          const result = inspection?.items?.[item.id];
          const icon = ITEM_ICONS[item.id] ?? <Pin size={26} />;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col items-center gap-1.5 text-center ${
                result === "O"
                  ? "border-green-200"
                  : result === "X"
                  ? "border-red-200"
                  : "border-slate-100"
              }`}
            >
              <div
                className={
                  result === "O"
                    ? "text-green-500"
                    : result === "X"
                    ? "text-red-400"
                    : "text-blue-400"
                }
              >
                {icon}
              </div>
              <span className="text-sm font-semibold text-slate-800">{item.label}</span>

              {result ? (
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    result === "O"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {result}
                </span>
              ) : (
                <span className="text-xs text-slate-300 px-2.5 py-0.5">-</span>
              )}
            </div>
          );
        })}

        <button
          onClick={onComplaintClick}
          className="bg-white rounded-2xl border border-orange-200 shadow-sm p-4 flex flex-col items-center gap-1.5 text-center hover:shadow-md hover:bg-orange-50 transition-all cursor-pointer"
        >
          <div className="text-orange-500">
            <AlertCircle size={26} />
          </div>
          <span className="text-sm font-semibold text-slate-800">불편접수</span>
          <span className="text-xs text-orange-400 px-2.5 py-0.5">신고하기</span>
        </button>
      </div>
    </div>
  );
}