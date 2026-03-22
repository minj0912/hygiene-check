import React, { useEffect, useMemo, useState } from "react";
import { Droplets, Languages } from "lucide-react";
import { Layout } from "@/components/Layout";
import { RestroomSelector } from "@/components/RestroomSelector";
import { RestroomGrid } from "@/components/RestroomGrid";
import { ComplaintForm } from "@/components/ComplaintForm";
import { ModeEntry } from "@/components/ModeEntry";
import { DEFAULT_RESTROOMS, DEFAULT_INSPECTION_ITEMS } from "@/data/restrooms";
import { subscribeRestrooms, subscribeInspectionItems } from "@/lib/firestore";
import { AppMode, Restroom, InspectionItem } from "@/types";

interface HomeProps {
  onModeChange: (mode: AppMode) => void;
}

type Language = "ko" | "en";

function getRestroomIdFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("restroom") ?? "";
}

export function Home({ onModeChange }: HomeProps) {
  const initialRestroomIdFromUrl = useMemo(() => getRestroomIdFromUrl(), []);
  const [restrooms, setRestrooms] = useState<Restroom[]>(DEFAULT_RESTROOMS);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>(DEFAULT_INSPECTION_ITEMS);
  const [selectedId, setSelectedId] = useState(initialRestroomIdFromUrl || DEFAULT_RESTROOMS[0]?.id || "");
  const [showComplaint, setShowComplaint] = useState(false);
  const [language, setLanguage] = useState<Language>("ko");

  const isLockedByQr = !!initialRestroomIdFromUrl;

  useEffect(() => {
    const u1 = subscribeRestrooms(setRestrooms);
    const u2 = subscribeInspectionItems(setInspectionItems);
    return () => {
      u1();
      u2();
    };
  }, []);

  useEffect(() => {
    if (restrooms.length === 0) return;

    if (initialRestroomIdFromUrl) {
      const lockedRoomExists = restrooms.some((r) => r.id === initialRestroomIdFromUrl);
      if (lockedRoomExists) {
        setSelectedId(initialRestroomIdFromUrl);
        return;
      }
    }

    const exists = restrooms.some((r) => r.id === selectedId);
    if (!exists) {
      setSelectedId(restrooms[0].id);
    }
  }, [restrooms, selectedId, initialRestroomIdFromUrl]);

  const selectedRestroom =
    restrooms.find((r) => r.id === selectedId) ?? restrooms[0] ?? null;

  const text = {
    ko: {
      title: "위생점검 현황",
      subtitle: "일일 청결 관리 시스템",
      currentRestroom: "현재 화장실",
      inspectionItems: "점검 항목",
      complaintGuide: "불편사항이 있으시면",
      complaintButton: "불편접수",
      complaintGuideEnd: "를 눌러주세요",
      inspector: "점검자",
      admin: "관리자",
    },
    en: {
      title: "Restroom Inspection Status",
      subtitle: "Daily Cleanliness Management",
      currentRestroom: "Current Restroom",
      inspectionItems: "Inspection Items",
      complaintGuide: "If you experience any inconvenience, please tap",
      complaintButton: "Report Issue",
      complaintGuideEnd: ".",
      inspector: "Inspector",
      admin: "Admin",
    },
  }[language];

  return (
    <Layout>
      <div className="py-2 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Droplets size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">{text.title}</h1>
              <p className="text-xs text-slate-400">{text.subtitle}</p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            {/* 🌍 Language 버튼 */}
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg px-2 py-1">
              <Languages size={14} className="text-slate-500" />
              <button
                onClick={() => setLanguage("ko")}
                className={`text-xs px-2 py-0.5 rounded ${
                  language === "ko" ? "bg-blue-600 text-white" : "text-slate-600"
                }`}
              >
                KO
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`text-xs px-2 py-0.5 rounded ${
                  language === "en" ? "bg-blue-600 text-white" : "text-slate-600"
                }`}
              >
                ENG
              </button>
            </div>

            <ModeEntry mode="inspector" label={text.inspector} onSuccess={onModeChange} />
            <span className="text-slate-300">|</span>
            <ModeEntry mode="admin" label={text.admin} onSuccess={onModeChange} />
          </div>
        </div>

        {selectedRestroom && isLockedByQr ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {text.currentRestroom}
            </label>
            <div className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium bg-slate-50">
              {selectedRestroom.name}
              {selectedRestroom.locationLabel ? ` (${selectedRestroom.locationLabel})` : ""}
            </div>
          </div>
        ) : (
          <RestroomSelector
            restrooms={restrooms}
            selectedId={selectedId}
            onChange={setSelectedId}
          />
        )}

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {text.inspectionItems}
          </p>

          {selectedRestroom && (
            <RestroomGrid
              restroom={selectedRestroom}
              inspectionItems={inspectionItems}
              language={language}
              onComplaintClick={() => setShowComplaint(true)}
            />
          )}
        </div>

        <p className="text-center text-xs text-slate-400 pt-2">
          {text.complaintGuide}{" "}
          <span className="text-orange-500 font-semibold">{text.complaintButton}</span>
          {text.complaintGuideEnd}
        </p>
      </div>

      {showComplaint && selectedRestroom && (
        <ComplaintForm
          restroom={selectedRestroom}
          onClose={() => setShowComplaint(false)}
        />
      )}
    </Layout>
  );
}