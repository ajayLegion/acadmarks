import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { uid } from "../utils/helpers";
import {
  IA_THRESHOLD,
} from "../utils/constants";

export function ExcelUpload({
  update,
  notify,
}) {
  const [preview, setPreview] =
    useState([]);

  const [status, setStatus] =
    useState("");

  const [errors, setErrors] =
    useState([]);

  const [summary, setSummary] =
    useState(null);

  const [dragging, setDragging] =
    useState(false);

  const [uploadType, setUploadType] =
    useState("IA-I");

  const fileRef = useRef();

  const normalizeHeader = key =>
    key
      .toLowerCase()
      .replace(/[\s-_]/g, "");

  const BASE_FIELDS = [
    "srn",
    "studentname",
    "semester",
    "section",
  ];

  const calculateRiskLevel = courses => {
    const failed = courses.filter(
      c =>
        (!c.iaIAbsent &&
          c.iaI !== null &&
          c.iaI < IA_THRESHOLD) ||
        (!c.iaIIAbsent &&
          c.iaII !== null &&
          c.iaII < IA_THRESHOLD)
    ).length;

    if (failed >= 3) return "HIGH";
    if (failed >= 1) return "MEDIUM";

    return "SAFE";
  };

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

        let rows =
          XLSX.utils.sheet_to_json(
            sheet,
            {
              defval: "",
            }
          );

        if (!rows.length) {
          notify("Excel sheet empty");

          return;
        }

        const validationErrors = [];

        const cleanedRows = [];

        rows.forEach((rawRow, index) => {
          const row = {};

          Object.keys(rawRow).forEach(
            key => {
              row[
                normalizeHeader(key)
              ] = rawRow[key];
            }
          );

          const SRN = String(
            row.srn || ""
          ).trim();

          const studentName = String(
            row.studentname || ""
          ).trim();

          const semester = String(
            row.semester || ""
          ).trim();

          const section = String(
            row.section || ""
          ).trim();

          const rowErrors = [];

          if (!SRN)
            rowErrors.push(
              "Missing SRN"
            );

          if (!studentName)
            rowErrors.push(
              "Missing Student Name"
            );

          if (!semester)
            rowErrors.push(
              "Missing Semester"
            );

          if (!section)
            rowErrors.push(
              "Missing Section"
            );

          if (rowErrors.length) {
            validationErrors.push({
              row: index + 2,
              errors: rowErrors,
            });

            return;
          }

          const courses = [];

          Object.keys(row).forEach(
            key => {
              if (
                BASE_FIELDS.includes(key)
              ) {
                return;
              }

              const rawValue =
                row[key];

              if (
                rawValue === "" ||
                rawValue === null ||
                rawValue === undefined
              ) {
                return;
              }

              const isAbsent =
                String(
                  rawValue
                ).toLowerCase() ===
                "absent";

              const marks = isAbsent
                ? null
                : Number(rawValue);

              if (
                !isAbsent &&
                Number.isNaN(marks)
              ) {
                validationErrors.push({
                  row: index + 2,
                  errors: [
                    `Invalid marks in ${key}`,
                  ],
                });

                return;
              }

              courses.push({
                courseCode:
                  key.toUpperCase(),

                courseName:
                  key.toUpperCase(),

                iaI:
                  uploadType ===
                    "IA-I"
                    ? marks
                    : null,

                iaII:
                  uploadType ===
                    "IA-II"
                    ? marks
                    : null,

                iaIAbsent:
                  uploadType ===
                  "IA-I" && isAbsent,

                iaIIAbsent:
                  uploadType ===
                  "IA-II" && isAbsent,
              });
            }
          );

          cleanedRows.push({
            SRN,
            studentName,
            semester,
            section,
            courses,
          });
        });

        const totalStudents =
          cleanedRows.length;

        const totalCourses =
          cleanedRows.reduce(
            (acc, s) =>
              acc +
              s.courses.length,
            0
          );

        const atRisk =
          cleanedRows.reduce(
            (acc, s) => {
              return (
                acc +
                s.courses.filter(
                  c =>
                    (!c.iaIAbsent &&
                      c.iaI !==
                      null &&
                      c.iaI <
                      IA_THRESHOLD) ||
                    (!c.iaIIAbsent &&
                      c.iaII !==
                      null &&
                      c.iaII <
                      IA_THRESHOLD)
                ).length
              );
            },
            0
          );

        setPreview(cleanedRows);

        setErrors(validationErrors);

        setSummary({
          students:
            totalStudents,

          courses:
            totalCourses,

          atRisk,
        });

        setStatus(
          `Loaded ${cleanedRows.length} students`
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
      preview.forEach(
        studentRow => {
          let student =
            d.students.find(
              s =>
                s.SRN ===
                studentRow.SRN
            );

          if (!student) {
            student = {
              id: uid(),

              SRN:
                studentRow.SRN,

              name:
                studentRow.studentName,

              semester:
                studentRow.semester,

              section:
                studentRow.section,

              classSection: `${studentRow.semester}${studentRow.section}`,

              courses: [],

              riskLevel:
                "SAFE",
            };

            d.students.push(
              student
            );

            addedStudents++;
          }

          studentRow.courses.forEach(
            incomingCourse => {
              const existingCourse =
                student.courses.find(
                  c =>
                    c.courseCode ===
                    incomingCourse.courseCode
                );

              if (
                existingCourse
              ) {
                if (
                  incomingCourse.iaI !==
                  null
                ) {
                  existingCourse.iaI =
                    incomingCourse.iaI;

                  existingCourse.iaIAbsent =
                    incomingCourse.iaIAbsent;
                }

                if (
                  incomingCourse.iaII !==
                  null
                ) {
                  existingCourse.iaII =
                    incomingCourse.iaII;

                  existingCourse.iaIIAbsent =
                    incomingCourse.iaIIAbsent;
                }
              } else {
                student.courses.push({
                  ...incomingCourse,
                });

                addedCourses++;
              }

              if (
                !d.courses.some(
                  c =>
                    c.code ===
                    incomingCourse.courseCode
                )
              ) {
                d.courses.push({
                  id: uid(),

                  code:
                    incomingCourse.courseCode,

                  name:
                    incomingCourse.courseName,
                });
              }
            }
          );

          student.riskLevel =
            calculateRiskLevel(
              student.courses
            );
        }
      );

      return d;
    });

    notify(
      `Imported ${addedStudents} students · ${addedCourses} courses`
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
          "EE401",
          "EE402",
          "EE451",
          "CS410",
        ],

        [
          "R23EM090",
          "SINCHANA S",
          "4",
          "A",
          15,
          17,
          "absent",
          18,
        ],

        [
          "R23EM091",
          "RAHUL",
          "4",
          "A",
          12,
          8,
          14,
          "",
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

      {/* UPLOAD TYPE */}

      <div
        className="card"
        style={{
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          Select Upload Type
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
          }}
        >
          <button
            className={
              uploadType ===
                "IA-I"
                ? "btn btn-primary"
                : "btn btn-secondary"
            }
            onClick={() =>
              setUploadType(
                "IA-I"
              )
            }
          >
            Upload IA-1
          </button>

          <button
            className={
              uploadType ===
                "IA-II"
                ? "btn btn-primary"
                : "btn btn-secondary"
            }
            onClick={() =>
              setUploadType(
                "IA-II"
              )
            }
          >
            Upload IA-2
          </button>
        </div>
      </div>

      {/* INFO */}

      <div className="info-box">
        <div
          style={{
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          📘 Excel Structure
        </div>

        <div
          style={{
            fontSize: 13,
            lineHeight: 1.8,
          }}
        >
          Required columns:
          <br />

          <code>SRN</code>{" "}
          <code>Student Name</code>{" "}
          <code>Semester</code>{" "}
          <code>Section</code>

          <br />
          Remaining columns are treated as course codes automatically.

          <br />
          Example:
          <br />

          <code>EE401</code>{" "}
          <code>EE402</code>{" "}
          <code>EE451</code>

          <br />

          Use "absent" for absent students.
        </div>

        <div
          style={{
            marginTop: 14,
          }}
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
            e.dataTransfer
              .files[0]
          );
        }}
        onClick={() =>
          fileRef.current.click()
        }
      >
        <div
          style={{
            fontSize: 46,
            marginBottom: 12,
          }}
        >
          📂
        </div>

        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          Upload {uploadType} Excel
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
            marginTop: 16,
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
              <div>
                Students
              </div>

              <h2>
                {
                  summary.students
                }
              </h2>
            </div>

            <div className="metric-card">
              <div>
                Courses
              </div>

              <h2>
                {
                  summary.courses
                }
              </h2>
            </div>

            <div className="metric-card">
              <div>
                At Risk
              </div>

              <h2>
                {
                  summary.atRisk
                }
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* ERRORS */}

      {errors.length > 0 && (
        <div
          className="warn-box"
          style={{
            marginTop: 20,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            ⚠ Validation Errors
          </div>

          {errors.map(
            (e, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 8,
                  fontSize: 13,
                }}
              >
                Row {e.row}:{" "}
                {e.errors.join(
                  ", "
                )}
              </div>
            )
          )}
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

              alignItems:
                "center",

              marginBottom: 18,
            }}
          >
            <div className="card-title">
              📄 Preview
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
                  <th>
                    Courses
                  </th>
                </tr>
              </thead>

              <tbody>
                {preview.map(
                  (
                    student,
                    i
                  ) => (
                    <tr key={i}>
                      <td>
                        {
                          student.SRN
                        }
                      </td>

                      <td>
                        {
                          student.studentName
                        }
                      </td>

                      <td>
                        {
                          student.semester
                        }
                      </td>

                      <td>
                        {
                          student.section
                        }
                      </td>

                      <td>
                        <div
                          style={{
                            display:
                              "flex",

                            flexWrap:
                              "wrap",

                            gap: 8,
                          }}
                        >
                          {student.courses.map(
                            (
                              course,
                              idx
                            ) => {
                              const marks =
                                uploadType ===
                                  "IA-I"
                                  ? course.iaI
                                  : course.iaII;

                              const absent =
                                uploadType ===
                                  "IA-I"
                                  ? course.iaIAbsent
                                  : course.iaIIAbsent;

                              const risk =
                                marks !==
                                null &&
                                marks <
                                IA_THRESHOLD;

                              return (
                                <div
                                  key={
                                    idx
                                  }
                                  style={{
                                    padding:
                                      "6px 10px",

                                    borderRadius: 8,

                                    fontSize: 12,

                                    fontWeight: 600,

                                    background:
                                      absent
                                        ? "#fee2e2"
                                        : risk
                                          ? "#fef3c7"
                                          : "#dcfce7",
                                  }}
                                >
                                  {
                                    course.courseCode
                                  }

                                  {" : "}

                                  {absent
                                    ? "ABSENT"
                                    : marks}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}