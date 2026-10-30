import BaseApi from "@/lib/api/_base.api";

const KEY = "upskill:pending-preferences";
const API = process.env.NEXT_PUBLIC_API_URL;

export function savePendingPreferences(preferences) {
  try {
    localStorage.setItem(KEY, JSON.stringify(preferences));
  } catch {
    // storage unavailable; the user will be prompted after signup instead
  }
}

export function hasPendingPreferences() {
  try {
    return Boolean(localStorage.getItem(KEY));
  } catch {
    return false;
  }
}

export function clearPendingPreferences() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

// Saves choices made before signup; never overwrites preferences the account already has.
export async function applyPendingPreferences() {
  let pending;
  try {
    pending = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    pending = null;
  }
  if (!pending) return;

  try {
    const current = (await BaseApi.get(`${API}/users/me/preferences`))?.data?.data;
    const hasExisting =
      current?.occupation || current?.occupation_custom || current?.topic_ids?.length;
    if (!hasExisting) {
      await BaseApi.put(`${API}/users/me/preferences`, pending);
      window.dispatchEvent(new Event("preferences-saved"));
    }
    clearPendingPreferences();
  } catch {
    // keep it for a later attempt
  }
}
