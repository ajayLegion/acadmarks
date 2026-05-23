import { useMemo, useState } from "react";
import {
  MAX_SEMESTER_COURSES,
  MIN_SEMESTER_COURSES,
} from "../utils/constants";
import { getStudentCourses, uid } from "../utils/helpers";
import { EmptyState } from "./EmptyState";

const blank = {
  name: "",
  code: "",
  semester: "",
  credits: "",
  type: "Core",
};

export function Courses({ data, update, notify }) {
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);

  const grouped = useMemo(() => {
    return data.courses.reduce((acc, course) => {
      const sem = course.semester || "Unassigned";
      acc[sem] = acc[sem] || [];
      acc[sem].push(course);
      return acc;
    }, {});
  }, [data.courses]);

  const studentLoadRows = useMemo(() => {
    return data.students.map(student => ({
      id: student.id,
      name: student.name,
      SRN: student.SRN,
      classSection: student.classSection,
      semester: student.semester,
      count: getStudentCourses(student).length,
    }));
  }, [data.students]);

  const submit = () => {
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();

    if (!name || !code) return notify("Course name and code required", "error");

    update(d => {
      const duplicate = d.courses.some(
        c => c.code?.toUpperCase() === code && c.id !== editing
      );

      if (duplicate) {
        notify("Course code already exists", "error");
        return d;
      }

      const course = {
        ...form,
        name,
        code,
        semester: String(form.semester || "").trim(),
      };

      if (editing) {
        d.courses = d.courses.map(c => (c.id === editing ? { ...c, ...course } : c));
        notify("Course updated");
      } else {
        d.courses.push({ id: uid(), ...course });
        notify("Course added");
      }

      return d;
    });

    setForm(blank);
    setEditing(null);
  };

  const del = id => {
    update(d => {
      d.courses = d.courses.filter(c => c.id !== id);
      return d;
    });
    notify("Course removed");
  };

  const edit = course => {
    setForm({
      name: course.name || "",
      code: course.code || "",
      semester: course.semester || "",
      credits: course.credits || "",
      type: course.type || "Core",
    });
    setEditing(course.id);
  };

  return (
    <div>
      <div className="info-box">
        Each student should have {MIN_SEMESTER_COURSES}-{MAX_SEMESTER_COURSES} selected
        courses per semester. Keep elective subjects in the catalog, but enter marks only
        for the elective each student actually studies.
      </div>

      <div className="two-col">
        <div className="card" style={{ position: "sticky", top: 80 }}>
          <div className="card-title">{editing ? "Edit Course" : "Add Course"}</div>

          <label className="form-label">
            Course Code
            <input
              className="form-input"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              placeholder="EE401"
            />
          </label>

          <label className="form-label">
            Course Name
            <input
              className="form-input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Electrical Machines"
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label className="form-label">
              Semester
              <input
                className="form-input"
                value={form.semester}
                onChange={e => setForm({ ...form, semester: e.target.value })}
                placeholder="4"
              />
            </label>

            <label className="form-label">
              Credits
              <input
                className="form-input"
                value={form.credits}
                onChange={e => setForm({ ...form, credits: e.target.value })}
                placeholder="3"
              />
            </label>
          </div>

          <label className="form-label">
            Course Type
            <select
              className="form-input"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
            >
              <option value="Core">Core</option>
              <option value="Elective">Elective</option>
              <option value="Lab">Lab</option>
            </select>
          </label>

          <button className="btn btn-primary" style={{ width: "100%" }} onClick={submit}>
            {editing ? "Update Course" : "Add Course"}
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

        <div>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-title">Course Catalog ({data.courses.length})</div>

            {data.courses.length ? (
              Object.entries(grouped)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([semester, courses]) => {
                  const coreCount = courses.filter(c => (c.type || "Core") !== "Elective").length;
                  const validCore =
                    coreCount >= MIN_SEMESTER_COURSES && coreCount <= MAX_SEMESTER_COURSES;

                  return (
                    <div key={semester} style={{ marginBottom: 18 }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                        fontWeight: 800,
                      }}>
                        Semester {semester}
                        <span className={validCore ? "chip chip-pass" : "chip chip-risk"}>
                          {coreCount} non-elective courses
                        </span>
                      </div>

                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              {["Code", "Name", "Type", "Credits", "Actions"].map(h => (
                                <th key={h}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {courses.map(course => (
                              <tr key={course.id}>
                                <td><code>{course.code}</code></td>
                                <td style={{ fontWeight: 600 }}>{course.name}</td>
                                <td>
                                  <span className={course.type === "Elective" ? "chip chip-risk" : "chip chip-pass"}>
                                    {course.type || "Core"}
                                  </span>
                                </td>
                                <td>{course.credits || "-"}</td>
                                <td>
                                  <div style={{ display: "flex", gap: 5 }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => edit(course)}>
                                      Edit
                                    </button>
                                    <button className="btn btn-danger btn-sm" onClick={() => del(course.id)}>
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
            ) : (
              <EmptyState msg="No courses added yet" />
            )}
          </div>

          <div className="card">
            <div className="card-title">Student Course Load Check</div>
            {studentLoadRows.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {["Class", "SRN", "Name", "Sem", "Selected Courses", "Status"].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {studentLoadRows.map(row => {
                      const ok =
                        row.count >= MIN_SEMESTER_COURSES &&
                        row.count <= MAX_SEMESTER_COURSES;
                      return (
                        <tr key={row.id} style={{ background: ok ? "transparent" : "#fffbeb" }}>
                          <td>{row.classSection || "-"}</td>
                          <td><code>{row.SRN}</code></td>
                          <td style={{ fontWeight: 600 }}>{row.name}</td>
                          <td>{row.semester || "-"}</td>
                          <td style={{ fontWeight: 800 }}>{row.count}</td>
                          <td>
                            <span className={ok ? "chip chip-pass" : "chip chip-risk"}>
                              {ok ? "Valid" : `Needs ${MIN_SEMESTER_COURSES}-${MAX_SEMESTER_COURSES}`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState msg="No students to validate" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
