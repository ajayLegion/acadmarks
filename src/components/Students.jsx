import { useState } from "react";
import { uid, isAtRisk } from "../utils/helpers";
import { EmptyState } from "./EmptyState";

export function Students({ data, update, notify, semType, selClass, classes }) {
  const blank = {
    name: "", rollNo: "", department: "", semester: "",
    classSection: "", iaI: "", iaII: ""
  };
  const [form, setForm] = useState(blank);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [viewCls, setViewCls] = useState(selClass); // local class tab

  /* sync when parent selClass changes */
  const effectiveCls = selClass !== "all" ? selClass : viewCls;

  const submit = () => {
    if (!form.name || !form.rollNo)
      return notify("Name and Roll No required", "error");
    const iaI = Number(form.iaI || 0);
    const iaII = Number(form.iaII || 0);
    if (iaI < 0 || iaI > 25 || iaII < 0 || iaII > 25)
      return notify("IA marks must be 0–25", "error");

    update(d => {
      if (editing) {
        d.students = d.students.map(s =>
          s.id === editing ? { ...s, ...form, iaI, iaII } : s);
        notify("Student updated");
      } else {
        d.students.push({
          id: uid(), name: form.name, rollNo: form.rollNo,
          department: form.department, semester: form.semester,
          classSection: form.classSection, iaI, iaII
        });
        notify("Student added");
      }
      return d;
    });
    setForm(blank);
    setEditing(null);
  };

  const del = id => {
    update(d => { d.students = d.students.filter(s => s.id !== id); return d; });
    notify("Student removed");
  };

  const edit = s => {
    setForm({
      name: s.name, rollNo: s.rollNo, department: s.department,
      semester: s.semester, classSection: s.classSection || "", iaI: s.iaI || "", iaII: s.iaII || ""
    });
    setEditing(s.id);
  };

  /* filter */
  const byClass = effectiveCls === "all"
    ? data.students
    : data.students.filter(s => s.classSection === effectiveCls);

  const filtered = byClass.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  const atRiskList = filtered.filter(s => isAtRisk(s.iaI || 0, s.iaII || 0));

  return (
    <div>
      {/* Class tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {["all", ...classes].map(cls => (
          <button key={cls}
            onClick={() => setViewCls(cls)}
            style={{
              padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700,
              background: effectiveCls === cls
                ? "linear-gradient(135deg,#5b5ef4,#818cf8)"
                : "var(--bg-3)",
              color: effectiveCls === cls ? "#fff" : "var(--text-2)",
              transition: "all 0.15s",
            }}>
            {cls === "all" ? "All Classes" : cls}
            <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>
              ({cls === "all"
                ? data.students.length
                : data.students.filter(s => s.classSection === cls).length})
            </span>
          </button>
        ))}
      </div>

      <div className="two-col">
        {/* Form */}
        <div className="card" style={{ position: "sticky", top: 80 }}>
          <div className="card-title">
            {editing ? "✏️ Edit Student" : "➕ Add Student"}
          </div>

          {/* Class section selector */}
          <label className="form-label">
            Class Section
            <select className="form-input"
              value={form.classSection}
              onChange={e => setForm({ ...form, classSection: e.target.value })}>
              <option value="">— Select class —</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          {[["name", "Full Name"], ["rollNo", "Roll Number"],
          ["department", "Department"], ["semester", "Semester"]].map(([k, label]) => (
            <label key={k} className="form-label">
              {label}
              <input className="form-input" value={form[k]}
                onChange={e => setForm({ ...form, [k]: e.target.value })}
                placeholder={label} />
            </label>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["iaI", "IA-I (0–25)"], ["iaII", "IA-II (0–25)"]].map(([k, label]) => (
              <label key={k} className="form-label">
                {label}
                <input className="form-input" type="number" min="0" max="25"
                  value={form[k]}
                  onChange={e => setForm({ ...form, [k]: e.target.value })}
                  placeholder="0–25" />
              </label>
            ))}
          </div>

          <button className="btn btn-primary" style={{ width: "100%", marginTop: 4 }}
            onClick={submit}>
            {editing ? "✓ Update Student" : "➕ Add Student"}
          </button>
          {editing && (
            <button className="btn btn-secondary"
              style={{ width: "100%", marginTop: 8 }}
              onClick={() => { setEditing(null); setForm(blank); }}>
              Cancel
            </button>
          )}
        </div>

        {/* Table */}
        <div className="card">
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 14
          }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              {effectiveCls === "all" ? "All Students" : `Class ${effectiveCls}`}
              <span style={{
                marginLeft: 8, fontSize: 12, color: "var(--text-2)",
                fontWeight: 400
              }}>({filtered.length})</span>
            </div>
            <input className="form-input" style={{ width: 200, marginBottom: 0 }}
              placeholder="🔍 Search…" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>

          {atRiskList.length > 0 && (
            <div className="warn-box" style={{ marginBottom: 14 }}>
              <b>⚠️ {atRiskList.length} At-Risk Student(s) (IA &lt; 9)</b>
              {atRiskList.map(s => (
                <div key={s.id} style={{ fontSize: 12.5, marginTop: 5, display: "flex", gap: 8 }}>
                  {s.classSection &&
                    <span style={{
                      background: "#fcd34d", color: "#78350f",
                      padding: "1px 6px", borderRadius: 4, fontWeight: 700,
                      fontSize: 11
                    }}>{s.classSection}</span>}
                  <span style={{ fontWeight: 700 }}>{s.name}</span>
                  <span style={{ color: "#78350f" }}>({s.rollNo})</span>
                  <span>IA-I:<b>{s.iaI || 0}</b></span>
                  <span>IA-II:<b>{s.iaII || 0}</b></span>
                </div>
              ))}
            </div>
          )}

          {filtered.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {["Class", "Roll No", "Name", "Dept", "Sem",
                      "IA-I", "IA-II", "Total", "Status", "Actions"].map(h =>
                        <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const iaI = s.iaI || 0;
                    const iaII = s.iaII || 0;
                    const total = iaI + iaII;
                    const isRisk = isAtRisk(iaI, iaII);
                    return (
                      <tr key={s.id}
                        style={{ background: isRisk ? "#fffbeb" : "transparent" }}>
                        <td>
                          {s.classSection
                            ? <span style={{
                              background: "var(--accent-bg)",
                              color: "var(--accent)", padding: "2px 8px",
                              borderRadius: 5, fontWeight: 800, fontSize: 12
                            }}>
                              {s.classSection}
                            </span>
                            : <span style={{ color: "var(--text-2)" }}>—</span>}
                        </td>
                        <td><code style={{
                          fontSize: 12, background: "var(--bg-2)",
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
                        }}>{total}</td>
                        <td>
                          <span className={isRisk ? "chip chip-risk" : "chip chip-pass"}>
                            {isRisk ? "⚠️ At Risk" : "✓ Pass"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 5 }}>
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
            <EmptyState msg={search
              ? "No students match your search"
              : `No students in ${effectiveCls === "all" ? "any class" : `Class ${effectiveCls}`}`} />
          )}
        </div>
      </div>
    </div>
  );
}