import React, { useEffect, useState } from "react";
import {
  Toilet,
  ScrollText,
  Trash2,
  ScanFace,
  FileText,
  FlaskConical,
  LayoutGrid,
  Wind,
  Pin,
  AlertCircle,
  PersonStanding,
  Hand,
} from "lucide-react";
import { Restroom, Inspection, InspectionItem } from "@/types";
import { subscribeLatestInspectionByRestroom } from "@/lib/firestore";
import { toDate } from "@/lib/utils";
import { DEFAULT_INSPECTION_ITEMS } from "@/data/restrooms";

type Language = "ko" | "en";

interface RestroomGridProps {
  restroom: Restroom;
  inspectionItems: InspectionItem[];
  language?: Language;
  onComplaintClick: () => void;
}

function normalizeLabel(label: string) {
  return label.replace(/\s+/g, "").toLowerCase();
}

function getEnglishLabel(item: InspectionItem) {
  const id = item.id?.toLowerCase?.() ?? "";
  const label = normalizeLabel(item.label ?? "");

  if (id === "toilet" || label.includes("좌변기")) return "Toilet";
  if (id === "urinal" || label.includes("소변기")) return "Urinal";
  if (id === "paper" || label.includes("휴지")) return "Toilet Paper";
  if (id === "bin" || label.includes("휴지통")) return "Trash Bin";
  if (id === "sink" || label.includes("세면대")) return "Sink";
  if (id === "mirror" || label.includes("거울")) return "Mirror";
  if (id === "towel" || label.includes("페이퍼타올") || label.includes("종이타올")) return "Paper Towel";
  if (id === "soap" || label.includes("비누")) return "Soap";
  if (id === "floor" || label.includes("바닥") || label.includes("벽")) return "Floor / Wall";
  if (id === "vent" || label.includes("환기") || label.includes("환풍")) return "Ventilation";
  if (id === "notices" || label.includes("부착물") || label.includes("안내문")) return "Notices";

  return item.label;
}

function getItemIcon(item: InspectionItem) {
  const id = item.id?.toLowerCase?.() ?? "";
  const label = normalizeLabel(item.label ?? "");

  if (id === "toilet" || label.includes("좌변기")) {
    return <Toilet size={26} />;
  }

  if (id === "urinal" || label.includes("소변기")) {
    return <PersonStanding size={26} />;
  }

  if (id === "paper" || label.includes("휴지")) {
    return <ScrollText size={26} />;
  }

  if (id === "bin" || label.includes("휴지통")) {
    return <Trash2 size={26} />;
  }

  if (id === "sink" || label.includes("세면대")) {
    return <Hand size={26} />;
  }

  if (id === "mirror" || label.includes("거울")) {
    return <ScanFace size={26} />;
  }

  if (id === "towel" || label.includes("페이퍼타올") || label.includes("종이타올")) {
    return <FileText size={26} />;
  }

  if (id === "soap" || label.includes("비누")) {
    return <FlaskConical size={26} />;
  }

  if (id === "floor" || label.includes("바닥") || label.includes("벽")) {
    return <LayoutGrid size={26} />;
  }

  if (id === "vent" || label.includes("환기") || label.includes("환풍")) {
    return <Wind size={26} />;
  }

  if (id === "notices" || label.includes("부착물") || label.includes("안내문")) {
    return <Pin size={26} />;
  }

  return <Pin size={26} />;
}

function InspectionStatusBanner({
  inspection,
  language = "ko",
}: {
  inspection: Inspection | null | undefined;
  language?: Language;
}) {
  if (inspection === undefined) return null;

  if (!inspection) {
    return (
      <div className="bg-slate-100 rounded-xl px-4 py-2.5 text-center">
        <span className="text-sm text-slate-400">
          {language === "ko" ? "점검 내역 없음" : "No inspection record"}
        </span>
      </div>
    );
  }

  const date = toDate(inspection.checkedAt);
  const m = date ? date.getMonth() + 1 : "-";
  const d = date ? date.getDate() : "-";
  const pass = Object.values(inspection.items ?? {}).filter((v) => v === "O").length;
  const fail = Object.values(inspection.items ?? {}).filter((v) => v === "X").length;

  const periodText =
    language === "ko"
      ? inspection.period
      : inspection.period === "오전"
      ? "AM"
      : inspection.period === "오후"
      ? "PM"
      : inspection.period;

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
      <span className="text-sm font-semibold text-green-700">
        {language === "ko"
          ? `${m}월 ${d}일 ${periodText} 점검 완료`
          : `${m}/${d} ${periodText} Inspection Completed`}
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
  language = "ko",
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
      <InspectionStatusBanner inspection={inspection} language={language} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {itemsToShow.map((item) => {
          const result = inspection?.items?.[item.id];
          const icon = getItemIcon(item);

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

              <span className="text-sm font-semibold text-slate-800">
                {language === "ko" ? item.label : getEnglishLabel(item)}
              </span>

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
          <span className="text-sm font-semibold text-slate-800">
            {language === "ko" ? "불편접수" : "Report Issue"}
          </span>
          <span className="text-xs text-orange-400 px-2.5 py-0.5">
            {language === "ko" ? "신고하기" : "Submit"}
          </span>
        </button>
      </div>
    </div>
  );
}