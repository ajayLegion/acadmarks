import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { uid, isAtRisk } from "../utils/helpers";

export function ExcelUpload({ data, update, notify }) {
  const [preview,    setPreview]    = useState(null);
  const [status,     setStatus]     = useState("");
  const [dragging,   setDragging]   = useState(false);
  const [atRiskList, setAtRiskList] = useState([]);
  const fileRef = useRef();

  const processFile = file => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext))
      return notify("Upload .xlsx, .xls, or .csv", "error");

    const reader = new FileReader();
    reader.onload = e => {
      const wb   = XLSX.read(e.target.result, { type: "binary" });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (!rows.length) return notify("Empty sheet", "error");

      const atRisk = rows.filter(row => {
        const iaI  = Number(row["IA-I"]  || 0);
        const iaII = Number(row["IA-II"] || 0);
        return isAtRisk(iaI, iaII);
      });

      setPreview(rows);
      setAtRiskList(atRisk);
      setStatus(`✅ ${rows.length} rows loaded · ⚠️ ${atRisk.length} students at risk (IA < 9)`);
    };
    reader.readAsBinaryString(file);
  };

  const importData = () => {
    if (!preview) return;
    let added = 0, updated = 0;
    update(d => {
      preview.forEach(row => {
        const SRN = String(row["SRN"]       || "").trim();
        const name   = String(row["Student Name"]  || "").trim();
        const iaI    = Number(row["IA-I"]  || 0);
        const iaII   = Number(row["IA-II"] || 0);
        if (!SRN || !name) return;

        let student = d.students.find(s => s.SRN === SRN);
        if (!student) {
          student = {
            id: uid(), SRN, name,
            department: row["Department"] || "",
            semester:   String(row["Semester"] || ""),
            iaI, iaII,
          };
          d.students.push(student);
          added++;
        } else {
          student.name = name;
          student.iaI  = iaI;
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

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["SRN", "Student Name", "IA-I", "IA-II", "Department", "Semester"],
      ["EE101", "Alice Kumar",  "15", "18", "EEE", "2"],
      ["EE102", "Bob Sharma",   "8",  "12", "EEE", "2"],
      ["EE103", "Carol Singh",  "22", "20", "EEE", "2"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    XLSX.writeFile(wb, "ia_marks_template.xlsx");
  };

  return (
    <div>
      {/* Format info */}
      <div className="info-box">
        <b>📌 Excel Format Required</b><br />
        Required columns: <code>SRN</code> <code>Student Name</code> <code>IA-I</code> <code>IA-II</code><br />
        Optional: <code>Department</code> <code>Semester</code>
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={downloadTemplate}>
            ⬇ Download Template
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone${dragging ? " drag-active" : ""}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current.click()}
      >
        <div style={{ fontSize: 44, marginBottom: 10 }}>📂</div>
        <div style={{ fontWeight: 700, fontSize: 17, color: "var(--text-h)" }}>
          Drag & drop your Excel file here
        </div>
        <div style={{ color: "var(--text-2)", marginTop: 6, fontSize: 13.5 }}>
          or click to browse · supports .xlsx, .xls, .csv
        </div>
        <input
          ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={e => processFile(e.target.files[0])}
        />
      </div>

      {/* Status */}
      {status && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
          marginBottom: 12,
          background: atRiskList.length > 0 ? "#fffbeb" : "#f0fdf4",
          color:      atRiskList.length > 0 ? "#92400e" : "#15803d",
          border:     `1px solid ${atRiskList.length > 0 ? "#fcd34d" : "#86efac"}`,
        }}>
          {status}
        </div>
      )}

      {/* At-risk preview */}
      {atRiskList.length > 0 && (
        <div className="warn-box" style={{ marginBottom: 16 }}>
          <b>⚠️ At-Risk Students in Upload (IA &lt; 9)</b>
          {atRiskList.map((s, i) => (
            <div key={i} style={{ fontSize: 13, marginTop: 6 }}>
              <b>{s["Student Name"]}</b>
              <span style={{ color: "#78350f" }}> ({s["SRN"]})</span>
              {" — "}IA-I: <b>{s["IA-I"]}</b> · IA-II: <b>{s["IA-II"]}</b>
            </div>
          ))}
        </div>
      )}

      {/* Preview table */}
      {preview && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 14 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              Preview ({preview.length} rows)
            </div>
            <button className="btn btn-primary btn-sm" onClick={importData}>
              ⬆ Import All
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {Object.keys(preview[0]).map(k => <th key={k}>{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((row, i) => {
                  const isRisk = isAtRisk(Number(row["IA-I"] || 0), Number(row["IA-II"] || 0));
                  return (
                    <tr key={i} style={{ background: isRisk ? "#fffbeb" : "transparent" }}>
                      {Object.values(row).map((v, j) => (
                        <td key={j}>{String(v)}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {preview.length > 10 && (
              <div style={{ textAlign: "center", padding: 12,
                color: "var(--text-2)", fontSize: 13 }}>
                … and {preview.length - 10} more rows
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
