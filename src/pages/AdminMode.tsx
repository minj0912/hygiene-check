import React, { useEffect, useState } from "react";
import {
  ArrowLeft, ClipboardList, MessageSquareWarning, Settings,
  ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Check, X as XIcon,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { AdminComplaintList } from "@/components/AdminComplaintList";
import { DEFAULT_RESTROOMS, DEFAULT_INSPECTION_ITEMS } from "@/data/restrooms";
import {
  subscribeInspectionsByDate,
  subscribeComplaints,
  subscribeRestrooms,
  subscribeInspectionItems,
  addRestroom,
  updateRestroom,
  deleteRestroom,
  addInspectionItem,
  updateInspectionItem,
  deleteInspectionItem,
} from "@/lib/firestore";
import { Inspection, Complaint, Restroom, InspectionItem } from "@/types";

interface AdminModeProps {
  onBack: () => void;
}

type Tab = "inspection" | "complaints" | "manage";
type ManageTab = "restrooms" | "items";

function formatDateLocal(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toLocalDate(str: string) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ─── Date Inspection Table ─────────────────────────────────────────────────

function DailyInspectionView({
  restrooms,
  inspectionItems,
}: {
  restrooms: Restroom[];
  inspectionItems: InspectionItem[];
}) {
  const [dateStr, setDateStr] = useState(formatDateLocal(new Date()));
  const [inspections, setInspections] = useState<Inspection[]>([]);

  const stepDate = (delta: number) => {
    const d = toLocalDate(dateStr);
    d.setDate(d.getDate() + delta);
    setDateStr(formatDateLocal(d));
  };

  useEffect(() => {
    const d = toLocalDate(dateStr);
    const unsub = subscribeInspectionsByDate(d, setInspections);
    return unsub;
  }, [dateStr]);

  const inspectionsByRestroom = React.useMemo(() => {
    const map: Record<string, Inspection[]> = {};
    restrooms.forEach((r) => { map[r.id] = []; });
    inspections.forEach((ins) => {
      if (map[ins.restroomId]) map[ins.restroomId].push(ins);
      else map[ins.restroomId] = [ins];
    });
    return map;
  }, [inspections, restrooms]);

  const totalChecked = inspections.length;
  const roomsDone = restrooms.filter((r) => (inspectionsByRestroom[r.id]?.length ?? 0) > 0).length;

  return (
    <div className="space-y-4">
      {/* Date navigator */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-3">
        <button onClick={() => stepDate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        <input
          type="date"
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          className="flex-1 text-center text-base font-bold text-slate-800 focus:outline-none"
        />
        <button onClick={() => stepDate(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
          <ChevronRight size={18} className="text-slate-600" />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
          <p className="text-xl font-bold text-slate-800">{restrooms.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">전체</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
          <p className="text-xl font-bold text-green-600">{roomsDone}</p>
          <p className="text-xs text-slate-400 mt-0.5">점검 완료</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
          <p className="text-xl font-bold text-orange-500">{totalChecked}</p>
          <p className="text-xs text-slate-400 mt-0.5">총 점검 횟수</p>
        </div>
      </div>

      {/* Table */}
      {restrooms.length === 0 || inspectionItems.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">데이터를 불러오는 중...</div>
      ) : (
        <div className="space-y-4">
          {restrooms.map((room) => {
            const roomInspections = inspectionsByRestroom[room.id] ?? [];
            return (
              <div key={room.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">{room.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roomInspections.length > 0 ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}>
                    {roomInspections.length > 0 ? `${roomInspections.length}회 점검` : "미점검"}
                  </span>
                </div>
                {roomInspections.length === 0 ? (
                  <div className="px-4 py-4 text-center text-sm text-slate-400">이 날 점검 기록 없음</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {roomInspections.map((ins, idx) => {
                      const dt = ins.checkedAt instanceof Date ? ins.checkedAt : (ins.checkedAt as any)?.toDate?.() ?? new Date();
                      const hh = String(dt.getHours()).padStart(2, "0");
                      const mm = String(dt.getMinutes()).padStart(2, "0");
                      const oCount = Object.values(ins.items ?? {}).filter((v) => v === "O").length;
                      const xCount = Object.values(ins.items ?? {}).filter((v) => v === "X").length;
                      return (
                        <div key={ins.id ?? idx}>
                          <div className="px-4 py-2.5 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{ins.period}</span>
                              <span className="text-xs text-slate-500">{hh}:{mm}</span>
                              <span className="text-xs text-slate-600 font-medium">{ins.inspectorName}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">O {oCount}</span>
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-bold">X {xCount}</span>
                            </div>
                          </div>
                          {/* Item results row */}
                          <div className="px-4 py-3 flex flex-wrap gap-1.5">
                            {inspectionItems.map((item) => {
                              const r = ins.items?.[item.id];
                              return (
                                <span
                                  key={item.id}
                                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium ${
                                    r === "O" ? "bg-green-50 text-green-700" :
                                    r === "X" ? "bg-red-50 text-red-600" :
                                    "bg-slate-100 text-slate-400"
                                  }`}
                                >
                                  {item.label}
                                  <span className="font-bold">{r ?? "-"}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Restroom CRUD ─────────────────────────────────────────────────────────

function RestroomManager({ restrooms }: { restrooms: Restroom[] }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Restroom>>({});
  const [adding, setAdding] = useState(false);
  const [newRoom, setNewRoom] = useState({ floor: "", name: "", locationLabel: "" });

  const startEdit = (r: Restroom) => {
    setEditId(r.id);
    setEditValues({ floor: r.floor, name: r.name, locationLabel: r.locationLabel });
  };

  const saveEdit = async () => {
    if (!editId) return;
    await updateRestroom(editId, editValues);
    setEditId(null);
  };

  const handleAdd = async () => {
    if (!newRoom.floor || !newRoom.name) return;
    await addRestroom({
      floor: newRoom.floor,
      name: newRoom.name,
      locationLabel: newRoom.locationLabel,
      order: restrooms.length + 1,
    });
    setNewRoom({ floor: "", name: "", locationLabel: "" });
    setAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">화장실 목록</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus size={13} /> 추가
        </button>
      </div>

      {adding && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <input value={newRoom.floor} onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
              placeholder="층 (예: 10F)" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
              placeholder="화장실명" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 col-span-2" />
          </div>
          <input value={newRoom.locationLabel} onChange={(e) => setNewRoom({ ...newRoom, locationLabel: e.target.value })}
            placeholder="위치 설명 (예: 에스컬레이터 옆)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">저장</button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">취소</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {restrooms.map((r) => (
          <div key={r.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
            {editId === r.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <input value={editValues.floor ?? ""} onChange={(e) => setEditValues({ ...editValues, floor: e.target.value })}
                    placeholder="층" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <input value={editValues.name ?? ""} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                    placeholder="화장실명" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 col-span-2" />
                </div>
                <input value={editValues.locationLabel ?? ""} onChange={(e) => setEditValues({ ...editValues, locationLabel: e.target.value })}
                  placeholder="위치 설명" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold"><Check size={13} /> 저장</button>
                  <button onClick={() => setEditId(null)} className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600"><XIcon size={13} /> 취소</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{r.floor}</span>
                    <span className="text-sm font-semibold text-slate-800">{r.name}</span>
                  </div>
                  {r.locationLabel && <p className="text-xs text-slate-400 mt-0.5 ml-10">{r.locationLabel}</p>}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => startEdit(r)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"><Pencil size={14} /></button>
                  <button onClick={() => deleteRestroom(r.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Inspection Item CRUD ──────────────────────────────────────────────────

function InspectionItemManager({ items }: { items: InspectionItem[] }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const saveEdit = async () => {
    if (!editId || !editLabel.trim()) return;
    await updateInspectionItem(editId, { label: editLabel.trim() });
    setEditId(null);
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    await addInspectionItem({ label: newLabel.trim(), order: items.length + 1 });
    setNewLabel("");
    setAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">점검 항목</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus size={13} /> 추가
        </button>
      </div>

      {adding && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="항목명 (예: 환기팬)"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button onClick={handleAdd} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">저장</button>
          <button onClick={() => setAdding(false)} className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600">취소</button>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between">
            {editId === item.id ? (
              <div className="flex flex-1 gap-2">
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button onClick={saveEdit} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold">저장</button>
                <button onClick={() => setEditId(null)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600">취소</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono w-5 text-center">{item.order}</span>
                  <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => { setEditId(item.id); setEditLabel(item.label); }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"><Pencil size={14} /></button>
                  <button onClick={() => deleteInspectionItem(item.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main AdminMode ────────────────────────────────────────────────────────

export function AdminMode({ onBack }: AdminModeProps) {
  const [restrooms, setRestrooms] = useState<Restroom[]>(DEFAULT_RESTROOMS);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>(DEFAULT_INSPECTION_ITEMS);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [tab, setTab] = useState<Tab>("inspection");
  const [manageTab, setManageTab] = useState<ManageTab>("restrooms");

  const unreadCount = complaints.filter((c) => !c.isRead).length;

  useEffect(() => {
    const u1 = subscribeRestrooms(setRestrooms);
    const u2 = subscribeInspectionItems(setInspectionItems);
    const u3 = subscribeComplaints(setComplaints);
    return () => { u1(); u2(); u3(); };
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "inspection", label: "점검 현황", icon: <ClipboardList size={15} /> },
    { key: "complaints", label: "민원", icon: <MessageSquareWarning size={15} />, badge: unreadCount },
    { key: "manage", label: "관리", icon: <Settings size={15} /> },
  ];

  return (
    <Layout>
      <div className="py-2 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">관리자 모드</h1>
            <p className="text-xs text-slate-400">일자별 점검 현황 · 항목 관리</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors relative ${
                tab === t.key
                  ? "bg-slate-800 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.icon}
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "inspection" && (
          <DailyInspectionView restrooms={restrooms} inspectionItems={inspectionItems} />
        )}

        {tab === "complaints" && (
          <AdminComplaintList complaints={complaints} />
        )}

        {tab === "manage" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setManageTab("restrooms")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  manageTab === "restrooms" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                화장실
              </button>
              <button
                onClick={() => setManageTab("items")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  manageTab === "items" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                점검 항목
              </button>
            </div>
            {manageTab === "restrooms" ? (
              <RestroomManager restrooms={restrooms} />
            ) : (
              <InspectionItemManager items={inspectionItems} />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
