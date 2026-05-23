import { useState } from "react";
import { styles } from "../utils/constants";
import { uid, isAtRisk } from "../utils/helpers";
import { EmptyState } from "./EmptyState";

export function Students({ data, update, notify }) {
  const [form, setForm] = useState({ name: "", rollNo: "", department: "", semester: "", iaI: "", iaII: "" });
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const submit = () => {
    if (!form.name || !form.rollNo) return notify("Name and Roll No required", "error");
    const iaI = Number(form.iaI || 0);
    const iaII = Number(form.iaII || 0);
    if (iaI < 0 || iaI > 25 || iaII < 0 || iaII > 25) return notify("IA marks must be 0–25", "error");

    update(d => {
      if (editing) {
        d.students = d.students.map(s => s.id === editing ? { ...s, ...form, iaI, iaII } : s);
        notify("Student updated");
      } else {
        d.students.push({ id: uid(), name: form.name, rollNo: form.rollNo, department: form.department, semester: form.semester, iaI, iaII });
        notify("Student added");
      }
      return d;
    });
    setForm({ name: "", rollNo: "", department: "", semester: "", iaI: "", iaII: "" });
    setEditing(null);
  };

  const del = id => {
    update(d => { d.students = d.students.filter(s => s.id !== id); return d; });
    notify("Student removed");
  };

  const edit = s => {
    setForm({ name: s.name, rollNo: s.rollNo, department: s.department, semester: s.semester, iaI: s.iaI || "", iaII: s.iaII || "" });
    setEditing(s.id);
  };

  const filtered = data.students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  const atRiskStudents = filtered.filter(s => isAtRisk(s.iaI || 0, s.iaII || 0));

  return (
    <div style={styles.twoCol}>
      <div style={styles.formCard}>
        <div style={styles.cardTitle}>{editing ? "✏️ Edit Student" : "➕ Add Student"}</div>
        {[["name","Full Name"],["rollNo","Roll Number"],["department","Department"],["semester","Semester"]].map(([k, label]) => (
          <label key={k} style={styles.label}>
            {label}
            <input style={styles.input} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={label} />
          </label>
        ))}
        {[["iaI","IA-I (out of 25)"],["iaII","IA-II (out of 25)"]].map(([k, label]) => (
          <label key={k} style={styles.label}>
            {label}
            <input style={styles.input} type="number" min="0" max="25" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={label} />
          </label>
        ))}
        <button style={styles.btn} onClick={submit}>{editing ? "Update Student" : "Add Student"}</button>
        {editing && <button style={{ ...styles.btn, background: "#6B7280", marginTop: 8 }} onClick={() => { setEditing(null); setForm({ name: "", rollNo: "", department: "", semester: "", iaI: "", iaII: "" }); }}>Cancel</button>}
      </div>

      <div style={styles.tableCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={styles.cardTitle}>Students ({filtered.length})</div>
          <input style={{ ...styles.input, width: 200, marginBottom: 0 }} placeholder="🔍 Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {atRiskStudents.length > 0 && (
          <div style={{ ...styles.infoBox, background: "#FEF3C7", border: "1px solid #FCD34D", marginBottom: 16 }}>
            <b>⚠️ {atRiskStudents.length} At-Risk Student(s) (IA &lt; 9)</b>
            {atRiskStudents.map(s => (
              <div key={s.id} style={{ fontSize: 12, marginTop: 4 }}>
                {s.name} ({s.rollNo}) — IA-I: {s.iaI || 0}, IA-II: {s.iaII || 0}
              </div>
            ))}
          </div>
        )}

        {filtered.length ? (
          <table style={styles.table}>
            <thead><tr>{["Roll No","Name","Dept","Sem","IA-I","IA-II","Total","Status","Actions"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(s => {
                const iaI = s.iaI || 0;
                const iaII = s.iaII || 0;
                const total = iaI + iaII;
                const isRisk = isAtRisk(iaI, iaII);
                return (
                  <tr key={s.id} style={{ ...styles.tr, background: isRisk ? "#FEF3C7" : "transparent" }}>
                    <td style={styles.td}>{s.rollNo}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{s.name}</td>
                    <td style={styles.td}>{s.department || "—"}</td>
                    <td style={styles.td}>{s.semester || "—"}</td>
                    <td style={{ ...styles.td, fontWeight: 700 }}>{iaI}</td>
                    <td style={{ ...styles.td, fontWeight: 700 }}>{iaII}</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: "#6C63FF" }}>{total}</td>
                    <td style={{ ...styles.td, color: isRisk ? "#D97706" : "#22C55E", fontWeight: 700 }}>{isRisk ? "⚠️ At Risk" : "✓ Pass"}</td>
                    <td style={styles.td}>
                      <button style={styles.iconBtn} onClick={() => edit(s)}>✏️</button>
                      <button style={{ ...styles.iconBtn, color: "#ef4444" }} onClick={() => del(s.id)}>🗑</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <EmptyState msg="No students found" />}
      </div>
    </div>
  );
}
