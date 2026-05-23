import { useState } from "react";
import { styles } from "../utils/constants";
import { uid } from "../utils/helpers";
import { EmptyState } from "./EmptyState";

export function Students({ data, update, notify }) {
  const [form, setForm] = useState({ name: "", rollNo: "", department: "", semester: "" });
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const submit = () => {
    if (!form.name || !form.rollNo) return notify("Name and Roll No required", "error");
    update(d => {
      if (editing) {
        d.students = d.students.map(s => s.id === editing ? { ...s, ...form } : s);
        notify("Student updated");
      } else {
        d.students.push({ id: uid(), ...form, subjects: [] });
        notify("Student added");
      }
      return d;
    });
    setForm({ name: "", rollNo: "", department: "", semester: "" });
    setEditing(null);
  };

  const del = id => {
    update(d => { d.students = d.students.filter(s => s.id !== id); return d; });
    notify("Student removed");
  };

  const edit = s => {
    setForm({ name: s.name, rollNo: s.rollNo, department: s.department, semester: s.semester });
    setEditing(s.id);
  };

  const filtered = data.students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

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
        <button style={styles.btn} onClick={submit}>{editing ? "Update Student" : "Add Student"}</button>
        {editing && <button style={{ ...styles.btn, background: "#6B7280", marginTop: 8 }} onClick={() => { setEditing(null); setForm({ name: "", rollNo: "", department: "", semester: "" }); }}>Cancel</button>}
      </div>

      <div style={styles.tableCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={styles.cardTitle}>Students ({filtered.length})</div>
          <input style={{ ...styles.input, width: 200, marginBottom: 0 }} placeholder="🔍 Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {filtered.length ? (
          <table style={styles.table}>
            <thead><tr>{["Roll No","Name","Dept","Sem","Subjects","Avg%","Actions"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(s => {
                const avg = s.subjects.length ? (s.subjects.reduce((a, sub) => a + (sub.marks / sub.maxMarks) * 100, 0) / s.subjects.length).toFixed(1) : "—";
                return (
                  <tr key={s.id} style={styles.tr}>
                    <td style={styles.td}>{s.rollNo}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{s.name}</td>
                    <td style={styles.td}>{s.department || "—"}</td>
                    <td style={styles.td}>{s.semester || "—"}</td>
                    <td style={styles.td}>{s.subjects.length}</td>
                    <td style={{ ...styles.td, color: "#6C63FF", fontWeight: 700 }}>{avg}{avg !== "—" ? "%" : ""}</td>
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
