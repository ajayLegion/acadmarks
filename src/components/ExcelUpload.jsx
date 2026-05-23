import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { styles } from "../utils/constants";
import { uid } from "../utils/helpers";

export function ExcelUpload({ data, update, notify }) {
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const EXPECTED = ["Roll No", "Student Name", "Course Code", "Course Name", "Marks", "Max Marks"];

  const processFile = file => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) return notify("Upload .xlsx, .xls, or .csv", "error");
    const reader = new FileReader();
    reader.onload = e => {
      const wb = XLSX.read(e.target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (!rows.length) return notify("Empty sheet", "error");
      setPreview(rows);
      setStatus(`✅ ${rows.length} rows loaded from "${file.name}"`);
    };
    reader.readAsBinaryString(file);
  };

  const importData = () => {
    if (!preview) return;
    let added = 0, updated = 0, errors = [];
    update(d => {
      preview.forEach((row, i) => {
        const rollNo = String(row["Roll No"] || row["roll_no"] || row["rollNo"] || "").trim();
        const name   = String(row["Student Name"] || row["student_name"] || row["Name"] || "").trim();
        const code   = String(row["Course Code"] || row["course_code"] || "").trim();
        const cname  = String(row["Course Name"] || row["course_name"] || "").trim();
        const marks  = Number(row["Marks"] || row["marks"] || 0);
        const maxM   = Number(row["Max Marks"] || row["max_marks"] || 100);

        if (!rollNo || !name || !code) { errors.push(`Row ${i + 2}: missing required fields`); return; }

        let course = d.courses.find(c => c.code === code);
        if (!course) { course = { id: uid(), code, name: cname || code, credits: "", maxMarks: String(maxM) }; d.courses.push(course); }

        let student = d.students.find(s => s.rollNo === rollNo);
        if (!student) {
          student = { id: uid(), rollNo, name, department: row["Department"] || "", semester: String(row["Semester"] || ""), subjects: [] };
          d.students.push(student);
          added++;
        } else {
          student.name = name;
          updated++;
        }

        const idx = student.subjects.findIndex(s => s.courseId === course.id);
        const entry = { courseId: course.id, courseName: course.name, marks, maxMarks: maxM };
        if (idx >= 0) student.subjects[idx] = entry; else student.subjects.push(entry);
      });
      return d;
    });
    notify(`Imported: ${added} new students, ${updated} updated. ${errors.length ? errors.slice(0,3).join("; ") : ""}`);
    setPreview(null);
    setStatus("");
  };

  return (
    <div>
      <div style={styles.infoBox}>
        <b>📌 Excel Format Required</b><br />
        Columns: <code>{EXPECTED.join(" | ")}</code><br />
        Optional: Department, Semester<br />
        <button style={{ ...styles.btn, marginTop: 10, width: "auto", padding: "8px 20px" }} onClick={() => {
          const ws = XLSX.utils.aoa_to_sheet([
            [...EXPECTED, "Department", "Semester"],
            ["CS001","Alice Kumar","CS101","Data Structures","85","100","CSE","3"],
            ["CS002","Bob Sharma","CS101","Data Structures","72","100","CSE","3"],
          ]);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Marks");
          XLSX.writeFile(wb, "marks_template.xlsx");
        }}>⬇ Download Template</button>
      </div>

      <div style={{ ...styles.dropZone, ...(dragging ? styles.dropActive : {}) }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current.click()}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
        <div style={{ fontWeight: 700, fontSize: 18, color: "#374151" }}>Drag & drop Excel file here</div>
        <div style={{ color: "#9CA3AF", marginTop: 6 }}>or click to browse (.xlsx, .xls, .csv)</div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={e => processFile(e.target.files[0])} />
      </div>

      {status && <div style={styles.successNote}>{status}</div>}

      {preview && (
        <div style={styles.tableCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={styles.cardTitle}>Preview ({preview.length} rows)</div>
            <button style={{ ...styles.btn, width: "auto", padding: "8px 24px" }} onClick={importData}>⬆ Import All</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>{Object.keys(preview[0]).map(k => <th key={k} style={styles.th}>{k}</th>)}</tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((row, i) => (
                  <tr key={i} style={styles.tr}>
                    {Object.values(row).map((v, j) => <td key={j} style={styles.td}>{String(v)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && <div style={{ textAlign: "center", padding: 10, color: "#9CA3AF" }}>… and {preview.length - 10} more rows</div>}
          </div>
        </div>
      )}
    </div>
  );
}
