import { useState } from "react";
import * as XLSX from "xlsx";
import { isAtRisk } from "../utils/helpers";
import { EmptyState } from "./EmptyState";

/* ── mini stat ──────────────────────────────────────────────────── */
function Stat({ label, value, color }) {
  return (
    <div className="ia-stat">
      <div className="ia-stat-val" style={{ color }}>{value}</div>
      <div className="ia-stat-lbl">{label}</div>
    </div>
  );
}

/* ── IA stats for a student list ───────────────────────────────── */
function IAStats({ students, field, label }) {
  const vals = students.map(s => s[field] || 0);
  if (!vals.length) return null;
  const total = vals.length;
  const avg = (vals.reduce((a, v) => a + v, 0) / total).toFixed(1);
  const highest = Math.max(...vals);
  const lowest = Math.min(...vals);
  const passing = vals.filter(v => v >= 9).length;
  const passRate = total > 0 ? Math.round(passing / total * 100) : 0;

  return (
    <div style={{
      background: "var(--bg-2)", borderRadius: 10, padding: "12px 14px",
      marginBottom: 10
    }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: "var(--text-2)",
        textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8
      }}>
        {label} Analysis
      </div>
      <div className="ia-stat-row" style={{ marginTop: 0 }}>
        <Stat label="Avg" value={avg} color="#5b5ef4" />
        <Stat label="Highest" value={highest} color="#22c55e" />
        <Stat label="Lowest" value={lowest} color="#ef4444" />
        <Stat label="Pass" value={`${passing}/${total}`} color="var(--text-h)" />
        <Stat label="Rate" value={`${passRate}%`} color={passRate >= 75 ? "#22c55e" : passRate >= 50 ? "#f59e0b" : "#ef4444"} />
      </div>
    </div>
  );
}

/* ── class report block ─────────────────────────────────────────── */
function ClassReport({ cls, students, onExport }) {
  const atRisk = students.filter(s => isAtRisk(s.iaI || 0, s.iaII || 0));
  const passing = students.filter(s => !isAtRisk(s.iaI || 0, s.iaII || 0));
  const passRate = students.length
    ? Math.round(passing.length / students.length * 100) : 0;

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            background: "linear-gradient(135deg,#5b5ef4,#818cf8)",
            color: "#fff", padding: "4px 14px", borderRadius: 8,
            fontWeight: 800, fontSize: 16
          }}>
            Class {cls}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-2)" }}>
            {students.length} students · {passRate}% passing
          </span>
          {atRisk.length > 0 && (
            <span className="chip chip-risk">
              ⚠️ {atRisk.length} at risk
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm"
            onClick={() => onExport(cls, students, "all")}>
            ⬇ Full Report
          </button>
          <button className="btn btn-danger btn-sm"
            onClick={() => onExport(cls, atRisk, "atrisk")}
            style={{ opacity: atRisk.length === 0 ? 0.45 : 1 }}>
            ⬇ At-Risk Only
          </button>
        </div>
      </div>

      {/* IA stats */}
      {students.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
          marginBottom: 12
        }}>
          <IAStats students={students} field="iaI" label="IA-I" />
          <IAStats students={students} field="iaII" label="IA-II" />
        </div>
      )}

      {/* Student table */}
      {students.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {["Roll No", "Name", "Dept", "Sem",
                  "IA-I", "IA-II", "Total", "Status"].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {students.map(s => {
                const iaI = s.iaI || 0;
                const iaII = s.iaII || 0;
                const total = iaI + iaII;
                const risk = isAtRisk(iaI, iaII);
                return (
                  <tr key={s.id}
                    style={{ background: risk ? "#fffbeb" : "transparent" }}>
                    <td><code style={{
                      fontSize: 12,
                      background: risk ? "#fef3c7" : "var(--bg-2)",
                      padding: "2px 7px", borderRadius: 5
                    }}>{s.rollNo}</code></td>
                    <td style={{ fontWeight: 600, color: "var(--text-h)" }}>{s.name}</td>
                    <td>{s.department || "—"}</td>
                    <td>{s.semester || "—"}</td>
                    <td style={{
                      fontWeight: 700,
                      color: iaI < 9 ? "#ef4444" : "var(--text-h)"
                    }}>{iaI}</td>
                    <td style={{
                      fontWeight: 700,
                      color: iaII < 9 ? "#ef4444" : "var(--text-h)"
                    }}>{iaII}</td>
                    <td style={{
                      fontWeight: 800, color: "#5b5ef4",
                      fontFamily: "var(--mono)"
                    }}>{total}/50</td>
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
      ) : <EmptyState msg={`No students in Class ${cls}`} />}
    </div>
  );
}

/* ══ Reports ══════════════════════════════════════════════════════ */
export function Reports({ data, notify, semType, selClass, classes }) {
  const [viewCls, setViewCls] = useState(selClass);
  const effectiveCls = selClass !== "all" ? selClass : viewCls;

  /* ── export helper ── */
  const exportXlsx = (cls, students, type) => {
    if (!students.length)
      return notify(`No ${type === "atrisk" ? "at-risk " : ""}students in Class ${cls}`, "error");

    const rows = students.map(s => ({
      "Class": s.classSection || cls,
      "Roll No": s.rollNo,
      "Student Name": s.name,
      "Department": s.department || "—",
      "Semester": s.semester || "—",
      "IA-I": s.iaI || 0,
      "IA-II": s.iaII || 0,
      "Total": (s.iaI || 0) + (s.iaII || 0),
      "Status": isAtRisk(s.iaI || 0, s.iaII || 0) ? "At Risk" : "Pass",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Class ${cls}`);
    const date = new Date().toISOString().slice(0, 10);
    const fname = type === "atrisk"
      ? `class_${cls}_at_risk_${date}.xlsx`
      : `class_${cls}_report_${date}.xlsx`;
    XLSX.writeFile(wb, fname);
    notify(`Class ${cls} report downloaded!`);
  };

  /* ── export ALL classes in one workbook ── */
  const exportAllClasses = () => {
    const wb = XLSX.utils.book_new();
    let any = false;
    classes.forEach(cls => {
      const cs = data.students.filter(s => s.classSection === cls);
      if (!cs.length) return;
      const rows = cs.map(s => ({
        "Class": s.classSection, "Roll No": s.rollNo, "Student Name": s.name,
        "Department": s.department || "—", "Semester": s.semester || "—",
        "IA-I": s.iaI || 0, "IA-II": s.iaII || 0,
        "Total": (s.iaI || 0) + (s.iaII || 0),
        "Status": isAtRisk(s.iaI || 0, s.iaII || 0) ? "At Risk" : "Pass",
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), cls);
      any = true;
    });
    if (!any) return notify("No data to export", "error");
    XLSX.writeFile(wb, `all_classes_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    notify("All-classes workbook downloaded! (one sheet per class)");
  };

  /* decide which classes to show */
  const classesToShow = effectiveCls === "all"
    ? classes
    : [effectiveCls];

  return (
    <div>
      {/* Class tabs */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap",
        alignItems: "center"
      }}>
        {["all", ...classes].map(cls => (
          <button key={cls} onClick={() => setViewCls(cls)} style={{
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700,
            background: effectiveCls === cls
              ? "linear-gradient(135deg,#5b5ef4,#818cf8)"
              : "var(--bg-3)",
            color: effectiveCls === cls ? "#fff" : "var(--text-2)",
            transition: "all 0.15s",
          }}>
            {cls === "all" ? "All Classes" : cls}
            <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.8 }}>
              ({cls === "all"
                ? data.students.length
                : data.students.filter(s => s.classSection === cls).length})
            </span>
          </button>
        ))}

        {effectiveCls === "all" && (
          <button className="btn btn-primary btn-sm"
            style={{ marginLeft: "auto" }}
            onClick={exportAllClasses}>
            ⬇ Export All (Multi-Sheet)
          </button>
        )}
      </div>

      {/* Per-class reports */}
      {classesToShow.map(cls => {
        const cs = data.students.filter(s => s.classSection === cls);
        return (
          <ClassReport key={cls} cls={cls} students={cs}
            onExport={exportXlsx} />
        );
      })}

      {/* Unassigned students (shown only in "All" view) */}
      {effectiveCls === "all" && (() => {
        const unassigned = data.students.filter(
          s => !s.classSection || !classes.includes(s.classSection)
        );
        if (!unassigned.length) return null;
        return (
          <div className="card" style={{ borderLeft: "3px solid var(--warning)" }}>
            <div className="card-title">⚠️ Unassigned Students
              <span style={{
                marginLeft: 8, fontSize: 12, color: "var(--text-2)",
                fontWeight: 400
              }}>({unassigned.length})</span>
            </div>
            <p style={{ color: "var(--text-2)", fontSize: 13.5, marginBottom: 12 }}>
              These students don't have a class section assigned. Edit them in Students tab.
            </p>
            <div className="table-wrap">
              <table>
                <thead><tr>
                  {["Roll No", "Name", "Dept", "IA-I", "IA-II", "Total"].map(h =>
                    <th key={h}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {unassigned.map(s => (
                    <tr key={s.id}>
                      <td><code style={{
                        fontSize: 12, background: "var(--bg-2)",
                        padding: "2px 7px", borderRadius: 5
                      }}>{s.rollNo}</code></td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.department || "—"}</td>
                      <td style={{ fontWeight: 700 }}>{s.iaI || 0}</td>
                      <td style={{ fontWeight: 700 }}>{s.iaII || 0}</td>
                      <td style={{
                        fontWeight: 800, color: "#5b5ef4",
                        fontFamily: "var(--mono)"
                      }}>
                        {(s.iaI || 0) + (s.iaII || 0)}/50
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}