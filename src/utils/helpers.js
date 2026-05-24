import {
  IA_THRESHOLD,
  MAX_SEMESTER_COURSES,
  MIN_SEMESTER_COURSES,
  STORAGE_KEY,
} from "./constants";

export function isAtRisk(iaI, iaII) {
  return iaI < IA_THRESHOLD || iaII < IA_THRESHOLD;
}

export function isAtRiskForIA(course, field) {
  const absentField = field === "iaI" ? "iaIAbsent" : "iaIIAbsent";
  const mark = course?.[field];

  return (
    !course?.[absentField] &&
    mark !== null &&
    mark !== undefined &&
    mark !== "" &&
    Number(mark) < IA_THRESHOLD
  );
}

export function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeData(parsed || { students: [], courses: [] });
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

export function normalizeCourseEntry(course = {}) {
  return {
    courseCode: String(course.courseCode || course.code || "").trim(),
    courseName: String(course.courseName || course.name || "").trim(),
    courseType: course.courseType || course.type || "Core",
    iaI: Number(course.iaI ?? course.marks ?? 0),
    iaII: Number(course.iaII ?? 0),
    iaIAbsent: Boolean(course.iaIAbsent),
    iaIIAbsent: Boolean(course.iaIIAbsent),
    iaIDate: course.iaIDate || "",
    iaIIDate: course.iaIIDate || "",
  };
}

export function getStudentCourses(student = {}) {
  const source = Array.isArray(student.courses)
    ? student.courses
    : Array.isArray(student.subjects)
      ? student.subjects
      : [];

  return source
    .map(normalizeCourseEntry)
    .filter(course => course.courseCode || course.courseName);
}

export function normalizeStudent(student = {}) {
  const classSection =
    student.classSection ||
    (student.semester && student.section ? `${student.semester}${student.section}` : "");

  return {
    ...student,
    classSection,
    courses: getStudentCourses(student),
  };
}

export function normalizeData(data = {}) {
  return {
    ...data,
    students: Array.isArray(data.students) ? data.students.map(normalizeStudent) : [],
    courses: Array.isArray(data.courses) ? data.courses : [],
  };
}

export function isStudentAtRisk(student) {
  const courses = getStudentCourses(student);
  return courses.some(course => isAtRisk(course.iaI, course.iaII));
}

export function isStudentAtRiskForIA(student, field) {
  const courses = getStudentCourses(student);
  return courses.some(course => isAtRiskForIA(course, field));
}

export function getCourseLoadStatus(student) {
  const count = getStudentCourses(student).length;
  if (count < MIN_SEMESTER_COURSES) return { count, ok: false, label: "Short load" };
  if (count > MAX_SEMESTER_COURSES) return { count, ok: false, label: "Over load" };
  return { count, ok: true, label: "Valid load" };
}

export function flattenCourseRows(students = []) {
  return students.flatMap(student =>
    getStudentCourses(student).map(course => ({
      student,
      ...course,
    }))
  );
}

export function average(values) {
  const nums = values.filter(value => Number.isFinite(Number(value)));
  if (!nums.length) return 0;
  return nums.reduce((sum, value) => sum + Number(value), 0) / nums.length;
}
