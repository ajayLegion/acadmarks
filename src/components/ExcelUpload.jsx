import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { styles } from "../utils/constants";
import { uid, isAtRisk } from "../utils/helpers";

export function ExcelUpload({ data, update, notify }) {
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("");
  const [dragging, setDragging] = useState(false);
  const [atRiskList, setAtRiskList] = useState([]);
  const fileRef = useRef();

  const EXPECTED = ["Roll No", "Student Name", "IA-I", "IA-II"];

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

      const atRisk = rows.filter(row => {
        const iaI = Number(row["IA-I"] || 0);
        const iaII = Number(row["IA-II"] || 0);
        return isAtRisk(iaI, iaII);
      });

      setPreview(rows);
      setAtRiskList(atRisk);
      setStatus(`✅ ${rows.length} rows loaded. ⚠️ ${atRisk.length} students at risk (IA < 9)`);
    };
    reader.readAsBinaryString(file);
  };

  const importData = () => {
    if (!preview) return;
    let added = 0, updated = 0;
    update(d => {
      preview.forEach(row => {
        const rollNo = String(row["Roll No"] || "").trim();
        const name = String(row["Student Name"] || "").trim();
        const iaI = Number(row["IA-I"] || 0);
        const iaII = Number(row["IA-II"] || 0);

        if (!rollNo || !name) return;

        let student = d.students.find(s => s.rollNo === rollNo);
        if (!student) {
          student = { id: uid(), rollNo, name, department: row["Department"] || "", semester: String(row["Semester"] || ""), iaI, iaII };
          d.students.push(student);
          added++;
        } else {
          student.name = name;
          student.iaI = iaI;
          student.iaII = iaII;
          updated++;
        }
      });
      return d;
    });
    notify(`Imported: ${added} new, ${updated} updated`);
    setPreview(null);
    setAtRiskList([]);
    setStatus("");
  };

  return (
    <div>
      <div style={styles.infoBox}>
        <b>📌 Excel Format Required</b><br />
        Columns: <code>Roll No | Student Name | IA-I | IA-II</code><br />
        Optional: Department, Semester<br />
        <button style={{ ...styles.btn, marginTop: 10, width: "auto", padding: "8px 20px" }} onClick={() => {
          const ws = XLSX.utils.aoa_to_sheet([
            ["Roll No", "Student Name", "IA-I", "IA-II", "Department", "Semester"],
            ["EE101", "Alice Kumar", "15", "18", "EEE", "2"],
            ["EE102", "Bob Sharma", "8", "12", "EEE", "2"],
            ["EE103", "Carol Singh", "22", "20", "EEE", "2"],
          ]);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Marks");
          XLSX.writeFile(wb, "ia_marks_template.xlsx");
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

      {status && <div style={{ ...styles.successNote, background: atRiskList.length > 0 ? "#FEF3C7" : "#DCFCE7", color: atRiskList.length > 0 ? "#92400E" : "#15803D" }}>{status}</div>}

      {atRiskList.length > 0 && (
        <div style={{ ...styles.infoBox, background: "#FEF3C7", border: "1px solid #FCD34D", marginTop: 16 }}>
          <b> ⚠️ At-Risk Students (IA &lt; 9)</b><br />
          {atRiskList.map((s, i) => (
            <div key={i} style={{ fontSize: 13, marginTop: 6 }}>
              <b>{s["Student Name"]}</b> ({s["Roll No"]}) — IA-I: {s["IA-I"]}, IA-II: {s["IA-II"]}
            </div>
          ))}
        </div>
      )}

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
                {preview.slice(0, 10).map((row, i) => {
                  const isRisk = isAtRisk(Number(row["IA-I"] || 0), Number(row["IA-II"] || 0));
                  return (
                    <tr key={i} style={{ ...styles.tr, background: isRisk ? "#FEF3C7" : "transparent" }}>
                      {Object.values(row).map((v, j) => <td key={j} style={styles.td}>{String(v)}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {preview.length > 10 && <div style={{ textAlign: "center", padding: 10, color: "#9CA3AF" }}>… and {preview.length - 10} more rows</div>}
          </div>
        </div>
      )}
    </div>
  );
}
