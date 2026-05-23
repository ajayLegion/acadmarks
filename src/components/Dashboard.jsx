import { styles } from "../utils/constants";
import { isAtRisk } from "../utils/helpers";
import { EmptyState } from "./EmptyState";

export function Dashboard({ data }) {
  const { students } = data;

  const totalStudents = students.length;
  const atRiskCount = students.filter(s => isAtRisk(s.iaI || 0, s.iaII || 0)).length;
  const passCount = students.filter(s => !isAtRisk(s.iaI || 0, s.iaII || 0)).length;

  const avgIAI = students.length
    ? (students.reduce((a, s) => a + (s.iaI || 0), 0) / students.length).toFixed(1)
    : 0;
  const avgIAII = students.length
    ? (students.reduce((a, s) => a + (s.iaII || 0), 0) / students.length).toFixed(1)
    : 0;

  const topStudents = [...students]
    .map(s => ({ ...s, total: (s.iaI || 0) + (s.iaII || 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const kpis = [
    { label: "Total Students", value: totalStudents, icon: "🎓", color: "#6C63FF" },
    { label: "Avg IA-I", value: avgIAI + "/25", icon: "📝", color: "#43C6AC" },
    { label: "Avg IA-II", value: avgIAII + "/25", icon: "📝", color: "#F7971E" },
    { label: "At Risk", value: atRiskCount, icon: "⚠️", color: "#FF6584" },
  ];

  return (
    <div>
      <div style={styles.kpiGrid}>
        {kpis.map(k => (
          <div key={k.label} style={{ ...styles.kpiCard, borderTop: `4px solid ${k.color}` }}>
            <div style={styles.kpiIcon}>{k.icon}</div>
            <div style={{ ...styles.kpiValue, color: k.color }}>{k.value}</div>
            <div style={styles.kpiLabel}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>📊 Pass vs At-Risk</div>
          {students.length ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#22C55E" }}>{passCount}</div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>Students Pass</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#FF9800" }}>{atRiskCount}</div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>At Risk  (IA &lt; 9)</div>
              </div>
            </div>
          ) : <EmptyState msg="No students yet" />}
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>🏆 Top Performers</div>
          {topStudents.length ? topStudents.map((s, i) => (
            <div key={s.id} style={styles.topRow}>
              <span style={{ ...styles.rank, background: i === 0 ? "#F7971E" : i === 1 ? "#9CA3AF" : i === 2 ? "#CD7C2F" : "#E5E7EB", color: i < 3 ? "#fff" : "#374151" }}>{i + 1}</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{s.name}</span>
              <span style={{ fontSize: 13, color: "#6C63FF", fontWeight: 700 }}>{s.total}/50</span>
            </div>
          )) : <EmptyState msg="No students yet" />}
        </div>
      </div>
    </div>
  );
}
