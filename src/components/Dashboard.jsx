import { isAtRisk } from "../utils/helpers";
import { EmptyState } from "./EmptyState";

/* ── Tiny bar-chart component ──────────────────────────────────── */
function DistBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="dist-bar-row">
      <span className="dist-label">{label}</span>
      <div className="dist-track">
        <div
          className="dist-fill"
          style={{ width: `${pct}%`, background: color, minWidth: count > 0 ? 28 : 0 }}
        >
          {pct > 10 ? `${pct}%` : ""}
        </div>
      </div>
      <span className="dist-count">{count}</span>
    </div>
  );
}

/* ── IA Analysis Card ──────────────────────────────────────────── */
function IAAnalysis({ title, field, students, maxMark = 25 }) {
  const vals = students
    .map(s => s[field] ?? null)
    .filter(v => v !== null && v !== undefined && v !== "");

  if (vals.length === 0) {
    return (
      <div className="card">
        <div className="card-title">{title}</div>
        <div className="empty">
          <div className="empty-icon">📭</div>
          <div>No {field.toUpperCase()} data yet</div>
        </div>
      </div>
    );
  }

  const total   = vals.length;
  const avg     = (vals.reduce((a, v) => a + v, 0) / total).toFixed(1);
  const highest = Math.max(...vals);
  const lowest  = Math.min(...vals);
  const passing = vals.filter(v => v >= 9).length;
  const passRate = Math.round((passing / total) * 100);

  // Buckets: <5 | 5–8 | 9–14 | 15–19 | 20–25
  const b0 = vals.filter(v => v < 5).length;
  const b1 = vals.filter(v => v >= 5  && v <= 8).length;
  const b2 = vals.filter(v => v >= 9  && v <= 14).length;
  const b3 = vals.filter(v => v >= 15 && v <= 19).length;
  const b4 = vals.filter(v => v >= 20).length;

  const isIA1 = field === "iaI";

  return (
    <div className="card">
      <div className="card-title">
        <span>{isIA1 ? "📝" : "📋"}</span>
        {title}
        <span style={{
          marginLeft: "auto", fontSize: 11, fontWeight: 700,
          color: passRate >= 75 ? "#22c55e" : passRate >= 50 ? "#f59e0b" : "#ef4444",
          background: passRate >= 75 ? "#f0fdf4" : passRate >= 50 ? "#fffbeb" : "#fff1f2",
          padding: "2px 8px", borderRadius: 99
        }}>
          {passRate}% pass
        </span>
      </div>

      {/* Stats row */}
      <div className="ia-stat-row">
        <div className="ia-stat">
          <div className="ia-stat-val" style={{ color: "#5b5ef4" }}>{avg}</div>
          <div className="ia-stat-lbl">Average</div>
        </div>
        <div className="ia-stat">
          <div className="ia-stat-val" style={{ color: "#22c55e" }}>{highest}</div>
          <div className="ia-stat-lbl">Highest</div>
        </div>
        <div className="ia-stat">
          <div className="ia-stat-val" style={{ color: "#ef4444" }}>{lowest}</div>
          <div className="ia-stat-lbl">Lowest</div>
        </div>
        <div className="ia-stat">
          <div className="ia-stat-val">{passing}/{total}</div>
          <div className="ia-stat-lbl">Passing</div>
        </div>
      </div>

      {/* Pass rate bar */}
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          fontSize: 11, color: "#8b90a7", marginBottom: 5, fontWeight: 600 }}>
          <span>Pass rate (≥ 9/{maxMark})</span>
          <span>{passing} passing · {total - passing} at risk</span>
        </div>
        <div className="stats-bar">
          <div className="stats-fill" style={{ width: `${passRate}%` }} />
        </div>
      </div>

      {/* Distribution */}
      <div style={{ fontSize: 11, color: "#8b90a7", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
        Score Distribution (out of {maxMark})
      </div>
      <DistBar label="< 5"    count={b0} total={total} color="#ef4444" />
      <DistBar label="5 – 8"  count={b1} total={total} color="#f59e0b" />
      <DistBar label="9 – 14" count={b2} total={total} color="#3b82f6" />
      <DistBar label="15–19"  count={b3} total={total} color="#22c55e" />
      <DistBar label="20–25"  count={b4} total={total} color="#5b5ef4" />
    </div>
  );
}

/* ── Dashboard ─────────────────────────────────────────────────── */
export function Dashboard({ data, semType }) {
  const { students } = data;

  const totalStudents = students.length;
  const atRiskCount   = students.filter(s => isAtRisk(s.iaI || 0, s.iaII || 0)).length;
  const passCount     = totalStudents - atRiskCount;

  const avgIAI = students.length
    ? (students.reduce((a, s) => a + (s.iaI  || 0), 0) / students.length).toFixed(1) : 0;
  const avgIAII = students.length
    ? (students.reduce((a, s) => a + (s.iaII || 0), 0) / students.length).toFixed(1) : 0;

  const topStudents = [...students]
    .map(s => ({ ...s, total: (s.iaI || 0) + (s.iaII || 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const passRate = totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0;

  const kpis = [
    { label: "Total Students", value: totalStudents, icon: "🎓", color: "#5b5ef4" },
    { label: "Avg IA-I",       value: `${avgIAI}/25`, icon: "📝", color: "#22c55e" },
    { label: "Avg IA-II",      value: `${avgIAII}/25`, icon: "📋", color: "#f59e0b" },
    { label: "At Risk",        value: atRiskCount, icon: "⚠️", color: "#ef4444" },
  ];

  const rankColors = ["#F7971E", "#9CA3AF", "#CD7C2F", "#E5E7EB", "#E5E7EB"];
  const rankText   = ["#fff", "#fff", "#fff", "#374151", "#374151"];

  return (
    <div>
      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="kpi-icon">{k.icon}</div>
            <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Pass vs Risk + Top Performers */}
      <div className="charts-row">
        {/* Pass vs At-Risk */}
        <div className="card">
          <div className="card-title">📊 Pass vs At-Risk</div>
          {students.length ? (
            <>
              <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "#22c55e", fontFamily: "var(--mono)", lineHeight: 1 }}>
                    {passCount}
                  </div>
                  <div style={{ fontSize: 12, color: "#8b90a7", marginTop: 4, fontWeight: 500 }}>Passing</div>
                  <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>IA ≥ 9</div>
                </div>
                <div style={{ width: 1, background: "var(--border-soft)" }} />
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "#f59e0b", fontFamily: "var(--mono)", lineHeight: 1 }}>
                    {atRiskCount}
                  </div>
                  <div style={{ fontSize: 12, color: "#8b90a7", marginTop: 4, fontWeight: 500 }}>At Risk</div>
                  <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>IA &lt; 9</div>
                </div>
              </div>

              {/* Visual bar */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  fontSize: 11, color: "#8b90a7", marginBottom: 5, fontWeight: 600 }}>
                  <span>Overall pass rate</span>
                  <span>{passRate}%</span>
                </div>
                <div className="stats-bar">
                  <div className="stats-fill" style={{ width: `${passRate}%` }} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between",
                fontSize: 11, color: "#8b90a7", marginTop: 12 }}>
                <span>🟢 {passCount} students passing</span>
                <span>⚠️ {atRiskCount} need attention</span>
              </div>
            </>
          ) : <div className="empty"><div className="empty-icon">📭</div><div>No students yet</div></div>}
        </div>

        {/* Top Performers */}
        <div className="card">
          <div className="card-title">🏆 Top Performers</div>
          {topStudents.length ? topStudents.map((s, i) => (
            <div key={s.id} className="top-row">
              <span className="rank" style={{ background: rankColors[i], color: rankText[i] }}>
                {i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-h)" }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-2)" }}>
                  IA-I: {s.iaI || 0} · IA-II: {s.iaII || 0}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, color: "#5b5ef4", fontWeight: 800, fontFamily: "var(--mono)" }}>
                  {s.total}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-2)" }}>/ 50</div>
              </div>
            </div>
          )) : <div className="empty"><div className="empty-icon">📭</div><div>No students yet</div></div>}
        </div>
      </div>

      {/* ── IA Analysis Section ── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "var(--text-2)",
          textTransform: "uppercase", letterSpacing: "0.8px",
          borderBottom: "1px solid var(--border-soft)",
          paddingBottom: 8, marginBottom: 16
        }}>
          Internal Assessment Analysis
        </div>
      </div>

      <div className="ia-analysis-grid">
        <IAAnalysis
          title="IA-I Marks Analysis"
          field="iaI"
          students={students}
          maxMark={25}
        />
        <IAAnalysis
          title="IA-II Marks Analysis"
          field="iaII"
          students={students}
          maxMark={25}
        />
      </div>
    </div>
  );
}
