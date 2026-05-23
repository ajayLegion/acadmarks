import { useState } from "react";
import { IA_THRESHOLD } from "../utils/constants";
import {
    getCourseLoadStatus,
    getStudentCourses,
    isStudentAtRisk,
    uid,
} from "../utils/helpers";
import { EmptyState } from "./EmptyState";

export function Search({ data, update, notify, selClass, classes }) {
    const blank = {
        name: "",
        SRN: "",
        department: "",
        semester: "",
        classSection: "",
    };

    const [form, setForm] = useState(blank);
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState(null);

    const submit = () => {
        if (!form.name.trim() || !form.SRN.trim()) {
            return notify("Name and SRN required", "error");
        }

        update(d => {
            const duplicate = d.students.some(
                s =>
                    s.SRN?.toUpperCase() === form.SRN.trim().toUpperCase() &&
                    s.id !== editing
            );

            if (duplicate) {
                notify("SRN already exists", "error");
                return d;
            }

            const student = {
                ...form,
                name: form.name.trim(),
                SRN: form.SRN.trim().toUpperCase(),
            };

            if (editing) {
                d.students = d.students.map(s =>
                    s.id === editing
                        ? { ...s, ...student, courses: s.courses || [] }
                        : s
                );
                notify("Student updated");
            } else {
                d.students.push({
                    id: uid(),
                    ...student,
                    courses: [],
                    riskLevel: "SAFE",
                });
                notify("Student added");
            }

            return d;
        });

        setForm(blank);
        setEditing(null);
    };

    const del = id => {
        update(d => {
            d.students = d.students.filter(s => s.id !== id);
            return d;
        });

        notify("Student removed");
    };

    const edit = student => {
        setForm({
            name: student.name || "",
            SRN: student.SRN || "",
            department: student.department || "",
            semester: student.semester || "",
            classSection: student.classSection || "",
        });

        setEditing(student.id);
    };

    const filtered = data.students.filter(
        s =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.SRN.toLowerCase().includes(search.toLowerCase())
    );

    const atRiskList = filtered.filter(isStudentAtRisk);

    return (
        <div>
            <div className="two-col">
                <div className="card" style={{ position: "sticky", top: 80 }}>
                    <div className="card-title">
                        {editing ? "Edit Student" : "Add Student"}
                    </div>

                    <label className="form-label">
                        Class Section
                        <select
                            className="form-input"
                            value={form.classSection}
                            onChange={e =>
                                setForm({ ...form, classSection: e.target.value })
                            }
                        >
                            <option value="">Select class</option>

                            {classes.map(c => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </label>

                    {[
                        ["name", "Full Name"],
                        ["SRN", "SRN"],
                        ["department", "Department"],
                        ["semester", "Semester"],
                    ].map(([key, label]) => (
                        <label key={key} className="form-label">
                            {label}

                            <input
                                className="form-input"
                                value={form[key]}
                                onChange={e =>
                                    setForm({ ...form, [key]: e.target.value })
                                }
                                placeholder={label}
                            />
                        </label>
                    ))}

                    <button
                        className="btn btn-primary"
                        style={{ width: "100%" }}
                        onClick={submit}
                    >
                        {editing ? "Update Student" : "Add Student"}
                    </button>

                    {editing && (
                        <button
                            className="btn btn-secondary"
                            style={{ width: "100%", marginTop: 8 }}
                            onClick={() => {
                                setEditing(null);
                                setForm(blank);
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>

                <div className="card">
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 14,
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <div className="card-title" style={{ marginBottom: 0 }}>
                            Students

                            <span
                                style={{
                                    marginLeft: 8,
                                    fontSize: 12,
                                    color: "var(--text-2)",
                                    fontWeight: 400,
                                }}
                            >
                                ({filtered.length})
                            </span>
                        </div>

                        <input
                            className="form-input"
                            style={{ width: 220, marginBottom: 0 }}
                            placeholder="Search by Name or SRN"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {atRiskList.length > 0 && (
                        <div className="warn-box" style={{ marginBottom: 14 }}>
                            <b>{atRiskList.length} student(s) have at-risk IA marks</b>
                        </div>
                    )}

                    {filtered.length ? (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        {[
                                            "Class",
                                            "SRN",
                                            "Name",
                                            "Dept",
                                            "Sem",
                                            "Courses",
                                            "Low IA",
                                            "Load",
                                            "Actions",
                                        ].map(h => (
                                            <th key={h}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {filtered.map(student => {
                                        const courses = getStudentCourses(student);

                                        const lowIA = courses.filter(
                                            c =>
                                                c.iaI < IA_THRESHOLD ||
                                                c.iaII < IA_THRESHOLD
                                        ).length;

                                        const load = getCourseLoadStatus(student);

                                        const risk = lowIA > 0 || !load.ok;

                                        return (
                                            <tr
                                                key={student.id}
                                                style={{
                                                    background: risk
                                                        ? "#fffbeb"
                                                        : "transparent",
                                                }}
                                            >
                                                <td>{student.classSection || "-"}</td>

                                                <td>
                                                    <code>{student.SRN}</code>
                                                </td>

                                                <td
                                                    style={{
                                                        fontWeight: 600,
                                                        color: "var(--text-h)",
                                                    }}
                                                >
                                                    {student.name}
                                                </td>

                                                <td>{student.department || "-"}</td>

                                                <td>{student.semester || "-"}</td>

                                                <td style={{ fontWeight: 800 }}>
                                                    {courses.length}
                                                </td>

                                                <td
                                                    style={{
                                                        fontWeight: 800,
                                                        color: lowIA
                                                            ? "#ef4444"
                                                            : "#22c55e",
                                                    }}
                                                >
                                                    {lowIA}
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            load.ok
                                                                ? "chip chip-pass"
                                                                : "chip chip-risk"
                                                        }
                                                    >
                                                        {load.label}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: 5,
                                                        }}
                                                    >
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => edit(student)}
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => del(student.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState
                            msg={
                                search
                                    ? "No students match your search"
                                    : "No students found"
                            }
                        />
                    )}
                </div>
            </div>
        </div>
    );
}