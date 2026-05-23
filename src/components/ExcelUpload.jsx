import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  IA_GAP_MONTHS,
  IA_MAX,
  IA_THRESHOLD,
  MAX_SEMESTER_COURSES,
  MIN_SEMESTER_COURSES,
} from "../utils/constants";
import { uid } from "../utils/helpers";

const HEADER_ALIASES = {
  srn: "SRN",
  usn: "SRN",

  studentname: "Student Name",
  name: "Student Name",

  semester: "Semester",
  sem: "Semester",

  section: "Section",
  class: "Section",

  coursecode: "Course Code",
  subjectcode: "Course Code",

  coursename: "Course Name",
  subjectname: "Course Name",
  subject: "Course Name",
  elective: "Course Type",
  coursetype: "Course Type",
  subjecttype: "Course Type",

  iai: "IA-I",
  ia1: "IA-I",
  internal1: "IA-I",
  iaidate: "IA-I Date",
  ia1date: "IA-I Date",

  iaii: "IA-II",
  ia2: "IA-II",
  internal2: "IA-II",
  iaiidate: "IA-II Date",
  ia2date: "IA-II Date",
};

const normalizeHeader = key =>
  key
    .toLowerCase()
    .replace(/[\s-_]/g, "");

const normalizeRow = row => {
  const formatted = {};

  Object.keys(row).forEach(key => {
    const normalized = normalizeHeader(key);

    const mappedKey =
      HEADER_ALIASES[normalized] || key;

    formatted[mappedKey] = row[key];
  });

  return formatted;
};

const calculateRiskLevel = courses => {
  const failed = courses.filter(
    c => c.iaI < IA_THRESHOLD || c.iaII < IA_THRESHOLD
  ).length;

  if (failed >= 3) return "HIGH";
  if (failed >= 1) return "MEDIUM";
  return "SAFE";
};

const parseOptionalDate = value => {
  if (!value) return null;
  if (value instanceof Date) return value;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getGapDays = (start, end) => {
  if (!start || !end) return null;
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

export function ExcelUpload({
  update,
  notify,
}) {
  const [preview, setPreview] = useState([]);
  const [status, setStatus] = useState("");
  const [dragging, setDragging] =
    useState(false);

  const [errors, setErrors] = useState([]);
  const [summary, setSummary] =
    useState(null);

  const fileRef = useRef();

  const processFile = file => {
    if (!file) return;

    const ext = file.name
      .split(".")
      .pop()
      .toLowerCase();

    if (
      !["xlsx", "xls", "csv"].includes(ext)
    ) {
      notify(
        "Only .xlsx .xls .csv supported",
        "error"
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = e => {
      try {
        const workbook = XLSX.read(
          e.target.result,
          {
            type: "binary",
          }
        );

        const sheet =
          workbook.Sheets[
          workbook.SheetNames[0]
          ];

        let rows = XLSX.utils.sheet_to_json(
          sheet,
          {
            defval: "",
          }
        );

        if (!rows.length) {
          notify("Excel sheet is empty");
          return;
        }

        rows = rows.map(normalizeRow);

        const validationErrors = [];

        const cleanedRows = [];

        rows.forEach((row, index) => {
          const SRN = String(
            row["SRN"] || ""
          ).trim();

          const studentName = String(
            row["Student Name"] || ""
          ).trim();

          const semester = String(
            row["Semester"] || ""
          ).trim();

          const section = String(
            row["Section"] || ""
          ).trim();

          const courseCode = String(
            row["Course Code"] || ""
          ).trim();

          const courseName = String(
            row["Course Name"] || ""
          ).trim();

          const courseType = String(
            row["Course Type"] || "Core"
          ).trim() || "Core";

          const iaI = Number(
            row["IA-I"] || 0
          );

          const iaII = Number(
            row["IA-II"] || 0
          );

          const iaIDate = parseOptionalDate(row["IA-I Date"]);
          const iaIIDate = parseOptionalDate(row["IA-II Date"]);
          const gapDays = getGapDays(iaIDate, iaIIDate);

          const rowErrors = [];

          if (!SRN)
            rowErrors.push("Missing SRN");

          if (!studentName)
            rowErrors.push(
              "Missing Student Name"
            );

          if (!courseCode)
            rowErrors.push(
              "Missing Course Code"
            );

          if (!courseName)
            rowErrors.push(
              "Missing Course Name"
            );

          if (
            iaI < 0 ||
            iaI > IA_MAX
          ) {
            rowErrors.push(
              "Invalid IA-I Marks"
            );
          }

          if (
            iaII < 0 ||
            iaII > IA_MAX
          ) {
            rowErrors.push(
              "Invalid IA-II Marks"
            );
          }

          if (gapDays !== null && (gapDays < 40 || gapDays > 50)) {
            rowErrors.push(
              `IA-I and IA-II should be about ${IA_GAP_MONTHS} months apart`
            );
          }

          if (rowErrors.length) {
            validationErrors.push({
              row: index + 2,
              errors: rowErrors,
            });

            return;
          }

          cleanedRows.push({
            SRN,
            studentName,
            semester,
            section,
            courseCode,
            courseName,
            courseType,
            iaI,
            iaII,
            iaIDate: iaIDate ? iaIDate.toISOString().slice(0, 10) : "",
            iaIIDate: iaIIDate ? iaIIDate.toISOString().slice(0, 10) : "",
          });
        });

        const loadWarnings = [];
        const groupedByStudent = cleanedRows.reduce((acc, row) => {
          const key = `${row.SRN}__${row.semester}`;
          acc[key] = acc[key] || {
            SRN: row.SRN,
            studentName: row.studentName,
            semester: row.semester,
            courseCodes: new Set(),
          };
          acc[key].courseCodes.add(row.courseCode);
          return acc;
        }, {});

        Object.values(groupedByStudent).forEach(group => {
          const count = group.courseCodes.size;
          if (count < MIN_SEMESTER_COURSES || count > MAX_SEMESTER_COURSES) {
            loadWarnings.push({
              row: "-",
              errors: [
                `${group.SRN} (${group.studentName}) has ${count} courses for semester ${group.semester || "unassigned"}; expected ${MIN_SEMESTER_COURSES}-${MAX_SEMESTER_COURSES}`,
              ],
            });
          }
        });

        const totalStudents =
          new Set(
            cleanedRows.map(r => r.SRN)
          ).size;

        const totalCourses =
          cleanedRows.length;

        const atRiskCount =
          cleanedRows.filter(
            r =>
              r.iaI < IA_THRESHOLD ||
              r.iaII < IA_THRESHOLD
          ).length;

        setPreview(cleanedRows);

        setErrors([...validationErrors, ...loadWarnings]);

        setSummary({
          students: totalStudents,
          courses: totalCourses,
          atRisk: atRiskCount,
        });

        setStatus(
          `Loaded ${cleanedRows.length} valid rows`
        );
      } catch (err) {
        console.error(err);

        notify(
          "Excel parsing failed",
          "error"
        );
      }
    };

    reader.readAsBinaryString(file);
  };

  const importData = () => {
    if (!preview.length) return;

    let addedStudents = 0;
    let addedCourses = 0;

    update(d => {
      preview.forEach(row => {
        let student =
          d.students.find(
            s => s.SRN === row.SRN
          );

        if (!student) {
          student = {
            id: uid(),
            SRN: row.SRN,
            name: row.studentName,
            semester: row.semester,
            section: row.section,
            classSection: row.semester && row.section ? `${row.semester}${row.section}` : "",
            courses: [],
            riskLevel: "SAFE",
          };

          d.students.push(student);

          addedStudents++;
        } else {
          student.name = row.studentName || student.name;
          student.semester = row.semester || student.semester;
          student.section = row.section || student.section;
          student.classSection =
            row.semester && row.section ? `${row.semester}${row.section}` : student.classSection;
        }

        const existingCourse =
          student.courses.find(
            c =>
              c.courseCode ===
              row.courseCode
          );

        if (existingCourse) {
          existingCourse.courseName =
            row.courseName;

          existingCourse.courseType =
            row.courseType;

          existingCourse.iaI =
            row.iaI;

          existingCourse.iaII =
            row.iaII;

          existingCourse.iaIDate =
            row.iaIDate;

          existingCourse.iaIIDate =
            row.iaIIDate;
        } else {
          student.courses.push({
            courseCode:
              row.courseCode,

            courseName:
              row.courseName,

            courseType:
              row.courseType,

            iaI: row.iaI,

            iaII: row.iaII,

            iaIDate: row.iaIDate,

            iaIIDate: row.iaIIDate,
          });

          addedCourses++;
        }

        if (!d.courses.some(c => c.code === row.courseCode)) {
          d.courses.push({
            id: uid(),
            code: row.courseCode,
            name: row.courseName,
            semester: row.semester,
            type: row.courseType,
            credits: "",
          });
        }

        student.riskLevel =
          calculateRiskLevel(
            student.courses
          );
      });

      return d;
    });

    notify(
      `Imported ${addedStudents} new students · ${addedCourses} courses added`
    );

    setPreview([]);
    setErrors([]);
    setSummary(null);
    setStatus("");
  };

  const downloadTemplate = () => {
    const template =
      XLSX.utils.aoa_to_sheet([
        [
          "SRN",
          "Student Name",
          "Semester",
          "Section",
          "Course Code",
          "Course Name",
          "Course Type",
          "IA-I",
          "IA-II",
          "IA-I Date",
          "IA-II Date",
        ],

        [
          "1RV22EE001",
          "Ajay",
          "4",
          "A",
          "EE401",
          "Electrical Machines",
          "Core",
          "15",
          "18",
          "2026-01-15",
          "2026-03-01",
        ],

        [
          "1RV22EE001",
          "Ajay",
          "4",
          "A",
          "EE402",
          "Power Systems",
          "Elective",
          "12",
          "17",
          "2026-01-15",
          "2026-03-01",
        ],

        [
          "1RV22EE002",
          "Rahul",
          "4",
          "B",
          "EE401",
          "Electrical Machines",
          "Core",
          "7",
          "8",
          "2026-01-15",
          "2026-03-01",
        ],
      ]);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      template,
      "AcademicMarks"
    );

    XLSX.writeFile(
      workbook,
      "academic_marks_template.xlsx"
    );
  };

  return (
    <div>
      {/* INFO */}
      <div className="info-box">
        <div
          style={{
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          📘 Required Excel Structure
        </div>

        <div
          style={{
            fontSize: 13,
            lineHeight: 1.8,
          }}
        >
          Required Columns:
          <br />

          <code>SRN</code>{" "}
          <code>Student Name</code>{" "}
          <code>Semester</code>{" "}
          <code>Section</code>{" "}
          <code>Course Code</code>{" "}
          <code>Course Name</code>{" "}
          <code>Course Type</code>{" "}
          <code>IA-I</code>{" "}
          <code>IA-II</code>{" "}
          <code>IA-I Date</code>{" "}
          <code>IA-II Date</code>
          <br />
          Each student should have {MIN_SEMESTER_COURSES}-{MAX_SEMESTER_COURSES}
          selected courses. IA dates are optional, but when provided they should be
          about {IA_GAP_MONTHS} months apart.
        </div>

        <div
          style={{ marginTop: 12 }}
        >
          <button
            className="btn btn-secondary btn-sm"
            onClick={
              downloadTemplate
            }
          >
            ⬇ Download Template
          </button>
        </div>
      </div>

      {/* DROP ZONE */}
      <div
        className={`drop-zone ${dragging
            ? "drag-active"
            : ""
          }`}
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() =>
          setDragging(false)
        }
        onDrop={e => {
          e.preventDefault();
          setDragging(false);

          processFile(
            e.dataTransfer.files[0]
          );
        }}
        onClick={() =>
          fileRef.current.click()
        }
      >
        <div
          style={{
            fontSize: 44,
            marginBottom: 12,
          }}
        >
          📂
        </div>

        <div
          style={{
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          Upload Academic Excel
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "#666",
          }}
        >
          Supports .xlsx .xls .csv
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{
            display: "none",
          }}
          onChange={e =>
            processFile(
              e.target.files[0]
            )
          }
        />
      </div>

      {/* STATUS */}
      {status && (
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background:
              "#ecfeff",
            border:
              "1px solid #67e8f9",
            marginBottom: 16,
            fontWeight: 600,
          }}
        >
          {status}
        </div>
      )}

      {/* SUMMARY */}
      {summary && (
        <div className="card">
          <div
            className="card-title"
            style={{
              marginBottom: 18,
            }}
          >
            📊 Upload Summary
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(180px,1fr))",
              gap: 16,
            }}
          >
            <div className="metric-card">
              <div>Total Students</div>

              <h2>
                {summary.students}
              </h2>
            </div>

            <div className="metric-card">
              <div>Course Entries</div>

              <h2>
                {summary.courses}
              </h2>
            </div>

            <div className="metric-card">
              <div>At Risk Entries</div>

              <h2>
                {summary.atRisk}
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* VALIDATION ERRORS */}
      {errors.length > 0 && (
        <div
          className="warn-box"
          style={{
            marginTop: 18,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            ⚠ Validation Errors
          </div>

          {errors.map((e, i) => (
            <div
              key={i}
              style={{
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              Row {e.row}:{" "}
              {e.errors.join(", ")}
            </div>
          ))}
        </div>
      )}

      {/* PREVIEW */}
      {preview.length > 0 && (
        <div
          className="card"
          style={{
            marginTop: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div className="card-title">
              📄 Excel Preview
            </div>

            <button
              className="btn btn-primary"
              onClick={importData}
            >
              ⬆ Import Data
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SRN</th>
                  <th>Name</th>
                  <th>Sem</th>
                  <th>Sec</th>
                  <th>Course</th>
                  <th>Type</th>
                  <th>IA-I</th>
                  <th>IA-II</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {preview
                  .slice(0, 15)
                  .map((row, i) => {
                    const risk =
                      row.iaI < IA_THRESHOLD ||
                      row.iaII < IA_THRESHOLD;

                    return (
                      <tr
                        key={i}
                        style={{
                          background:
                            risk
                              ? "#fffbeb"
                              : "transparent",
                        }}
                      >
                        <td>
                          {row.SRN}
                        </td>

                        <td>
                          {
                            row.studentName
                          }
                        </td>

                        <td>
                          {
                            row.semester
                          }
                        </td>

                        <td>
                          {
                            row.section
                          }
                        </td>

                        <td>
                          {
                            row.courseCode
                          }
                        </td>

                        <td>
                          {
                            row.courseType
                          }
                        </td>

                        <td>
                          {row.iaI}
                        </td>

                        <td>
                          {row.iaII}
                        </td>

                        <td>
                          {risk
                            ? "⚠ At Risk"
                            : "✅ Safe"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {preview.length >
              15 && (
                <div
                  style={{
                    padding: 12,
                    textAlign:
                      "center",
                    fontSize: 13,
                  }}
                >
                  Showing first 15
                  rows
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
