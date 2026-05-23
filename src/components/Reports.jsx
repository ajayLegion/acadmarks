import { useState } from "react";
import * as XLSX from "xlsx";
import { GRADE_RULES, styles } from "../utils/constants";
import { getGrade, pct } from "../utils/helpers";
import { EmptyState } from "./EmptyState";

export function Reports({ data, notify }) {
  const [selStudent, setSelStudent] = useState("");
  const student = data.students.find(s => s.id === selStudent);

  const exportAllExcel = () => {
    const rows = data.students.flatMap(s =>
      s.subjects.map(sub => {
        const g = getGrade(sub.marks, sub.maxMarks);
        return {
          "Roll No": s.rollNo, "Student Name": s.name, "Department": s.department,
          "Semester": s.semester, "Course": sub.courseName,
          "Marks": sub.marks, "Max Marks": sub.maxMarks,
          "Percentage": pct(sub.marks, sub.maxMarks) + "%",
          "Grade": g.grade, "cgpa": g.cgpa, "Result": g.cgpa >= 5 ? "Pass" : "Fail"
        };
      })
    );
    if (!rows.length) return notify("No data to export", "error");
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Marks");

    const summary = data.students.map(s => {
      const ccgpa = s.subjects.length
        ? (s.subjects.reduce((a, sub) => a + getGrade(sub.marks, sub.maxMarks).cgpa, 0) / s.subjects.length).toFixed(2)
        : 0;
      const avg = s.subjects.length
        ? (s.subjects.reduce((a, sub) => a + (sub.marks / sub.maxMarks) * 100, 0) / s.subjects.length).toFixed(1)
        : 0;
      return { "Roll No": s.rollNo, "Name": s.name, "Dept": s.department, "Subjects": s.subjects.length, "Avg %": avg, "Ccgpa": ccgpa };
    });
    const ws2 = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, ws2, "Summary");
    XLSX.writeFile(wb, `marks_report_${new Date().toISOString().slice(0,10)}.xlsx`);
    notify("Excel report downloaded!");
  };

  const printTranscript = () => {
    if (!student) return notify("Select a student", "error");
    const ccgpa = student.subjects.length
      ? (student.subjects.reduce((a, s) => a + getGrade(s.marks, s.maxMarks).cgpa, 0) / student.subjects.length).toFixed(2)
      : 0;
    const rows = student.subjects.map(s => {
      const g = getGrade(s.marks, s.maxMarks);
      return `<tr><td style="padding:8px;border:1px solid #e5e7eb">${s.courseName}</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${s.marks}/${s.maxMarks}</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${pct(s.marks,s.maxMarks)}%</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:center;font-weight:700;color:${g.cgpa>=6?"#15803d":g.cgpa>=5?"#854d0e":"#b91c1c"}">${g.grade}</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${g.cgpa}</td></tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><title>Transcript – ${student.name}</title></head><body style="font-family:Georgia,serif;padding:40px;max-width:700px;margin:auto">
      <div style="text-align:center;border-bottom:3px double #6C63FF;padding-bottom:20px;margin-bottom:24px">
        <h1 style="color:#6C63FF;margin:0;font-size:28px">ACADEMIC TRANSCRIPT</h1>
        <p style="margin:4px 0;color:#6B7280;font-size:14px">Academic Year 2024–25</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <tr><td style="padding:6px 0;color:#6B7280;width:140px">Student Name</td><td style="font-weight:700;font-size:18px">${student.name}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280">Roll Number</td><td>${student.rollNo}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280">Department</td><td>${student.department || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280">Semester</td><td>${student.semester || "—"}</td></tr>
      </table>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead><tr style="background:#6C63FF;color:#fff"><th style="padding:10px;border:1px solid #6C63FF">Course</th><th style="padding:10px;border:1px solid #6C63FF">Marks</th><th style="padding:10px;border:1px solid #6C63FF">%</th><th style="padding:10px;border:1px solid #6C63FF">Grade</th><th style="padding:10px;border:1px solid #6C63FF">cgpa</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:20px;padding:16px;background:#f3f4f6;border-radius:8px;display:flex;justify-content:space-between">
        <span><b>Ccgpa:</b> ${ccgpa} / 10</span>
        <span><b>Result:</b> ${Number(ccgpa) >= 5 ? "✅ PASS" : "❌ FAIL"}</span>
        <span><b>Subjects:</b> ${student.subjects.length}</span>
      </div>
      <div style="margin-top:40px;display:flex;justify-content:space-between;color:#6B7280;font-size:12px">
        <span>Generated: ${new Date().toLocaleDateString()}</span>
        <span>AcadMarks Portal</span>
        <div style="border-top:1px solid #374151;margin-top:24px;padding-top:4px;width:180px;text-align:center">Academic Head Signature</div>
      </div>
    </body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.print();
    notify("Transcript sent to printer");
  };

  const allGrades = data.students.flatMap(s => s.subjects.map(sub => getGrade(sub.marks, sub.maxMarks).grade));
  const gradeSummary = GRADE_RULES.map(r => ({ grade: r.grade, label: r.label, count: allGrades.filter(g => g === r.grade).length }));

  return (
    <div>
      <div style={styles.chartsRow}>
        <div style={styles.formCard}>
          <div style={styles.cardTitle}>📊 Export All Data</div>
          <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 16 }}>Download complete marks data for all students and courses as an Excel file with two sheets: detailed marks and summary.</p>
          <button style={styles.btn} onClick={exportAllExcel}>⬇ Download Excel Report</button>
        </div>
        <div style={styles.formCard}>
          <div style={styles.cardTitle}>📄 Individual Transcript</div>
          <label style={styles.label}>Select Student
            <select style={styles.input} value={selStudent} onChange={e => setSelStudent(e.target.value)}>
              <option value="">— Choose student —</option>
              {data.students.map(s => <option key={s.id} value={s.id}>{s.rollNo} — {s.name}</option>)}
            </select>
          </label>
          {student && (
            <div style={styles.infoNote}>
              {student.name} · {student.subjects.length} subjects ·&nbsp;
              Ccgpa: {student.subjects.length ? (student.subjects.reduce((a, s) => a + getGrade(s.marks, s.maxMarks).cgpa, 0) / student.subjects.length).toFixed(2) : "—"}
            </div>
          )}
          <button style={styles.btn} onClick={printTranscript}>🖨 Print / Save PDF Transcript</button>
        </div>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.cardTitle}>Grade Summary (All Students)</div>
        <table style={styles.table}>
          <thead><tr>{["Grade","Label","Count","% of Total"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
          <tbody>
            {gradeSummary.filter(g => g.count > 0).map(g => (
              <tr key={g.grade} style={styles.tr}>
                <td style={{ ...styles.td, fontWeight: 800, fontSize: 16 }}>{g.grade}</td>
                <td style={styles.td}>{g.label}</td>
                <td style={{ ...styles.td, fontWeight: 700, color: "#6C63FF" }}>{g.count}</td>
                <td style={styles.td}>{allGrades.length ? ((g.count / allGrades.length) * 100).toFixed(1) + "%" : "0%"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
