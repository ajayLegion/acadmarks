import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { GRADE_RULES, COLORS, styles } from "../utils/constants";
import { getGrade, calccgpa } from "../utils/helpers";
import { EmptyState } from "./EmptyState";

export function Dashboard({ data }) {
  const { students, courses } = data;
  const allSubjects = students.flatMap(s => s.subjects);
  const passCount = allSubjects.filter(s => (s.marks / s.maxMarks) * 100 >= 40).length;
  const failCount = allSubjects.length - passCount;
  const avgPct = allSubjects.length
    ? (allSubjects.reduce((a, s) => a + (s.marks / s.maxMarks) * 100, 0) / allSubjects.length).toFixed(1)
    : 0;
  const cgpa = calccgpa(students);

  const gradeDist = GRADE_RULES.slice(0, -1).map(r => ({
    name: r.grade,
    count: allSubjects.filter(s => getGrade(s.marks, s.maxMarks).grade === r.grade).length,
  })).filter(g => g.count > 0);

  const courseAvg = courses.map(c => {
    const subs = students.flatMap(s => s.subjects.filter(sub => sub.courseId === c.id));
    const avg = subs.length ? (subs.reduce((a, s) => a + (s.marks / s.maxMarks) * 100, 0) / subs.length).toFixed(1) : 0;
    return { name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name, avg: Number(avg) };
  });

  const topStudents = [...students].map(s => {
    const avg = s.subjects.length
      ? s.subjects.reduce((a, sub) => a + (sub.marks / sub.maxMarks) * 100, 0) / s.subjects.length
      : 0;
    return { ...s, avg: avg.toFixed(1) };
  }).sort((a, b) => b.avg - a.avg).slice(0, 5);

  const kpis = [
    { label: "Total Students", value: students.length, icon: "🎓", color: "#6C63FF" },
    { label: "Total Courses",  value: courses.length,  icon: "📚", color: "#43C6AC" },
    { label: "Class Average",  value: avgPct + "%",    icon: "📈", color: "#F7971E" },
    { label: "cgpa (avg)",      value: cgpa,             icon: "⭐", color: "#FF6584" },
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
          <div style={styles.chartTitle}>Grade Distribution</div>
          {gradeDist.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={gradeDist} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {gradeDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState msg="No marks data yet" />}
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>Course-wise Avg %</div>
          {courseAvg.some(c => c.avg > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={courseAvg}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => v + "%"} />
                <Bar dataKey="avg" fill="#6C63FF" radius={[4, 4, 0, 0]}>
                  {courseAvg.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState msg="Add courses and marks first" />}
        </div>
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>Pass vs Fail</div>
          {allSubjects.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={[{ name: "Pass", value: passCount }, { name: "Fail", value: failCount }]}
                  dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  <Cell fill="#22c55e" /><Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState msg="No marks data yet" />}
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>🏆 Top Performers</div>
          {topStudents.length ? topStudents.map((s, i) => (
            <div key={s.id} style={styles.topRow}>
              <span style={{ ...styles.rank, background: i === 0 ? "#F7971E" : i === 1 ? "#9CA3AF" : i === 2 ? "#CD7C2F" : "#E5E7EB", color: i < 3 ? "#fff" : "#374151" }}>{i + 1}</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{s.name}</span>
              <span style={{ fontSize: 13, color: "#6C63FF", fontWeight: 700 }}>{s.avg}%</span>
            </div>
          )) : <EmptyState msg="No students yet" />}
        </div>
      </div>
    </div>
  );
}
