import { useState } from "react";
import * as XLSX from "xlsx";
import { IA_MAX, IA_THRESHOLD } from "../utils/constants";
import {
  average,
  flattenCourseRows,
  isStudentAtRisk,
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

/* ───────────────────────────────────────────── */
/* IA STATS */
/* ───────────────────────────────────────────── */

function IAStats({
  students,
  field,
  label,
}) {
  const vals = students
    .map(s => s[field])
    .filter(v => v !== null);

  if (!vals.length) return null;

  const total = vals.length;

  const avg = average(vals).toFixed(1);

  const highest =
    Math.max(...vals);

  const lowest =
    Math.min(...vals);

  const passing = vals.filter(
    v => v >= IA_THRESHOLD
  ).length;

  const passRate = Math.round(
    (passing / total) * 100
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
        style={{
          marginTop: 0,
        }}
      >
        <Stat
          label="Avg"
          value={avg}
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
          value={`${passing}/${total}`}
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

  const atRisk =
    students.filter(
      isStudentAtRisk
    );

  const passing =
    students.filter(
      s => !isStudentAtRisk(s)
    );

  const passRate =
    students.length
      ? Math.round(
        (passing.length /
          students.length) *
        100
      )
      : 0;

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
            {passRate}% passing
          </span>

          {atRisk.length >
            0 && (
              <span className="chip chip-risk">
                ⚠️{" "}
                {atRisk.length}{" "}
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
              students={courseRows}
              field="iaI"
              label="IA-I"
            />

            <IAStats
              students={courseRows}
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
                <th>IA-II</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {courseRows.map(
                row => {
                  const iaI =
                    row.iaI;

                  const iaII =
                    row.iaII;

                  const total =
                    (iaI || 0) +
                    (iaII || 0);

                  const risk =
                    (!row.iaIAbsent &&
                      iaI !==
                      null &&
                      iaI <
                      IA_THRESHOLD) ||
                    (!row.iaIIAbsent &&
                      iaII !==
                      null &&
                      iaII <
                      IA_THRESHOLD);

                  return (
                    <tr
                      key={`${row.student.id}-${row.courseCode}`}
                      style={{
                        background:
                          risk
                            ? "#fffbeb"
                            : "transparent",
                      }}
                    >
                      <td>
                        <code
                          style={{
                            fontSize: 12,

                            background:
                              risk
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
                            risk
                              ? "#ef4444"
                              : "var(--text-h)",
                        }}
                      >
                        {row.iaIAbsent
                          ? "ABSENT"
                          : iaI}
                      </td>

                      <td
                        style={{
                          fontWeight: 700,

                          color:
                            risk
                              ? "#ef4444"
                              : "var(--text-h)",
                        }}
                      >
                        {row.iaIIAbsent
                          ? "ABSENT"
                          : iaII}
                      </td>

                      <td
                        style={{
                          fontWeight: 800,

                          color:
                            "#5b5ef4",
                        }}
                      >
                        {total}/
                        {IA_MAX * 2}
                      </td>

                      <td>
                        <span
                          className={
                            risk
                              ? "chip chip-risk"
                              : "chip chip-pass"
                          }
                        >
                          {risk
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

    let rows = [];

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
            row.iaIAbsent
              ? "ABSENT"
              : row.iaI,

          "Status":
            row.iaIAbsent
              ? "Absent"
              : row.iaI <
                IA_THRESHOLD
                ? "At Risk"
                : "Pass",
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
            row.iaIIAbsent
              ? "ABSENT"
              : row.iaII,

          "Status":
            row.iaIIAbsent
              ? "Absent"
              : row.iaII <
                IA_THRESHOLD
                ? "At Risk"
                : "Pass",
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
            (!row.iaIAbsent &&
              row.iaI <
              IA_THRESHOLD) ||
            (!row.iaIIAbsent &&
              row.iaII <
              IA_THRESHOLD)
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
            row.iaIAbsent
              ? "ABSENT"
              : row.iaI,

          "IA-II":
            row.iaIIAbsent
              ? "ABSENT"
              : row.iaII,

          "Status":
            "At Risk",
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
            row.iaIAbsent
              ? "ABSENT"
              : row.iaI,

          "IA-II":
            row.iaIIAbsent
              ? "ABSENT"
              : row.iaII,

          "Total":
            (row.iaI ||
              0) +
            (row.iaII ||
              0),

          "Status":
            (!row.iaIAbsent &&
              row.iaI <
              IA_THRESHOLD) ||
              (!row.iaIIAbsent &&
                row.iaII <
                IA_THRESHOLD)
              ? "At Risk"
              : "Pass",
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

    let fname = "";

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