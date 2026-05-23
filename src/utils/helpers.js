import { STORAGE_KEY, GRADE_RULES } from "./constants";

export function getGrade(marks, max = 100) {
  const pct = (marks / max) * 100;
  return GRADE_RULES.find(r => pct >= r.min) || GRADE_RULES[GRADE_RULES.length - 1];
}

export function calcGPA(students) {
  if (!students.length) return 0;
  const gpas = students.map(s => {
    const subjectGPAs = s.subjects.map(sub => getGrade(sub.marks, sub.maxMarks).gpa);
    return subjectGPAs.length ? subjectGPAs.reduce((a, b) => a + b, 0) / subjectGPAs.length : 0;
  });
  return (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2);
}

export function pct(marks, max) {
  return ((marks / max) * 100).toFixed(1);
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
