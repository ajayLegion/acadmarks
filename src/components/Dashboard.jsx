import { IA_MAX, IA_THRESHOLD } from "../utils/constants";
import {
  average,
  flattenCourseRows,
} from "../utils/helpers";
import { EmptyState } from "./EmptyState";

/* ───────────────── HELPERS ───────────────── */

function pct(n, total) {
  return total > 0
    ? Math.round((n / total) * 100)
    : 0;
}

/* ───────────────── DISTRIBUTION BAR ───────────────── */

function DistBar({
  label,
  count,
  total,
  color,
}) {
  const p = pct(count, total);

  return (
    <div className="dist-bar-row">
      <span className="dist-label">
        {label}
      </span>

      <div className="dist-track">
        <div
          className="dist-fill"
          style={{
            width: `${p}%`,
            background: color,
            minWidth:
              count > 0 ? 28 : 0,
          }}
        >
          {p > 10 ? `${p}%` : ""}
        </div>
      </div>

      <span className="dist-count">
        {count}
      </span>
    </div>
  );
}

/* ───────────────── IA CARD ───────────────── */

function IACard({
  title,
  field,
  records,
  students,
}) {
  const vals = records
    .map((r) => r[field])
    .filter(
      (v) =>
        v !== null &&
        v !== undefined &&
        v !== ""
    );

  if (!vals.length) {
    return (
      <div className="card">
        <div className="card-title">
          {title}
        </div>

        <EmptyState msg="No IA data available" />
      </div>
    );
  }

  /* ───────────────── BASIC STATS ───────────────── */

  const avg = (
    vals.reduce((a, b) => a + b, 0) /
    vals.length
  ).toFixed(1);

  const highest = Math.max(...vals);

  const lowest = Math.min(...vals);

  /* ───────────────── STUDENT PASS LOGIC ───────────────── */

  const totalStudents =
    students.length;

  const passedStudents =
    students.filter((student) => {
      const studentRecords =
        records.filter(
          (r) =>
            r.studentId ===
            student.id
        );

      if (!studentRecords.length)
        return false;

      const avgMarks =
        studentRecords.reduce(
          (sum, r) =>
            sum + (r[field] || 0),
          0
        ) /
        studentRecords.length;

      return (
        avgMarks >= IA_THRESHOLD
      );
    }).length;

  const passRate = pct(
    passedStudents,
    totalStudents
  );

  /* ───────────────── DISTRIBUTION ───────────────── */

  const buckets = [
    {
      label: "< 5",
      count: vals.filter(
        (v) => v < 5
      ).length,
      color: "#ef4444",
    },

    {
      label: "5–8",
      count: vals.filter(
        (v) =>
          v >= 5 &&
          v < IA_THRESHOLD
      ).length,
      color: "#f59e0b",
    },

    {
      label: "9–14",
      count: vals.filter(
        (v) =>
          v >= IA_THRESHOLD &&
          v <= 14
      ).length,
      color: "#3b82f6",
    },

    {
      label: "15–19",
      count: vals.filter(
        (v) =>
          v >= 15 &&
          v <= 19
      ).length,
      color: "#22c55e",
    },

    {
      label: "20+",
      count: vals.filter(
        (v) => v >= 20
      ).length,
      color: "#5b5ef4",
    },
  ];

  return (
    <div className="card">
      {/* ───────────────── HEADER ───────────────── */}

      <div className="card-title">
        {title}

        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            fontWeight: 700,

            color:
              passRate >= 75
                ? "#22c55e"
                : passRate >= 50
                  ? "#f59e0b"
                  : "#ef4444",

            background:
              passRate >= 75
                ? "#f0fdf4"
                : passRate >= 50
                  ? "#fffbeb"
                  : "#fff1f2",

            padding: "2px 10px",
            borderRadius: 999,
          }}
        >
          {passRate}% pass
        </span>
      </div>

      {/* ───────────────── STATS ───────────────── */}

      <div className="ia-stat-row">
        {[
          [
            "Average",
            `${avg}/${IA_MAX}`,
            "#5b5ef4",
          ],

          [
            "Highest",
            `${highest}/${IA_MAX}`,
            "#22c55e",
          ],

          [
            "Lowest",
            `${lowest}/${IA_MAX}`,
            "#ef4444",
          ],

          [
            "Passed",
            `${passedStudents}/${totalStudents}`,
            "#111827",
          ],
        ].map(
          ([label, value, color]) => (
            <div
              className="ia-stat"
              key={label}
            >
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
          )
        )}
      </div>

      {/* ───────────────── PASS BAR ───────────────── */}

      <div
        style={{
          margin: "16px 0 12px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",

            fontSize: 11,
            color: "#8b90a7",
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          <span>
            Students Passed
          </span>

          <span>
            {passedStudents} pass ·{" "}
            {totalStudents -
              passedStudents}{" "}
            fail
          </span>
        </div>

        <div className="stats-bar">
          <div
            className="stats-fill"
            style={{
              width: `${passRate}%`,
            }}
          />
        </div>
      </div>

      {/* ───────────────── DISTRIBUTION ───────────────── */}

      <div
        style={{
          fontSize: 11,
          color: "#8b90a7",
          fontWeight: 700,
          textTransform:
            "uppercase",
          letterSpacing: "0.5px",
          marginBottom: 8,
        }}
      >
        Distribution (Out of{" "}
        {IA_MAX})
      </div>

      {buckets.map((b) => (
        <DistBar
          key={b.label}
          {...b}
          total={vals.length}
        />
      ))}
    </div>
  );
}

/* ───────────────── DASHBOARD ───────────────── */

export function Dashboard({
  data,
  selClass,
  classes,
}) {
  const { students } = data;

  /* ───────────────── FILTER ───────────────── */

  const viewStudents =
    selClass === "all"
      ? students
      : students.filter(
        (s) =>
          s.classSection ===
          selClass
      );

  const viewRecords =
    flattenCourseRows(
      viewStudents
    );

  return (
    <div>
      {/* ───────────────── TITLE ───────────────── */}

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-2)",
          textTransform:
            "uppercase",
          letterSpacing: "0.8px",
          borderBottom:
            "1px solid var(--border-soft)",
          paddingBottom: 8,
          marginBottom: 16,
        }}
      >
        Internal Assessment
        Analysis
      </div>

      {/* ───────────────── ALL CLASSES ───────────────── */}

      {selClass === "all" ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {classes.map((cls) => {
            const cs =
              students.filter(
                (s) =>
                  s.classSection ===
                  cls
              );

            if (!cs.length)
              return null;

            const rows =
              flattenCourseRows(
                cs
              );

            return (
              <div key={cls}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    marginBottom: 12,
                  }}
                >
                  Class {cls}
                </div>

                <div className="ia-analysis-grid">
                  <IACard
                    title="📝 IA-I Analysis"
                    field="iaI"
                    records={rows}
                    students={cs}
                  />

                  <IACard
                    title="📋 IA-II Analysis"
                    field="iaII"
                    records={rows}
                    students={cs}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ───────────────── SINGLE CLASS ───────────────── */

        <div className="ia-analysis-grid">
          <IACard
            title={`📝 IA-I — Class ${selClass}`}
            field="iaI"
            records={viewRecords}
            students={viewStudents}
          />

          <IACard
            title={`📋 IA-II — Class ${selClass}`}
            field="iaII"
            records={viewRecords}
            students={viewStudents}
          />
        </div>
      )}
    </div>
  );
}