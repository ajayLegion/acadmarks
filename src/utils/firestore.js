// src/utils/firestore.js
// ------------------------------------------------------------------
// Thin async wrappers around Firestore that mirror the existing
// synchronous load() / save() API from helpers.js so that App.jsx
// can swap them in with minimal changes.
//
// Data layout
//   Collection : "ia-portal"
//   Document   : "appData"
//   Shape      : { students: [...], courses: [...] }
// ------------------------------------------------------------------

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const DOC_REF = doc(db, "ia-portal", "appData");

const EMPTY = { students: [], courses: [] };

/**
 * Load the full app state from Firestore.
 * Falls back to an empty dataset if the document doesn't exist yet.
 */
export async function loadFromFirestore() {
  try {
    const snap = await getDoc(DOC_REF);
    if (snap.exists()) {
      const raw = snap.data();
      return {
        students: Array.isArray(raw.students) ? raw.students : [],
        courses:  Array.isArray(raw.courses)  ? raw.courses  : [],
      };
    }
    return { ...EMPTY };
  } catch (err) {
    console.error("Firestore load error:", err);
    // Graceful degradation: return empty data rather than crashing
    return { ...EMPTY };
  }
}

/**
 * Persist the full app state to Firestore.
 * Uses merge:false so the whole document is replaced atomically.
 *
 * @param {{ students: any[], courses: any[] }} data
 */
export async function saveToFirestore(data) {
  try {
    await setDoc(DOC_REF, {
      students: data.students ?? [],
      courses:  data.courses  ?? [],
    });
  } catch (err) {
    console.error("Firestore save error:", err);
    throw err; // re-throw so the caller can surface a toast
  }
}
