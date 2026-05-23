import { useState } from "react";
import { styles } from "../utils/constants";
import { uid } from "../utils/helpers";
import { EmptyState } from "./EmptyState";

export function Courses({ data, update, notify }) {
  const [form, setForm] = useState({ name: "", code: "", credits: "", maxMarks: "100" });
  const [editing, setEditing] = useState(null);

  const submit = () => {
    if (!form.name || !form.code) return notify("Name and Code required", "error");
    update(d => {
      if (editing) {
        d.courses = d.courses.map(c => c.id === editing ? { ...c, ...form } : c);
        notify("Course updated");
      } else {
        d.courses.push({ id: uid(), ...form });
        notify("Course added");
      }
      return d;
    });
    setForm({ name: "", code: "", credits: "", maxMarks: "100" });
    setEditing(null);
  };

  const del = id => {
    update(d => { d.courses = d.courses.filter(c => c.id !== id); return d; });
    notify("Course removed");
  };

  const edit = c => {
    setForm({ name: c.name, code: c.code, credits: c.credits, maxMarks: c.maxMarks });
    setEditing(c.id);
  };

  return (
    <div style={styles.twoCol}>
      <div style={styles.formCard}>
        <div style={styles.cardTitle}>{editing ? "✏️ Edit Course" : "➕ Add Course"}</div>
        {[["name","Course Name"],["code","Course Code"],["credits","Credits"],["maxMarks","Max Marks"]].map(([k, label]) => (
          <label key={k} style={styles.label}>
            {label}
            <input style={styles.input} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={label} />
          </label>
        ))}
        <button style={styles.btn} onClick={submit}>{editing ? "Update" : "Add Course"}</button>
        {editing && <button style={{ ...styles.btn, background: "#6B7280", marginTop: 8 }} onClick={() => { setEditing(null); setForm({ name: "", code: "", credits: "", maxMarks: "100" }); }}>Cancel</button>}
      </div>

      <div style={styles.tableCard}>
        <div style={styles.cardTitle}>Courses ({data.courses.length})</div>
        {data.courses.length ? (
          <table style={styles.table}>
            <thead><tr>{["Code","Name","Credits","Max Marks","Actions"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
            <tbody>
              {data.courses.map(c => (
                <tr key={c.id} style={styles.tr}>
                  <td style={{ ...styles.td, fontWeight: 700, color: "#6C63FF" }}>{c.code}</td>
                  <td style={styles.td}>{c.name}</td>
                  <td style={styles.td}>{c.credits || "—"}</td>
                  <td style={styles.td}>{c.maxMarks}</td>
                  <td style={styles.td}>
                    <button style={styles.iconBtn} onClick={() => edit(c)}>✏️</button>
                    <button style={{ ...styles.iconBtn, color: "#ef4444" }} onClick={() => del(c.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState msg="No courses yet" />}
      </div>
    </div>
  );
}
