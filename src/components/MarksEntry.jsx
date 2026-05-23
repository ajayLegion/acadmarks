import { useState } from "react";
import { styles } from "../utils/constants";
import { getGrade, pct } from "../utils/helpers";
import { EmptyState } from "./EmptyState";

export function MarksEntry({ data, update, notify }) {
  const [selStudent, setSelStudent] = useState("");
  const [selCourse, setSelCourse] = useState("");
  const [marks, setMarks] = useState("");

  const student = data.students.find(s => s.id === selStudent);
  const course  = data.courses.find(c => c.id === selCourse);
  const existing = student?.subjects.find(s => s.courseId === selCourse);

  const submit = () => {
    if (!selStudent || !selCourse) return notify("Select student and course", "error");
    const m = Number(marks);
    const max = Number(course?.maxMarks || 100);
    if (isNaN(m) || m < 0 || m > max) return notify(`Marks must be 0–${max}`, "error");
    update(d => {
      const st = d.students.find(s => s.id === selStudent);
      const idx = st.subjects.findIndex(s => s.courseId === selCourse);
      const entry = { courseId: selCourse, courseName: course.name, marks: m, maxMarks: max };
      if (idx >= 0) st.subjects[idx] = entry; else st.subjects.push(entry);
      return d;
    });
    notify(`Marks saved for ${student?.name} — ${course?.name}`);
    setMarks("");
  };

  const grade = marks !== "" && course ? getGrade(Number(marks), Number(course.maxMarks)) : null;

  return (
    <div style={styles.twoCol}>
      <div style={styles.formCard}>
        <div style={styles.cardTitle}>✏️ Enter Marks</div>
        <label style={styles.label}>Student
          <select style={styles.input} value={selStudent} onChange={e => { setSelStudent(e.target.value); setMarks(""); }}>
            <option value="">— Select student —</option>
            {data.students.map(s => <option key={s.id} value={s.id}>{s.SRN} — {s.name}</option>)}
          </select>
        </label>
        <label style={styles.label}>Course
          <select style={styles.input} value={selCourse} onChange={e => { setSelCourse(e.target.value); setMarks(""); }}>
            <option value="">— Select course —</option>
            {data.courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </label>
        <label style={styles.label}>Marks {course && <span style={{ color: "#9CA3AF" }}>(max {course.maxMarks})</span>}
          <input style={styles.input} type="number" value={marks} onChange={e => setMarks(e.target.value)}
            placeholder={`0 – ${course?.maxMarks || 100}`} min={0} max={course?.maxMarks || 100} />
        </label>

        {grade && (
          <div style={{ ...styles.gradeBadge, background: grade.cgpa >= 6 ? "#dcfce7" : "#fee2e2", color: grade.cgpa >= 6 ? "#15803d" : "#b91c1c" }}>
            Grade: <b>{grade.grade}</b> — {grade.label} &nbsp;|&nbsp; cgpa: <b>{grade.cgpa}</b> &nbsp;|&nbsp; {pct(Number(marks), Number(course?.maxMarks || 100))}%
          </div>
        )}
        {existing && <div style={styles.infoNote}>ℹ️ Existing: {existing.marks}/{existing.maxMarks} ({getGrade(existing.marks, existing.maxMarks).grade}) — will be overwritten</div>}

        <button style={styles.btn} onClick={submit}>Save Marks</button>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.cardTitle}>
          {student ? `📋 ${student.name}'s Marks` : "📋 Student Marks"}
        </div>
        {student?.subjects.length ? (
          <>
            <table style={styles.table}>
              <thead><tr>{["Course","Marks","Max","% ","Grade","cgpa"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
              <tbody>
                {student.subjects.map(s => {
                  const g = getGrade(s.marks, s.maxMarks);
                  return (
                    <tr key={s.courseId} style={styles.tr}>
                      <td style={styles.td}>{s.courseName}</td>
                      <td style={{ ...styles.td, fontWeight: 700 }}>{s.marks}</td>
                      <td style={styles.td}>{s.maxMarks}</td>
                      <td style={styles.td}>{pct(s.marks, s.maxMarks)}%</td>
                      <td style={{ ...styles.td }}>
                        <span style={{ ...styles.gradeChip, background: g.cgpa >= 6 ? "#dcfce7" : g.cgpa >= 5 ? "#fef9c3" : "#fee2e2", color: g.cgpa >= 6 ? "#15803d" : g.cgpa >= 5 ? "#854d0e" : "#b91c1c" }}>{g.grade}</span>
                      </td>
                      <td style={styles.td}>{g.cgpa}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ textAlign: "right", marginTop: 8, fontSize: 14, color: "#6C63FF", fontWeight: 700 }}>
              Ccgpa: {(student.subjects.reduce((a, s) => a + getGrade(s.marks, s.maxMarks).cgpa, 0) / student.subjects.length).toFixed(2)}
            </div>
          </>
        ) : <EmptyState msg={student ? "No marks entered yet" : "Select a student"} />}
      </div>
    </div>
  );
}
