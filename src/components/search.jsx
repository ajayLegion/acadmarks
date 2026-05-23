import { useMemo, useState } from "react";
import { IA_THRESHOLD } from "../utils/constants";
import {
    getCourseLoadStatus,
    getStudentCourses,
    isStudentAtRisk,
} from "../utils/helpers";
import { EmptyState } from "./EmptyState";

export function Search({ data, update, notify }) {
    const [search, setSearch] = useState("");

    const normalizedSearch = search.trim().toLowerCase();

    // Single-student focused search
    const filtered = useMemo(() => {
        if (normalizedSearch.length < 2) return [];

        // Exact SRN match
        const exactSRN = data.students.find(
            s => s.SRN?.toLowerCase() === normalizedSearch
        );

        if (exactSRN) return [exactSRN];

        // Exact name match
        const exactName = data.students.find(
            s => s.name?.toLowerCase() === normalizedSearch
        );

        if (exactName) return [exactName];

        // Partial match fallback
        const partial = data.students.find(
            s =>
                s.name?.toLowerCase().includes(normalizedSearch) ||
                s.SRN?.toLowerCase().includes(normalizedSearch)
        );

        return partial ? [partial] : [];
    }, [normalizedSearch, data.students]);

    const atRiskList = filtered.filter(isStudentAtRisk);

    const del = id => {
        update(d => {
            d.students = d.students.filter(s => s.id !== id);
            return d;
        });

        notify("Student removed");
    };

    const edit = student => {
        console.log("Edit student:", student);
    };

    return (
        <div className="card">
    
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                    textAlign: "center",
                }}
            >
                <div
                    className="card-title"
                    style={{
                        marginBottom: 14,
                    }}
                >
                    Student Search

                    {filtered.length > 0 && (
                        <span
                            style={{
                                marginLeft: 10,
                                fontSize: 13,
                                color: "var(--text-2)",
                                fontWeight: 500,
                            }}
                        >
                            (1 Student Found)
                        </span>
                    )}
                </div>

                <input
                    className="form-input"
                    style={{
                        width: "100%",
                        maxWidth: 420,
                        marginBottom: 0,
                        textAlign: "center",
                        fontSize: 16,
                        padding: "14px 18px",
                        borderRadius: 14,
                    }}
                    placeholder="Search by Name or SRN"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            

            {/* Minimum chars */}
            {normalizedSearch.length > 0 &&
                normalizedSearch.length < 2 && (
                    <EmptyState msg="Type at least 2 characters" />
                )}

        

            {/* Student Card */}
            {filtered.length > 0 ? (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    {filtered.map(student => {
                        const courses = getStudentCourses(student);

                        const lowIA = courses.filter(
                            c =>
                                Number(c.iaI) < IA_THRESHOLD ||
                                Number(c.iaII) < IA_THRESHOLD
                        ).length;

                        const load = getCourseLoadStatus(student);

                        const risk = lowIA > 0 || !load.ok;

                        return (
                            <div
                                key={student.id}
                                className="student-card"
                                style={{
                                    border: risk
                                        ? "1px solid #fca5a5"
                                        : "1px solid var(--border)",
                                    borderRadius: 20,
                                    padding: 22,
                                    background: risk
                                        ? "#fff7ed"
                                        : "var(--card-bg)",
                                    boxShadow:
                                        "0 6px 18px rgba(0,0,0,0.06)",
                                    transition: "0.25s ease",
                                }}
                            >
                                {/* Top */}
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        gap: 16,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 24,
                                                fontWeight: 800,
                                                color: "var(--text-h)",
                                                marginBottom: 6,
                                            }}
                                        >
                                            {student.name}
                                        </div>

                                        <div
                                            style={{
                                                color: "var(--text-2)",
                                                fontSize: 14,
                                                fontWeight: 500,
                                            }}
                                        >
                                            {student.SRN}
                                        </div>
                                    </div>

                                    <span
                                        className={
                                            risk
                                                ? "chip chip-risk"
                                                : "chip chip-pass"
                                        }
                                    >
                                        {risk ? "AT RISK" : "SAFE"}
                                    </span>
                                </div>

                                {/* Info Grid */}
                                <div
                                    style={{
                                        marginTop: 20,
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(auto-fit,minmax(160px,1fr))",
                                        gap: 14,
                                    }}
                                >
                                    <div className="info-box">
                                        <div className="info-label">
                                            Department
                                        </div>

                                        <div className="info-value">
                                            {student.department || "-"}
                                        </div>
                                    </div>

                                    <div className="info-box">
                                        <div className="info-label">
                                            Semester
                                        </div>

                                        <div className="info-value">
                                            {student.semester || "-"}
                                        </div>
                                    </div>

                                    <div className="info-box">
                                        <div className="info-label">
                                            Class
                                        </div>

                                        <div className="info-value">
                                            {student.classSection || "-"}
                                        </div>
                                    </div>

                                    <div className="info-box">
                                        <div className="info-label">
                                            Courses
                                        </div>

                                        <div className="info-value">
                                            {courses.length}
                                        </div>
                                    </div>

                                    <div className="info-box">
                                        <div className="info-label">
                                            Low IA Subjects
                                        </div>

                                        <div
                                            className="info-value"
                                            style={{
                                                color:
                                                    lowIA > 0
                                                        ? "#ef4444"
                                                        : "#22c55e",
                                            }}
                                        >
                                            {lowIA}
                                        </div>
                                    </div>

                                    <div className="info-box">
                                        <div className="info-label">
                                            Course Load
                                        </div>

                                        <div className="info-value">
                                            <span
                                                className={
                                                    load.ok
                                                        ? "chip chip-pass"
                                                        : "chip chip-risk"
                                                }
                                            >
                                                {load.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Course List */}
                                <div
                                    style={{
                                        marginTop: 24,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: 700,
                                            marginBottom: 12,
                                            fontSize: 16,
                                        }}
                                    >
                                        Courses
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 10,
                                        }}
                                    >
                                        {courses.length > 0 ? (
                                            courses.map(course => {
                                                const danger =
                                                    Number(course.iaI) <
                                                        IA_THRESHOLD ||
                                                    Number(course.iaII) <
                                                        IA_THRESHOLD;

                                                return (
                                                    <div
                                                        key={course.id}
                                                        style={{
                                                            border:
                                                                "1px solid var(--border)",
                                                            borderRadius: 14,
                                                            padding: 14,
                                                            background: danger
                                                                ? "#fef2f2"
                                                                : "#fafafa",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                justifyContent:
                                                                    "space-between",
                                                                alignItems:
                                                                    "center",
                                                                gap: 10,
                                                                flexWrap:
                                                                    "wrap",
                                                            }}
                                                        >
                                                            <div>
                                                                <div
                                                                    style={{
                                                                        fontWeight: 700,
                                                                    }}
                                                                >
                                                                    {course.courseName ||
                                                                        "Unnamed Course"}
                                                                </div>

                                                                <div
                                                                    style={{
                                                                        fontSize: 13,
                                                                        color: "var(--text-2)",
                                                                        marginTop: 4,
                                                                    }}
                                                                >
                                                                    {
                                                                        course.courseCode
                                                                    }
                                                                </div>
                                                            </div>

                                                            <span
                                                                className={
                                                                    danger
                                                                        ? "chip chip-risk"
                                                                        : "chip chip-pass"
                                                                }
                                                            >
                                                                {danger
                                                                    ? "LOW IA"
                                                                    : "GOOD"}
                                                            </span>
                                                        </div>

                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: 16,
                                                                marginTop: 14,
                                                                flexWrap: "wrap",
                                                            }}
                                                        >
                                                            <div>
                                                                <b>IA-I:</b>{" "}
                                                                {course.iaI ??
                                                                    "-"}
                                                            </div>

                                                            <div>
                                                                <b>IA-II:</b>{" "}
                                                                {course.iaII ??
                                                                    "-"}
                                                            </div>

                                                            <div>
                                                                <b>Avg:</b>{" "}
                                                                {(
                                                                    (Number(
                                                                        course.iaI
                                                                    ) || 0) +
                                                                    (Number(
                                                                        course.iaII
                                                                    ) || 0)
                                                                ) / 2}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <EmptyState msg="No courses assigned" />
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div
                                    style={{
                                        marginTop: 22,
                                        display: "flex",
                                        gap: 10,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => edit(student)}
                                    >
                                        Edit Student
                                    </button>

                                    <button
                                        className="btn btn-danger"
                                        onClick={() => del(student.id)}
                                    >
                                        Delete Student
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                normalizedSearch.length >= 2 && (
                    <EmptyState msg="No matching student found" />
                )
            )}

            
        </div>
    );
}
