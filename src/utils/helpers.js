import { STORAGE_KEY, IA_THRESHOLD } from "./constants";

export function isAtRisk(iaI, iaII) {
  return iaI < IA_THRESHOLD || iaII < IA_THRESHOLD;
}

export function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { students: [], courses: [] };
  } catch {
    return { students: [], courses: [] };
  }
}

export function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
