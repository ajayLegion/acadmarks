import { STORAGE_KEY, GRADE_RULES } from "./constants";

export function getGrade(marks, max = 100) {
  const pct = (marks / max) * 100;
  return GRADE_RULES.find(r => pct >= r.min) || GRADE_RULES[GRADE_RULES.length - 1];
}

export function calccgpa(students) {
  if (!students.length) return 0;
  const cgpas = students.map(s => {
    const subjectcgpas = s.subjects.map(sub => getGrade(sub.marks, sub.maxMarks).cgpa);
    return subjectcgpas.length ? subjectcgpas.reduce((a, b) => a + b, 0) / subjectcgpas.length : 0;
  });
  return (cgpas.reduce((a, b) => a + b, 0) / cgpas.length).toFixed(2);
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
