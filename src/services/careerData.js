import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { auth, db, storage } from "../firebase";

const CAREER_API_BASE_URL = import.meta.env.VITE_CAREER_API_BASE_URL?.replace(
  /\/$/,
  "",
);

function requireFirestore() {
  if (!db) throw new Error("Firebase is not configured for career data.");
  return db;
}

function withId(docSnap) {
  return {
    id: docSnap.id,
    ...docSnap.data(),
  };
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function sortCompanies(a, b) {
  return (a.name || "").localeCompare(b.name || "");
}

function sortJobs(a, b) {
  return (
    toMillis(b.lastScannedAt || b.firstSeenAt) -
    toMillis(a.lastScannedAt || a.firstSeenAt)
  );
}

function roleConstraints(roleId) {
  return roleId && roleId !== "all"
    ? [where("roleIds", "array-contains", roleId)]
    : [];
}

function notifyConfigError(onChange, onError) {
  onChange([]);
  onError?.(new Error("Firebase is not configured for career data."));
  return () => {};
}

export async function getCareerCompanies(roleId = "all") {
  const firestore = requireFirestore();
  const snapshot = await getDocs(
    query(
      collection(firestore, "companies"),
      ...roleConstraints(roleId),
      limit(200),
    ),
  );

  return snapshot.docs.map(withId).sort(sortCompanies);
}

export function subscribeCareerCompanies(roleId = "all", onChange, onError) {
  if (!db) return notifyConfigError(onChange, onError);

  return onSnapshot(
    query(collection(db, "companies"), ...roleConstraints(roleId), limit(200)),
    (snapshot) => {
      onChange(snapshot.docs.map(withId).sort(sortCompanies));
    },
    onError,
  );
}

export function subscribeCareerJobs(roleId = "all", onChange, onError) {
  if (!db) return notifyConfigError(onChange, onError);

  return onSnapshot(
    query(collection(db, "jobs"), ...roleConstraints(roleId), limit(200)),
    (snapshot) => {
      onChange(snapshot.docs.map(withId).sort(sortJobs));
    },
    onError,
  );
}

export async function createCareerSearchRun({
  roleId,
  query: searchQuery,
  location,
  radiusKm,
  companyId,
}) {
  const firestore = requireFirestore();
  const docRef = await addDoc(collection(firestore, "searchRuns"), {
    roleId,
    query: searchQuery.trim(),
    location: location.trim() || "Bengaluru",
    radiusKm: Number(radiusKm) || 20,
    companyId: companyId || null,
    status: "queued",
    resultCount: 0,
    error: null,
    requestedBy: auth?.currentUser?.uid || null,
    createdAt: serverTimestamp(),
    startedAt: null,
    completedAt: null,
  });

  if (!CAREER_API_BASE_URL) return docRef.id;

  const token = await auth?.currentUser?.getIdToken?.();
  const response = await fetch(`${CAREER_API_BASE_URL}/api/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ searchRunId: docRef.id }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Search run was created but worker trigger failed: ${
        errorText || response.statusText
      }`,
    );
  }

  return docRef.id;
}

export function subscribeCareerSearchRun(searchRunId, onChange, onError) {
  if (!searchRunId) return () => {};
  if (!db) return notifyConfigError(() => onChange(null), onError);

  return onSnapshot(
    doc(db, "searchRuns", searchRunId),
    (snapshot) => {
      onChange(snapshot.exists() ? withId(snapshot) : null);
    },
    onError,
  );
}

export async function getCareerStorageUrl(storagePath) {
  if (!storagePath) return null;
  if (/^https?:\/\//.test(storagePath)) return storagePath;
  if (!storage) throw new Error("Firebase Storage is not configured.");

  return getDownloadURL(ref(storage, storagePath));
}

export async function seedCareerData() {
  if (!CAREER_API_BASE_URL) {
    throw new Error("VITE_CAREER_API_BASE_URL is not configured.");
  }

  const token = await auth?.currentUser?.getIdToken?.();
  const response = await fetch(`${CAREER_API_BASE_URL}/api/seed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Seed failed: ${errorText || response.statusText}`);
  }

  return response.json();
}
