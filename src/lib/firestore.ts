import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { Inspection, Complaint, Restroom, InspectionItem } from "@/types";
import { getPeriod } from "./utils";
import { DEFAULT_RESTROOMS, DEFAULT_INSPECTION_ITEMS } from "@/data/restrooms";

// ─── Restrooms ───────────────────────────────────────────────────────────────

export function subscribeRestrooms(callback: (rooms: Restroom[]) => void): () => void {
  const q = query(collection(db, "restrooms"), orderBy("order", "asc"));

  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        callback(DEFAULT_RESTROOMS);
        return;
      }

      callback(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Restroom[]
      );
    },
    () => callback(DEFAULT_RESTROOMS)
  );
}

export async function addRestroom(data: Restroom): Promise<void> {
  const customId = data.id.trim().toLowerCase();

  if (!customId) {
    throw new Error("화장실 ID가 비어 있습니다.");
  }

  const docRef = doc(db, "restrooms", customId);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    throw new Error("이미 사용 중인 화장실 ID입니다.");
  }

  await setDoc(docRef, {
    floor: data.floor.trim(),
    name: data.name.trim(),
    locationLabel: (data.locationLabel ?? "").trim(),
    order: data.order ?? 0,
  });
}

export async function updateRestroom(
  id: string,
  data: Partial<Omit<Restroom, "id">>
): Promise<void> {
  await setDoc(
    doc(db, "restrooms", id),
    {
      ...data,
      floor: data.floor?.trim(),
      name: data.name?.trim(),
      locationLabel: data.locationLabel?.trim(),
    },
    { merge: true }
  );
}

export async function deleteRestroom(id: string): Promise<void> {
  await deleteDoc(doc(db, "restrooms", id));
}

// ─── Inspection Items ────────────────────────────────────────────────────────

export function subscribeInspectionItems(callback: (items: InspectionItem[]) => void): () => void {
  const q = query(collection(db, "inspectionItems"), orderBy("order", "asc"));

  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        callback(DEFAULT_INSPECTION_ITEMS);
        return;
      }

      callback(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as InspectionItem[]
      );
    },
    () => callback(DEFAULT_INSPECTION_ITEMS)
  );
}

export async function addInspectionItem(data: Omit<InspectionItem, "id">): Promise<void> {
  await addDoc(collection(db, "inspectionItems"), data);
}

export async function updateInspectionItem(
  id: string,
  data: Partial<Omit<InspectionItem, "id">>
): Promise<void> {
  await setDoc(doc(db, "inspectionItems", id), data, { merge: true });
}

export async function deleteInspectionItem(id: string): Promise<void> {
  await deleteDoc(doc(db, "inspectionItems", id));
}

// ─── Inspections ─────────────────────────────────────────────────────────────

export function subscribeLatestInspectionByRestroom(
  restroomId: string,
  callback: (inspection: Inspection | null) => void
): () => void {
  const q = query(collection(db, "inspections"), orderBy("checkedAt", "desc"));

  return onSnapshot(
    q,
    (snap) => {
      const found = snap.docs.find((d) => {
        const data = d.data() as Inspection;
        return data.restroomId === restroomId;
      });

      if (!found) {
        callback(null);
        return;
      }

      callback({
        id: found.id,
        ...found.data(),
      } as Inspection);
    },
    (error) => {
      console.error("subscribeLatestInspectionByRestroom error:", error);
      callback(null);
    }
  );
}

export async function submitInspection(
  data: Omit<Inspection, "id" | "checkedAt" | "period" | "status">
): Promise<void> {
  const now = new Date();

  await addDoc(collection(db, "inspections"), {
    ...data,
    checkedAt: Timestamp.fromDate(now),
    period: getPeriod(now),
    status: "completed",
  });
}

export function subscribeAllLatestInspections(
  restroomIds: string[],
  callback: (map: Record<string, Inspection>) => void
): () => void {
  if (restroomIds.length === 0) {
    callback({});
    return () => {};
  }

  const q = query(collection(db, "inspections"), orderBy("checkedAt", "desc"));

  return onSnapshot(
    q,
    (snap) => {
      const map: Record<string, Inspection> = {};

      snap.docs.forEach((d) => {
        const data = {
          id: d.id,
          ...d.data(),
        } as Inspection;

        if (restroomIds.includes(data.restroomId) && !map[data.restroomId]) {
          map[data.restroomId] = data;
        }
      });

      callback(map);
    },
    () => callback({})
  );
}

// ─── 특정 날짜 점검 기록 ────────────────────────────────────────────────────

export function subscribeInspectionsByDate(
  date: Date,
  callback: (inspections: Inspection[]) => void
): () => void {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, "inspections"),
    where("checkedAt", ">=", Timestamp.fromDate(start)),
    where("checkedAt", "<=", Timestamp.fromDate(end)),
    orderBy("checkedAt", "asc")
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Inspection[]
      );
    },
    () => callback([])
  );
}

// ─── Complaints ──────────────────────────────────────────────────────────────

export async function submitComplaint(
  data: Omit<Complaint, "id" | "createdAt" | "isRead" | "isResolved">
): Promise<void> {
  await addDoc(collection(db, "complaints"), {
    ...data,
    createdAt: Timestamp.fromDate(new Date()),
    isRead: false,
    isResolved: false,
  });
}

export function subscribeComplaints(callback: (complaints: Complaint[]) => void): () => void {
  const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Complaint[]
      );
    },
    () => callback([])
  );
}

export async function markComplaintRead(id: string): Promise<void> {
  await updateDoc(doc(db, "complaints", id), { isRead: true });
}

export async function markComplaintResolved(id: string): Promise<void> {
  await updateDoc(doc(db, "complaints", id), { isResolved: true });
}