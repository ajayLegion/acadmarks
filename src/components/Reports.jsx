import { useState } from "react";
import * as XLSX from "xlsx";
import { styles } from "../utils/constants";
import { isAtRisk } from "../utils/helpers";
import { EmptyState } from "./EmptyState";

export function Reports({ data, notify }) {
  const atRiskStudents = data.students.filter(s => isAtRisk(s.iaI || 0, s.iaII || 0));

  const exportAtRiskExcel = () => {
    if (!atRiskStudents.length) return notify("No at-risk students to export", "error");
    const rows = atRiskStudents.map(s => ({
      "Roll No": s.rollNo,
      "Student Name": s.name,
      "Department": s.department || "—",
      "Semester": s.semester || "—",
      "IA-I": s.iaI || 0,
      "IA-II": s.iaII || 0,
      "Total": (s.iaI || 0) + (s.iaII || 0),
      "Status": "At Risk",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "At-Risk Students");
    XLSX.writeFile(wb, `at_risk_students_${new Date().toISOString().slice(0, 10)}.xlsx`);
    notify("At-risk report downloaded!");
  };

  const exportAllExcel = () => {
    const rows = data.students.map(s => ({
      "Roll No": s.rollNo,
      "Student Name": s.name,
      "Department": s.department || "—",
      "Semester": s.semester || "—",
      "IA-I": s.iaI || 0,
      "IA-II": s.iaII || 0,
      "Total": (s.iaI || 0) + (s.iaII || 0),
      "Status": isAtRisk(s.iaI || 0, s.iaII || 0) ? "At Risk" : "Pass",
    }));

    if (!rows.length) return notify("No data to export", "error");
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Students");
    XLSX.writeFile(wb, `ia_marks_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    notify("Full report downloaded!");
  };

  return (
    <div>
      <div style={styles.chartsRow}>
        <div style={styles.formCard}>
          <div style={styles.cardTitle}>📊 Export All Students</div>
          <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 16 }}>Download complete IA marks data for all students with pass/at-risk status.</p>
          <button style={styles.btn} onClick={exportAllExcel}>⬇ Download Full Report</button>
        </div>
        <div style={styles.formCard}>
          <div style={styles.cardTitle}>⚠️ Export At-Risk Students</div>
          <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 16 }}>Download only students with IA marks less than 9.</p>
          <button style={styles.btn} onClick={exportAtRiskExcel}>⬇ Download At-Risk Report</button>
        </div>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.cardTitle}>
          ⚠️ At-Risk Students (IA &lt; 9)
        </div>
        {atRiskStudents.length ? (
          <table style={styles.table}>
            <thead><tr>{["Roll No", "Name", "Dept", "Sem", "IA-I", "IA-II", "Total"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
            <tbody>
              {atRiskStudents.map(s => (
                <tr key={s.id} style={{ ...styles.tr, background: "#FEF3C7" }}>
                  <td style={styles.td}>{s.rollNo}</td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{s.name}</td>
                  <td style={styles.td}>{s.department || "—"}</td>
                  <td style={styles.td}>{s.semester || "—"}</td>
                  <td style={{ ...styles.td, fontWeight: 700, color: "#D97706" }}>{s.iaI || 0}</td>
                  <td style={{ ...styles.td, fontWeight: 700, color: "#D97706" }}>{s.iaII || 0}</td>
                  <td style={{ ...styles.td, fontWeight: 700, color: "#FF9800" }}>{(s.iaI || 0) + (s.iaII || 0)}/50</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState msg="No at-risk students! All students have IA ≥ 9" />}
      </div>

      <div style={styles.tableCard}>
        <div style={styles.cardTitle}>✓ All Students Summary</div>
        {data.students.length ? (
          <table style={styles.table}>
            <thead><tr>{["Roll No", "Name", "Dept", "Sem", "IA-I", "IA-II", "Total", "Status"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
            <tbody>
              {data.students.map(s => {
                const status = isAtRisk(s.iaI || 0, s.iaII || 0);
                return (
                  <tr key={s.id} style={{ ...styles.tr, background: status ? "#FEF3C7" : "transparent" }}>
                    <td style={styles.td}>{s.rollNo}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{s.name}</td>
                    <td style={styles.td}>{s.department || "—"}</td>
                    <td style={styles.td}>{s.semester || "—"}</td>
                    <td style={{ ...styles.td, fontWeight: 700 }}>{s.iaI || 0}</td>
                    <td style={{ ...styles.td, fontWeight: 700 }}>{s.iaII || 0}</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: "#6C63FF" }}>{(s.iaI || 0) + (s.iaII || 0)}/50</td>
                    <td style={{ ...styles.td, color: status ? "#D97706" : "#22C55E", fontWeight: 700 }}>{status ? "⚠️ At Risk" : "✓ Pass"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <EmptyState msg="No students yet" />}
      </div>
    </div>
  );
}
