import { useState } from "react";
import { uid, isAtRisk } from "../utils/helpers";
import { EmptyState } from "./EmptyState";

export function Students({ data, update, notify }) {
  const [form, setForm] = useState({
    name: "", rollNo: "", department: "", semester: "", iaI: "", iaII: ""
  });
  const [search, setSearch]   = useState("");
  const [editing, setEditing] = useState(null);

  const submit = () => {
    if (!form.name || !form.rollNo) return notify("Name and Roll No required", "error");
    const iaI  = Number(form.iaI  || 0);
    const iaII = Number(form.iaII || 0);
    if (iaI < 0 || iaI > 25 || iaII < 0 || iaII > 25)
      return notify("IA marks must be 0–25", "error");

    update(d => {
      if (editing) {
        d.students = d.students.map(s =>
          s.id === editing ? { ...s, ...form, iaI, iaII } : s
        );
        notify("Student updated");
      } else {
        d.students.push({
          id: uid(), name: form.name, rollNo: form.rollNo,
          department: form.department, semester: form.semester, iaI, iaII
        });
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
    setForm({
      name: s.name, rollNo: s.rollNo, department: s.department,
      semester: s.semester, iaI: s.iaI || "", iaII: s.iaII || ""
    });
    setEditing(s.id);
  };

  const filtered = data.students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  const atRiskStudents = filtered.filter(s => isAtRisk(s.iaI || 0, s.iaII || 0));

  const textFields = [
    ["name", "Full Name"], ["rollNo", "Roll Number"],
    ["department", "Department"], ["semester", "Semester"],
  ];
  const numFields = [
    ["iaI", "IA-I (out of 25)"], ["iaII", "IA-II (out of 25)"],
  ];

  return (
    <div className="two-col">
      {/* ── Add / Edit Form ── */}
      <div className="card" style={{ position: "sticky", top: 80 }}>
        <div className="card-title">
          {editing ? "✏️ Edit Student" : "➕ Add Student"}
        </div>

        {textFields.map(([k, label]) => (
          <label key={k} className="form-label">
            {label}
            <input
              className="form-input"
              value={form[k]}
              onChange={e => setForm({ ...form, [k]: e.target.value })}
              placeholder={label}
            />
          </label>
        ))}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {numFields.map(([k, label]) => (
            <label key={k} className="form-label">
              {label}
              <input
                className="form-input"
                type="number" min="0" max="25"
                value={form[k]}
                onChange={e => setForm({ ...form, [k]: e.target.value })}
                placeholder="0–25"
              />
            </label>
          ))}
        </div>

        <button className="btn btn-primary" style={{ width: "100%", marginTop: 4 }} onClick={submit}>
          {editing ? "✓ Update Student" : "➕ Add Student"}
        </button>

        {editing && (
          <button
            className="btn btn-secondary"
            style={{ width: "100%", marginTop: 8 }}
            onClick={() => {
              setEditing(null);
              setForm({ name: "", rollNo: "", department: "", semester: "", iaI: "", iaII: "" });
            }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 14 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>
            Students ({filtered.length})
          </div>
          <input
            className="form-input"
            style={{ width: 200, marginBottom: 0 }}
            placeholder="🔍 Search name / roll…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {atRiskStudents.length > 0 && (
          <div className="warn-box" style={{ marginBottom: 14 }}>
            <b>⚠️ {atRiskStudents.length} At-Risk Student(s) (IA &lt; 9)</b>
            {atRiskStudents.map(s => (
              <div key={s.id} style={{ fontSize: 12.5, marginTop: 5, display: "flex", gap: 8 }}>
                <span style={{ fontWeight: 700 }}>{s.name}</span>
                <span style={{ color: "#78350f" }}>({s.rollNo})</span>
                <span>IA-I: <b>{s.iaI || 0}</b></span>
                <span>IA-II: <b>{s.iaII || 0}</b></span>
              </div>
            ))}
          </div>
        )}

        {filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {["Roll No", "Name", "Dept", "Sem", "IA-I", "IA-II", "Total", "Status", "Actions"]
                    .map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const iaI   = s.iaI  || 0;
                  const iaII  = s.iaII || 0;
                  const total = iaI + iaII;
                  const isRisk = isAtRisk(iaI, iaII);
                  return (
                    <tr key={s.id} style={{ background: isRisk ? "#fffbeb" : "transparent" }}>
                      <td><code style={{ fontSize: 12, background: "var(--bg-2)",
                        padding: "2px 7px", borderRadius: 5 }}>{s.rollNo}</code></td>
                      <td style={{ fontWeight: 600, color: "var(--text-h)" }}>{s.name}</td>
                      <td>{s.department || "—"}</td>
                      <td>{s.semester   || "—"}</td>
                      <td>
                        <span style={{ fontWeight: 700,
                          color: iaI < 9 ? "#ef4444" : "var(--text-h)" }}>
                          {iaI}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700,
                          color: iaII < 9 ? "#ef4444" : "var(--text-h)" }}>
                          {iaII}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: "#5b5ef4",
                        fontFamily: "var(--mono)" }}>{total}</td>
                      <td>
                        <span className={isRisk ? "chip chip-risk" : "chip chip-pass"}>
                          {isRisk ? "⚠️ At Risk" : "✓ Pass"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => edit(s)}>✏️</button>
                          <button className="btn btn-danger btn-sm"
                            onClick={() => del(s.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState msg={search ? "No students match your search" : "No students added yet"} />
        )}
      </div>
    </div>
  );
}
