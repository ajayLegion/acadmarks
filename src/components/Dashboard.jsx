import { IA_MAX, IA_THRESHOLD } from "../utils/constants";
import {
  average,
  flattenCourseRows,
  getStudentCourses,
  isStudentAtRisk,
} from "../utils/helpers";
import { EmptyState } from "./EmptyState";

/* ── helpers ───────────────────────────────────────────────────── */
function pct(n, total) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

/* ── mini bar ──────────────────────────────────────────────────── */
function DistBar({ label, count, total, color }) {
  const p = pct(count, total);
  return (
    <div className="dist-bar-row">
      <span className="dist-label">{label}</span>
      <div className="dist-track">
        <div className="dist-fill"
          style={{ width: `${p}%`, background: color, minWidth: count > 0 ? 28 : 0 }}>
          {p > 10 ? `${p}%` : ""}
        </div>
      </div>
      <span className="dist-count">{count}</span>
    </div>
  );
}

/* ── IA analysis for ONE IA (field = "iaI" | "iaII") ────────────── */
function IACard({ title, field, students }) {
  const vals = students
    .map(s => s[field])
    .filter(v => v !== null && v !== undefined && v !== "");

  if (!vals.length)
    return (
      <div className="card">
        <div className="card-title">{field === "iaI" ? "📝" : "📋"} {title}</div>
        <EmptyState msg={`No ${field.toUpperCase()} data yet`} />
      </div>
    );

  const total = vals.length;
  const avg = (vals.reduce((a, v) => a + v, 0) / total).toFixed(1);
  const highest = Math.max(...vals);
  const lowest = Math.min(...vals);
  const passing = vals.filter(v => v >= IA_THRESHOLD).length;
  const passRate = pct(passing, total);

  const buckets = [
    { label: "< 5", count: vals.filter(v => v < 5).length, color: "#ef4444" },
    { label: "5–8", count: vals.filter(v => v >= 5 && v < IA_THRESHOLD).length, color: "#f59e0b" },
    { label: "9–14", count: vals.filter(v => v >= IA_THRESHOLD && v <= 14).length, color: "#3b82f6" },
    { label: "15–19", count: vals.filter(v => v >= 15 && v <= 19).length, color: "#22c55e" },
    { label: "20–25", count: vals.filter(v => v >= 20).length, color: "#5b5ef4" },
  ];

  return (
    <div className="card">
      <div className="card-title">
        {field === "iaI" ? "📝" : "📋"} {title}
        <span style={{
          marginLeft: "auto", fontSize: 11, fontWeight: 700,
          color: passRate >= 75 ? "#22c55e" : passRate >= 50 ? "#f59e0b" : "#ef4444",
          background: passRate >= 75 ? "#f0fdf4" : passRate >= 50 ? "#fffbeb" : "#fff1f2",
          padding: "2px 8px", borderRadius: 99
        }}>
          {passRate}% pass
        </span>
      </div>

      <div className="ia-stat-row">
        {[["avg", avg, "#5b5ef4"], ["highest", highest, "#22c55e"],
        ["lowest", lowest, "#ef4444"], [`${passing}/${total}`, "passing", "var(--text-h)"]
        ].map(([val, lbl, col], i) => (
          <div key={i} className="ia-stat">
            <div className="ia-stat-val" style={{ color: i < 3 ? col : "var(--text-h)" }}>
              {val}
            </div>
            <div className="ia-stat-lbl">{i === 3 ? "Passing" : lbl}</div>
          </div>
        ))}
      </div>

      <div style={{ margin: "12px 0 10px" }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontSize: 11, color: "#8b90a7", marginBottom: 5, fontWeight: 600
        }}>
          <span>Pass rate (&gt;= {IA_THRESHOLD}/{IA_MAX})</span>
          <span>{passing} pass · {total - passing} risk</span>
        </div>
        <div className="stats-bar">
          <div className="stats-fill" style={{ width: `${passRate}%` }} />
        </div>
      </div>

      <div style={{
        fontSize: 11, color: "#8b90a7", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8
      }}>
        Distribution (out of {IA_MAX})
      </div>
      {buckets.map(b =>
        <DistBar key={b.label} {...b} total={total} />
      )}
    </div>
  );
}

/* ── per-class row in overview table ───────────────────────────── */
function ClassRow({ cls, students, onClick, selected }) {
  const total = students.length;
  const rows = flattenCourseRows(students);
  const risk = students.filter(isStudentAtRisk).length;
  const avgI = rows.length ? average(rows.map(row => row.iaI)).toFixed(1) : "—";
  const avgII = rows.length ? average(rows.map(row => row.iaII)).toFixed(1) : "—";
  const passR = pct(total - risk, total);

  return (
    <tr onClick={onClick} style={{
      cursor: "pointer",
      background: selected ? "var(--accent-bg)" : "transparent"
    }}>
      <td><span style={{
        fontWeight: 800, fontSize: 14,
        color: "var(--accent)"
      }}>{cls}</span></td>
      <td style={{ fontWeight: 600 }}>{total}</td>
      <td style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{avgI}</td>
      <td style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{avgII}</td>
      <td>
        <span style={{
          fontWeight: 700,
          color: risk > 0 ? "#f59e0b" : "#22c55e"
        }}>{risk}</span>
      </td>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="stats-bar" style={{ flex: 1, height: 6 }}>
            <div className="stats-fill" style={{ width: `${passR}%` }} />
          </div>
          <span style={{
            fontSize: 12, fontWeight: 700, color: "var(--text-2)",
            width: 34, textAlign: "right"
          }}>{passR}%</span>
        </div>
      </td>
    </tr>
  );
}

/* ══ Dashboard ════════════════════════════════════════════════════ */
export function Dashboard({ data, selClass, classes }) {
  const { students } = data;

  /* filter by class if one is selected */
  const viewStudents = selClass === "all"
    ? students
    : students.filter(s => s.classSection === selClass);

  const viewCourseRows = flattenCourseRows(viewStudents);
  const total = viewStudents.length;
  const atRisk = viewStudents.filter(isStudentAtRisk).length;
  const passCount = total - atRisk;
  const avgI = viewCourseRows.length ? average(viewCourseRows.map(row => row.iaI)).toFixed(1) : 0;
  const avgII = viewCourseRows.length ? average(viewCourseRows.map(row => row.iaII)).toFixed(1) : 0;

  const topStudents = [...viewStudents]
    .map(s => {
      const rows = getStudentCourses(s);
      const totalMarks = rows.reduce((sum, row) => sum + row.iaI + row.iaII, 0);
      return {
        ...s,
        courseCount: rows.length,
        total: totalMarks,
        avg: rows.length ? totalMarks / rows.length : 0,
      };
    })
    .filter(s => s.courseCount > 0)
    .sort((a, b) => b.avg - a.avg).slice(0, 5);

  const kpis = [
    { label: "Students", value: total, icon: "🎓", color: "#5b5ef4" },
    { label: "Avg IA-I", value: `${avgI}/${IA_MAX}`, icon: "📝", color: "#22c55e" },
    { label: "Avg IA-II", value: `${avgII}/${IA_MAX}`, icon: "📋", color: "#f59e0b" },
    { label: "At Risk", value: atRisk, icon: "⚠️", color: "#ef4444" },
  ];
  const rankBg = ["#F7971E", "#9CA3AF", "#CD7C2F", "#E5E7EB", "#E5E7EB"];
  const rankClr = ["#fff", "#fff", "#fff", "#374151", "#374151"];

  return (
    <div>
      {/* KPI */}
      <div className="kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card"
            style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="kpi-icon">{k.icon}</div>
            <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Pass/Risk + Top performers */}
      <div className="charts-row">
        <div className="card">
          <div className="card-title">📊 Pass vs At-Risk
            {selClass !== "all" && (
              <span style={{
                marginLeft: 6, fontSize: 11, background: "var(--accent-bg)",
                color: "var(--accent)", padding: "2px 8px", borderRadius: 99
              }}>
                Class {selClass}
              </span>
            )}
          </div>
          {total ? (
            <>
              <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
                {[
                  [passCount, "Passing", "#22c55e", `IA >= ${IA_THRESHOLD}`],
                  [atRisk, "At Risk", "#f59e0b", `IA < ${IA_THRESHOLD}`],
                ].map(([n, lbl, col, sub]) => (
                  <div key={lbl} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{
                      fontSize: 40, fontWeight: 900, color: col,
                      fontFamily: "var(--mono)", lineHeight: 1
                    }}>{n}</div>
                    <div style={{ fontSize: 12, color: "#8b90a7", marginTop: 4 }}>{lbl}</div>
                    <div style={{ fontSize: 12, color: col, fontWeight: 700 }}>{sub}</div>
                  </div>
                ))}
              </div>
              <div className="stats-bar">
                <div className="stats-fill" style={{ width: `${pct(passCount, total)}%` }} />
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 11, color: "#8b90a7", marginTop: 8
              }}>
                <span>🟢 {passCount} passing</span>
                <span>⚠️ {atRisk} need attention</span>
              </div>
            </>
          ) : <EmptyState msg="No students" />}
        </div>

        <div className="card">
          <div className="card-title">🏆 Top Performers</div>
          {topStudents.length ? topStudents.map((s, i) => (
            <div key={s.id} className="top-row">
              <span className="rank"
                style={{ background: rankBg[i], color: rankClr[i] }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 600, fontSize: 14,
                  color: "var(--text-h)"
                }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-2)" }}>
                  {s.classSection && <span style={{
                    marginRight: 6,
                    background: "var(--accent-bg)", color: "var(--accent)",
                    padding: "1px 6px", borderRadius: 4, fontSize: 10,
                    fontWeight: 700
                  }}>{s.classSection}</span>}
                  {s.courseCount} courses · Avg total: {s.avg.toFixed(1)}/{IA_MAX * 2}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontSize: 15, color: "#5b5ef4", fontWeight: 800,
                  fontFamily: "var(--mono)"
                }}>{s.total}</div>
                <div style={{ fontSize: 10, color: "var(--text-2)" }}>total</div>
              </div>
            </div>
          )) : <EmptyState msg="No students yet" />}
        </div>
      </div>

      {/* ── Class Overview table (only when "All" is selected) ── */}
      {selClass === "all" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">🏫 Class-wise Overview</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {["Class", "Students", "Avg IA-I", "Avg IA-II", "At Risk", "Pass Rate"].map(h =>
                    <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => {
                  const cs = students.filter(s => s.classSection === cls);
                  if (!cs.length) return (
                    <tr key={cls} style={{ opacity: 0.45 }}>
                      <td><span style={{ fontWeight: 800, color: "var(--accent)" }}>{cls}</span></td>
                      <td colSpan={5} style={{ color: "var(--text-2)", fontSize: 13 }}>No students assigned</td>
                    </tr>
                  );
                  return <ClassRow key={cls} cls={cls} students={cs} selected={false} onClick={() => { }} />;
                })}
                {/* Unassigned */}
                {(() => {
                  const unassigned = students.filter(s => !s.classSection || !classes.includes(s.classSection));
                  if (!unassigned.length) return null;
                  return <ClassRow key="—" cls="Unassigned" students={unassigned} selected={false} onClick={() => { }} />;
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── IA Analysis ─────────────────────────────────────────── */}
      <div style={{
        fontSize: 11, fontWeight: 700, color: "var(--text-2)",
        textTransform: "uppercase", letterSpacing: "0.8px",
        borderBottom: "1px solid var(--border-soft)",
        paddingBottom: 8, marginBottom: 16
      }}>
        Internal Assessment Analysis
        {selClass !== "all" && ` — Class ${selClass}`}
      </div>

      {selClass === "all" ? (
        /* Per-class grid: 2-col pairs of IA-I / IA-II */
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {classes.map(cls => {
            const cs = students.filter(s => s.classSection === cls);
            const rows = flattenCourseRows(cs);
            if (!cs.length) return null;
            return (
              <div key={cls}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: "var(--text-h)",
                  marginBottom: 10, display: "flex", alignItems: "center", gap: 8
                }}>
                  <span style={{
                    background: "var(--accent-bg)", color: "var(--accent)",
                    padding: "2px 12px", borderRadius: 6, fontWeight: 800
                  }}>
                    Class {cls}
                  </span>
                  <span style={{ color: "var(--text-2)", fontSize: 12 }}>
                    ({cs.length} students)
                  </span>
                </div>
                <div className="ia-analysis-grid">
                  <IACard title="IA-I Analysis" field="iaI" students={rows} />
                  <IACard title="IA-II Analysis" field="iaII" students={rows} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ia-analysis-grid">
          <IACard title={`IA-I — Class ${selClass}`} field="iaI" students={viewCourseRows} />
          <IACard title={`IA-II — Class ${selClass}`} field="iaII" students={viewCourseRows} />
        </div>
      )}
    </div>
  );
}
