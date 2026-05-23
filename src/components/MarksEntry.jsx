import { useMemo, useState } from "react";
import {
  IA_GAP_MONTHS,
  IA_MAX,
  IA_THRESHOLD,
} from "../utils/constants";
import { getCourseLoadStatus, getStudentCourses } from "../utils/helpers";
import { EmptyState } from "./EmptyState";

const blankMarks = {
  iaI: "",
  iaII: "",
  iaIDate: "",
  iaIIDate: "",
};

export function MarksEntry({ data, update, notify, selClass }) {
  const [selStudent, setSelStudent] = useState("");
  const [selCourse, setSelCourse] = useState("");
  const [marks, setMarks] = useState(blankMarks);

  const students = selClass === "all"
    ? data.students
    : data.students.filter(student => student.classSection === selClass);

  const student = data.students.find(s => s.id === selStudent);
  const selectedCourse = data.courses.find(course => course.id === selCourse);
  const enrolledCourses = useMemo(() => getStudentCourses(student), [student]);

  const existing = selectedCourse
    ? enrolledCourses.find(course => course.courseCode === selectedCourse.code)
    : null;

  const load = student ? getCourseLoadStatus(student) : null;

  const submit = () => {
    if (!student || !selectedCourse) {
      return notify("Select student and course", "error");
    }

    const iaI = Number(marks.iaI);
    const iaII = Number(marks.iaII);

    if (!Number.isFinite(iaI) || !Number.isFinite(iaII)) {
      return notify("Enter IA-I and IA-II marks", "error");
    }

    if (iaI < 0 || iaI > IA_MAX || iaII < 0 || iaII > IA_MAX) {
      return notify(`IA marks must be 0-${IA_MAX}`, "error");
    }

    if (marks.iaIDate && marks.iaIIDate) {
      const first = new Date(marks.iaIDate);
      const second = new Date(marks.iaIIDate);
      const gapDays = Math.round((second.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));

      if (gapDays < 40 || gapDays > 50) {
        return notify(`IA exams should be about ${IA_GAP_MONTHS} months apart`, "error");
      }
    }

    update(d => {
      const target = d.students.find(s => s.id === student.id);
      target.courses = Array.isArray(target.courses) ? target.courses : [];

      const idx = target.courses.findIndex(course => course.courseCode === selectedCourse.code);
      const entry = {
        courseCode: selectedCourse.code,
        courseName: selectedCourse.name,
        courseType: selectedCourse.type || "Core",
        iaI,
        iaII,
        iaIDate: marks.iaIDate,
        iaIIDate: marks.iaIIDate,
      };

      if (idx >= 0) target.courses[idx] = entry;
      else target.courses.push(entry);

      target.riskLevel = target.courses.some(
        course => course.iaI < IA_THRESHOLD || course.iaII < IA_THRESHOLD
      )
        ? "MEDIUM"
        : "SAFE";

      return d;
    });

    notify(`Marks saved for ${student.name} - ${selectedCourse.name}`);
    setMarks(blankMarks);
  };

  const removeCourse = courseCode => {
    if (!student) return;

    update(d => {
      const target = d.students.find(s => s.id === student.id);
      target.courses = (target.courses || []).filter(course => course.courseCode !== courseCode);
      return d;
    });

    notify("Course removed from student");
  };

  return (
    <div className="two-col">
      <div className="card" style={{ position: "sticky", top: 80 }}>
        <div className="card-title">Enter Course IA Marks</div>

        <label className="form-label">
          Student
          <select
            className="form-input"
            value={selStudent}
            onChange={e => {
              setSelStudent(e.target.value);
              setSelCourse("");
              setMarks(blankMarks);
            }}
          >
            <option value="">Select student</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.SRN} - {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="form-label">
          Course
          <select
            className="form-input"
            value={selCourse}
            onChange={e => {
              const courseId = e.target.value;
              const course = data.courses.find(c => c.id === courseId);
              const current = course
                ? enrolledCourses.find(enrolled => enrolled.courseCode === course.code)
                : null;

              setSelCourse(courseId);
              setMarks(current ? {
                iaI: String(current.iaI ?? ""),
                iaII: String(current.iaII ?? ""),
                iaIDate: current.iaIDate || "",
                iaIIDate: current.iaIIDate || "",
              } : blankMarks);
            }}
          >
            <option value="">Select course</option>
            {data.courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
                {course.type === "Elective" ? " (Elective)" : ""}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label className="form-label">
            IA-I
            <input
              className="form-input"
              type="number"
              min="0"
              max={IA_MAX}
              value={marks.iaI}
              onChange={e => setMarks({ ...marks, iaI: e.target.value })}
              placeholder={`0-${IA_MAX}`}
            />
          </label>

          <label className="form-label">
            IA-II
            <input
              className="form-input"
              type="number"
              min="0"
              max={IA_MAX}
              value={marks.iaII}
              onChange={e => setMarks({ ...marks, iaII: e.target.value })}
              placeholder={`0-${IA_MAX}`}
            />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label className="form-label">
            IA-I Date
            <input
              className="form-input"
              type="date"
              value={marks.iaIDate}
              onChange={e => setMarks({ ...marks, iaIDate: e.target.value })}
            />
          </label>

          <label className="form-label">
            IA-II Date
            <input
              className="form-input"
              type="date"
              value={marks.iaIIDate}
              onChange={e => setMarks({ ...marks, iaIIDate: e.target.value })}
            />
          </label>
        </div>

        {existing && (
          <div className="info-box" style={{ padding: 10, marginBottom: 10 }}>
            Existing marks will be updated for this selected course.
          </div>
        )}

        <button className="btn btn-primary" style={{ width: "100%" }} onClick={submit}>
          Save Marks
        </button>
      </div>

      <div className="card">
        <div className="card-title">
          {student ? `${student.name}'s Selected Courses` : "Selected Courses"}
        </div>

        {student && load && (
          <div className={load.ok ? "info-box" : "warn-box"} style={{ marginBottom: 12 }}>
            Course load: <b>{load.count}</b>. Expected range is 6-8 selected courses.
          </div>
        )}

        {student ? (
          enrolledCourses.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {["Code", "Course", "Type", "IA-I", "IA-II", "Total", "Status", "Actions"].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrolledCourses.map(course => {
                    const risk = course.iaI < IA_THRESHOLD || course.iaII < IA_THRESHOLD;
                    return (
                      <tr key={course.courseCode} style={{ background: risk ? "#fffbeb" : "transparent" }}>
                        <td><code>{course.courseCode}</code></td>
                        <td style={{ fontWeight: 600 }}>{course.courseName}</td>
                        <td>{course.courseType || "Core"}</td>
                        <td style={{ fontWeight: 800, color: course.iaI < IA_THRESHOLD ? "#ef4444" : "var(--text-h)" }}>
                          {course.iaI}
                        </td>
                        <td style={{ fontWeight: 800, color: course.iaII < IA_THRESHOLD ? "#ef4444" : "var(--text-h)" }}>
                          {course.iaII}
                        </td>
                        <td style={{ fontWeight: 800 }}>{course.iaI + course.iaII}/{IA_MAX * 2}</td>
                        <td>
                          <span className={risk ? "chip chip-risk" : "chip chip-pass"}>
                            {risk ? "At Risk" : "Pass"}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => removeCourse(course.courseCode)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState msg="No courses selected for this student" />
          )
        ) : (
          <EmptyState msg="Select a student" />
        )}
      </div>
    </div>
  );
}
