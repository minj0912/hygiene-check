import React, { useEffect, useState } from "react";
import { Droplets } from "lucide-react";
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

export function Home({ onModeChange }: HomeProps) {
  const [restrooms, setRestrooms] = useState<Restroom[]>(DEFAULT_RESTROOMS);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>(DEFAULT_INSPECTION_ITEMS);
  const [selectedId, setSelectedId] = useState(DEFAULT_RESTROOMS[0].id);
  const [showComplaint, setShowComplaint] = useState(false);

  useEffect(() => {
    const u1 = subscribeRestrooms(setRestrooms);
    const u2 = subscribeInspectionItems(setInspectionItems);
    return () => { u1(); u2(); };
  }, []);

  const selectedRestroom = restrooms.find((r) => r.id === selectedId) ?? restrooms[0];

  return (
    <Layout>
      <div className="py-2 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Droplets size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">위생점검 현황</h1>
              <p className="text-xs text-slate-400">일일 청결 관리 시스템</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <ModeEntry mode="inspector" label="점검자" onSuccess={onModeChange} />
            <span className="text-slate-300">|</span>
            <ModeEntry mode="admin" label="관리자" onSuccess={onModeChange} />
          </div>
        </div>

        {/* Restroom Selector */}
        <RestroomSelector
          restrooms={restrooms}
          selectedId={selectedId}
          onChange={setSelectedId}
        />

        {/* Grid */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">점검 항목</p>
          {selectedRestroom && (
            <RestroomGrid
              restroom={selectedRestroom}
              inspectionItems={inspectionItems}
              onComplaintClick={() => setShowComplaint(true)}
            />
          )}
        </div>

        <p className="text-center text-xs text-slate-400 pt-2">
          불편사항이 있으시면 <span className="text-orange-500 font-semibold">불편접수</span>를 눌러주세요
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
