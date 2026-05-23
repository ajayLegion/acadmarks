import * as XLSX from "xlsx";
import { isAtRisk } from "../utils/helpers";
import { EmptyState } from "./EmptyState";

export function Reports({ data, notify }) {
  const atRiskStudents = data.students.filter(s => isAtRisk(s.iaI || 0, s.iaII || 0));

  const exportAtRiskExcel = () => {
    if (!atRiskStudents.length) return notify("No at-risk students to export", "error");
    const rows = atRiskStudents.map(s => ({
      "Roll No":      s.rollNo,
      "Student Name": s.name,
      "Department":   s.department || "—",
      "Semester":     s.semester   || "—",
      "IA-I":         s.iaI  || 0,
      "IA-II":        s.iaII || 0,
      "Total":        (s.iaI || 0) + (s.iaII || 0),
      "Status":       "At Risk",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "At-Risk Students");
    XLSX.writeFile(wb, `at_risk_students_${new Date().toISOString().slice(0, 10)}.xlsx`);
    notify("At-risk report downloaded!");
  };

  const exportAllExcel = () => {
    const rows = data.students.map(s => ({
      "Roll No":      s.rollNo,
      "Student Name": s.name,
      "Department":   s.department || "—",
      "Semester":     s.semester   || "—",
      "IA-I":         s.iaI  || 0,
      "IA-II":        s.iaII || 0,
      "Total":        (s.iaI || 0) + (s.iaII || 0),
      "Status":       isAtRisk(s.iaI || 0, s.iaII || 0) ? "At Risk" : "Pass",
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
      {/* Export buttons */}
      <div className="charts-row" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">📊 Export All Students</div>
          <p style={{ color: "var(--text-2)", fontSize: 13.5, marginBottom: 16 }}>
            Download complete IA marks data for all students with pass / at-risk status.
          </p>
          <button className="btn btn-primary" style={{ width: "100%" }}
            onClick={exportAllExcel}>
            ⬇ Download Full Report
          </button>
        </div>

        <div className="card">
          <div className="card-title">⚠️ Export At-Risk Students</div>
          <p style={{ color: "var(--text-2)", fontSize: 13.5, marginBottom: 16 }}>
            Download only students with IA marks less than 9.
          </p>
          <button className="btn btn-primary" style={{ width: "100%" }}
            onClick={exportAtRiskExcel}>
            ⬇ Download At-Risk Report
          </button>
        </div>
      </div>

      {/* At-risk table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">
          ⚠️ At-Risk Students (IA &lt; 9)
          <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700,
            color: "#f59e0b", background: "#fffbeb",
            padding: "2px 10px", borderRadius: 99 }}>
            {atRiskStudents.length} students
          </span>
        </div>
        {atRiskStudents.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {["Roll No", "Name", "Dept", "Sem", "IA-I", "IA-II", "Total"].map(h =>
                    <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {atRiskStudents.map(s => (
                  <tr key={s.id} style={{ background: "#fffbeb" }}>
                    <td><code style={{ fontSize: 12, background: "#fef3c7",
                      padding: "2px 7px", borderRadius: 5 }}>{s.rollNo}</code></td>
                    <td style={{ fontWeight: 600, color: "var(--text-h)" }}>{s.name}</td>
                    <td>{s.department || "—"}</td>
                    <td>{s.semester   || "—"}</td>
                    <td style={{ fontWeight: 700, color: "#d97706" }}>{s.iaI  || 0}</td>
                    <td style={{ fontWeight: 700, color: "#d97706" }}>{s.iaII || 0}</td>
                    <td style={{ fontWeight: 800, color: "#f59e0b",
                      fontFamily: "var(--mono)" }}>
                      {(s.iaI || 0) + (s.iaII || 0)}/50
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState msg="No at-risk students! All students have IA ≥ 9 🎉" />
        )}
      </div>

      {/* All students summary */}
      <div className="card">
        <div className="card-title">✓ All Students Summary</div>
        {data.students.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {["Roll No", "Name", "Dept", "Sem", "IA-I", "IA-II", "Total", "Status"].map(h =>
                    <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.students.map(s => {
                  const risk = isAtRisk(s.iaI || 0, s.iaII || 0);
                  return (
                    <tr key={s.id} style={{ background: risk ? "#fffbeb" : "transparent" }}>
                      <td><code style={{ fontSize: 12, background: "var(--bg-2)",
                        padding: "2px 7px", borderRadius: 5 }}>{s.rollNo}</code></td>
                      <td style={{ fontWeight: 600, color: "var(--text-h)" }}>{s.name}</td>
                      <td>{s.department || "—"}</td>
                      <td>{s.semester   || "—"}</td>
                      <td style={{ fontWeight: 700,
                        color: (s.iaI||0) < 9 ? "#ef4444" : "var(--text-h)" }}>
                        {s.iaI || 0}
                      </td>
                      <td style={{ fontWeight: 700,
                        color: (s.iaII||0) < 9 ? "#ef4444" : "var(--text-h)" }}>
                        {s.iaII || 0}
                      </td>
                      <td style={{ fontWeight: 800, color: "#5b5ef4",
                        fontFamily: "var(--mono)" }}>
                        {(s.iaI || 0) + (s.iaII || 0)}/50
                      </td>
                      <td>
                        <span className={risk ? "chip chip-risk" : "chip chip-pass"}>
                          {risk ? "⚠️ At Risk" : "✓ Pass"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <EmptyState msg="No students yet" />}
      </div>
    </div>
  );
}
