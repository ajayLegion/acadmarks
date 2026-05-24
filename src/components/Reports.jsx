import { useState } from "react";
import * as XLSX from "xlsx";
import { IA_THRESHOLD } from "../utils/constants";
import {
  average,
  flattenCourseRows,
  getStudentCourses,
  isAtRiskForIA,
  isStudentAtRiskForIA,
} from "../utils/helpers";
import { EmptyState } from "./EmptyState";

/* ───────────────────────────────────────────── */
/* MINI STAT */
/* ───────────────────────────────────────────── */

function Stat({
  label,
  value,
  color,
}) {
  return (
    <div className="ia-stat">
      <div
        className="ia-stat-val"
        style={{ color }}
      >
        {value}
      </div>

      <div className="ia-stat-lbl">
        {label}
      </div>
    </div>
  );
}

function hasIAData(student, field) {
  const absentField =
    field === "iaI"
      ? "iaIAbsent"
      : "iaIIAbsent";

  return getStudentCourses(student).some(course => {
    const mark = course[field];

    return (
      !course[absentField] &&
      mark !== null &&
      mark !== undefined &&
      mark !== ""
    );
  });
}

function getIAClassSummary(students, field) {
  const assessed =
    students.filter(student =>
      hasIAData(student, field)
    );

  const risk =
    assessed.filter(student =>
      isStudentAtRiskForIA(student, field)
    );

  const passing =
    assessed.length - risk.length;

  const passRate =
    assessed.length
      ? Math.round((passing / assessed.length) * 100)
      : 0;

  return {
    assessed: assessed.length,
    passing,
    passRate,
    risk,
  };
}

/* ───────────────────────────────────────────── */
/* IA STATS */
/* ───────────────────────────────────────────── */

function IAStats({
  students,
  field,
  label,
}) {

  // student-wise aggregation
  const studentStats = students.map(
    student => {

      const validCourses =
        getStudentCourses(student).filter(c => {

          const mark =
            field === "iaI"
              ? c.iaI
              : c.iaII;

          const absent =
            field === "iaI"
              ? c.iaIAbsent
              : c.iaIIAbsent;

          return (
            !absent &&
            mark !== null &&
            mark !== undefined
          );
        });

      const marks =
        validCourses.map(c =>
          field === "iaI"
            ? c.iaI
            : c.iaII
        );

      if (!marks.length)
        return null;

      const avg =
        average(marks);

      const failed =
        marks.some(
          m => m < IA_THRESHOLD
        );

      return {
        avg,
        failed,
      };
    }
  ).filter(Boolean);

  const averages =
    studentStats.map(s => s.avg);

  if (!averages.length)
    return null;

  const totalStudents =
    studentStats.length;

  const classAvg =
    average(averages).toFixed(1);

  const highest =
    Math.max(...averages).toFixed(1);

  const lowest =
    Math.min(...averages).toFixed(1);

  const passing =
    studentStats.filter(
      s => !s.failed
    ).length;

  const passRate =
    Math.round(
      (passing /
        totalStudents) *
      100
    );

  return (
    <div
      style={{
        background:
          "var(--bg-2)",

        borderRadius: 10,

        padding: "12px 14px",

        marginBottom: 10,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--text-2)",
          textTransform:
            "uppercase",
          letterSpacing:
            "0.5px",
          marginBottom: 8,
        }}
      >
        {label} Analysis
      </div>

      <div
        className="ia-stat-row"
        style={{ marginTop: 0 }}
      >

        <Stat
          label="Avg"
          value={classAvg}
          color="#5b5ef4"
        />

        <Stat
          label="Highest"
          value={highest}
          color="#22c55e"
        />

        <Stat
          label="Lowest"
          value={lowest}
          color="#ef4444"
        />

        <Stat
          label="Pass"
          value={`${passing}/${totalStudents}`}
          color="var(--text-h)"
        />

        <Stat
          label="Rate"
          value={`${passRate}%`}
          color={
            passRate >= 75
              ? "#22c55e"
              : passRate >= 50
                ? "#f59e0b"
                : "#ef4444"
          }
        />
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────── */
/* CLASS REPORT */
/* ───────────────────────────────────────────── */

function ClassReport({
  cls,
  students,
  onExport,
}) {
  const courseRows =
    flattenCourseRows(
      students
    );

  const iaISummary =
    getIAClassSummary(students, "iaI");

  const iaIISummary =
    getIAClassSummary(students, "iaII");

  return (
    <div
      className="card"
      style={{
        marginBottom: 20,
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          alignItems: "center",

          marginBottom: 14,

          flexWrap: "wrap",

          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",

            alignItems:
              "center",

            gap: 10,
          }}
        >
          <span
            style={{
              background:
                "linear-gradient(135deg,#5b5ef4,#818cf8)",

              color: "#fff",

              padding:
                "4px 14px",

              borderRadius: 8,

              fontWeight: 800,

              fontSize: 16,
            }}
          >
            Class {cls}
          </span>

          <span
            style={{
              fontSize: 13,

              color:
                "var(--text-2)",
            }}
          >
            {students.length} students ·{" "}
            IA-1 {iaISummary.passing}/{iaISummary.assessed} passing ({iaISummary.passRate}%) ·{" "}
            IA-2 {iaIISummary.passing}/{iaIISummary.assessed} passing ({iaIISummary.passRate}%)
          </span>

          {iaISummary.risk.length >
            0 && (
              <span className="chip chip-risk">
                ⚠️ IA-1{" "}
                {iaISummary.risk.length}{" "}
                at risk
              </span>
            )}

          {iaIISummary.risk.length >
            0 && (
              <span className="chip chip-risk">
                ⚠️ IA-2{" "}
                {iaIISummary.risk.length}{" "}
                at risk
              </span>
            )}
        </div>

        {/* EXPORT BUTTONS */}

        <div
          style={{
            display: "flex",

            gap: 8,

            flexWrap: "wrap",
          }}
        >
          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              onExport(
                cls,
                students,
                "ia1"
              )
            }
          >
            ⬇ IA-1
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              onExport(
                cls,
                students,
                "ia2"
              )
            }
          >
            ⬇ IA-2
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() =>
              onExport(
                cls,
                students,
                "all"
              )
            }
          >
            ⬇ Full Report
          </button>

          <button
            className="btn btn-danger btn-sm"
            onClick={() =>
              onExport(
                cls,
                students,
                "atrisk"
              )
            }
          >
            ⬇ At-Risk
          </button>
        </div>
      </div>

      {/* IA STATS */}

      {students.length >
        0 && (
          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "1fr 1fr",

              gap: 10,

              marginBottom: 12,
            }}
          >
            <IAStats
              students={students}
              field="iaI"
              label="IA-I"
            />

            <IAStats
              students={students}
              field="iaII"
              label="IA-II"
            />
          </div>
        )}

      {/* TABLE */}

      {courseRows.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SRN</th>
                <th>Name</th>
                <th>Course</th>
                <th>IA-I</th>
                <th>IA-I Status</th>
                <th>IA-II</th>
                <th>IA-II Status</th>
              </tr>
            </thead>

            <tbody>
              {courseRows.map(
                row => {
                  const iaI =
                    row.iaI;

                  const iaII =
                    row.iaII;

                  const iaIRisk =
                    isAtRiskForIA(row, "iaI");

                  const iaIIRisk =
                    isAtRiskForIA(row, "iaII");

                  return (
                    <tr
                      key={`${row.student.id}-${row.courseCode}`}
                      style={{
                        background:
                          iaIRisk || iaIIRisk
                            ? "#fffbeb"
                            : "transparent",
                      }}
                    >
                      <td>
                        <code
                          style={{
                            fontSize: 12,

                            background:
                              iaIRisk || iaIIRisk
                                ? "#fef3c7"
                                : "var(--bg-2)",

                            padding:
                              "2px 7px",

                            borderRadius: 5,
                          }}
                        >
                          {
                            row
                              .student
                              .SRN
                          }
                        </code>
                      </td>

                      <td
                        style={{
                          fontWeight: 600,
                        }}
                      >
                        {
                          row
                            .student
                            .name
                        }
                      </td>

                      <td>
                        {
                          row.courseCode
                        }
                      </td>

                      <td
                        style={{
                          fontWeight: 700,

                          color:
                            iaIRisk
                              ? "#ef4444"
                              : "var(--text-h)",
                        }}
                      >
                        {row.iaIAbsent
                          ? "ABSENT"
                          : iaI}
                      </td>

                      <td>
                        <span
                          className={
                            row.iaIAbsent
                              ? "chip chip-risk"
                              : iaIRisk
                                ? "chip chip-risk"
                                : "chip chip-pass"
                          }
                        >
                          {row.iaIAbsent
                            ? "Absent"
                            : iaIRisk
                              ? "⚠️ At Risk"
                              : "✓ Pass"}
                        </span>
                      </td>

                      <td
                        style={{
                          fontWeight: 700,

                          color:
                            iaIIRisk
                              ? "#ef4444"
                              : "var(--text-h)",
                        }}
                      >
                        {row.iaIIAbsent
                          ? "ABSENT"
                          : iaII}
                      </td>

                      <td>
                        <span
                          className={
                            row.iaIIAbsent
                              ? "chip chip-risk"
                              : iaIIRisk
                              ? "chip chip-risk"
                              : "chip chip-pass"
                          }
                        >
                          {row.iaIIAbsent
                            ? "Absent"
                            : iaIIRisk
                            ? "⚠️ At Risk"
                            : "✓ Pass"}
                        </span>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          msg={`No students in Class ${cls}`}
        />
      )}
    </div>
  );
}

/* ───────────────────────────────────────────── */
/* MAIN REPORTS */
/* ───────────────────────────────────────────── */

export function Reports({
  data,
  notify,
  selClass,
  classes,
}) {
  const [viewCls, setViewCls] =
    useState(selClass);

  const effectiveCls =
    selClass !== "all"
      ? selClass
      : viewCls;

  /* EXPORT LOGIC */

  const exportXlsx = (
    cls,
    students,
    type
  ) => {
    if (!students.length) {
      return notify(
        `No students in Class ${cls}`,
        "error"
      );
    }

    const flattened =
      flattenCourseRows(
        students
      );

    const iaValue = (row, field) => {
      const absentField =
        field === "iaI"
          ? "iaIAbsent"
          : "iaIIAbsent";

      return row[absentField]
        ? "ABSENT"
        : row[field];
    };

    const iaStatus = (row, field) => {
      const absentField =
        field === "iaI"
          ? "iaIAbsent"
          : "iaIIAbsent";

      if (row[absentField])
        return "Absent";

      return isAtRiskForIA(row, field)
        ? "At Risk"
        : "Pass";
    };

    let rows;

    /* IA-1 */

    if (type === "ia1") {
      rows = flattened.map(
        row => ({
          "Class":
            row.student
              .classSection ||
            cls,

          "SRN":
            row.student.SRN,

          "Student Name":
            row.student.name,

          "Semester":
            row.student
              .semester,

          "Course":
            row.courseCode,

          "IA-I":
            iaValue(row, "iaI"),

          "Status":
            iaStatus(row, "iaI"),
        })
      );
    }

    /* IA-2 */

    else if (
      type === "ia2"
    ) {
      rows = flattened.map(
        row => ({
          "Class":
            row.student
              .classSection ||
            cls,

          "SRN":
            row.student.SRN,

          "Student Name":
            row.student.name,

          "Semester":
            row.student
              .semester,

          "Course":
            row.courseCode,

          "IA-II":
            iaValue(row, "iaII"),

          "Status":
            iaStatus(row, "iaII"),
        })
      );
    }

    /* AT RISK */

    else if (
      type === "atrisk"
    ) {
      rows = flattened
        .filter(
          row =>
            isAtRiskForIA(row, "iaI") ||
            isAtRiskForIA(row, "iaII")
        )
        .map(row => ({
          "Class":
            row.student
              .classSection ||
            cls,

          "SRN":
            row.student.SRN,

          "Student Name":
            row.student.name,

          "Course":
            row.courseCode,

          "IA-I":
            iaValue(row, "iaI"),

          "IA-I Status":
            iaStatus(row, "iaI"),

          "IA-II":
            iaValue(row, "iaII"),

          "IA-II Status":
            iaStatus(row, "iaII"),
        }));
    }

    /* FULL */

    else {
      rows = flattened.map(
        row => ({
          "Class":
            row.student
              .classSection ||
            cls,

          "SRN":
            row.student.SRN,

          "Student Name":
            row.student.name,

          "Semester":
            row.student
              .semester,

          "Course":
            row.courseCode,

          "IA-I":
            iaValue(row, "iaI"),

          "IA-I Status":
            iaStatus(row, "iaI"),

          "IA-II":
            iaValue(row, "iaII"),

          "IA-II Status":
            iaStatus(row, "iaII"),
        })
      );
    }

    const ws =
      XLSX.utils.json_to_sheet(
        rows
      );

    const wb =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `Class ${cls}`
    );

    const date = new Date()
      .toISOString()
      .slice(0, 10);

    let fname;

    if (type === "ia1") {
      fname = `class_${cls}_IA1_${date}.xlsx`;
    } else if (
      type === "ia2"
    ) {
      fname = `class_${cls}_IA2_${date}.xlsx`;
    } else if (
      type === "atrisk"
    ) {
      fname = `class_${cls}_atrisk_${date}.xlsx`;
    } else {
      fname = `class_${cls}_full_${date}.xlsx`;
    }

    XLSX.writeFile(
      wb,
      fname
    );

    notify(
      `Downloaded ${fname}`
    );
  };

  const classesToShow =
    effectiveCls === "all"
      ? classes
      : [effectiveCls];

  return (
    <div>
      {/* TABS */}

      <div
        style={{
          display: "flex",

          gap: 6,

          marginBottom: 18,

          flexWrap: "wrap",
        }}
      >
        {[
          "all",
          ...classes,
        ].map(cls => (
          <button
            key={cls}
            onClick={() =>
              setViewCls(cls)
            }
            style={{
              padding:
                "6px 14px",

              borderRadius: 8,

              border: "none",

              cursor: "pointer",

              fontWeight: 700,

              background:
                effectiveCls ===
                  cls
                  ? "linear-gradient(135deg,#5b5ef4,#818cf8)"
                  : "var(--bg-3)",

              color:
                effectiveCls ===
                  cls
                  ? "#fff"
                  : "var(--text-2)",
            }}
          >
            {cls === "all"
              ? "All Classes"
              : cls}
          </button>
        ))}
      </div>

      {/* REPORTS */}

      {classesToShow.map(
        cls => {
          const cs =
            data.students.filter(
              s =>
                s.classSection ===
                cls
            );

          return (
            <ClassReport
              key={cls}
              cls={cls}
              students={cs}
              onExport={
                exportXlsx
              }
            />
          );
        }
      )}
    </div>
  );
}
