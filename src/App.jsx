import { useState, useCallback } from "react";
import { load, save } from "./utils/helpers";
import { Dashboard } from "./components/Dashboard";
import { Students } from "./components/Students";
import { ExcelUpload } from "./components/ExcelUpload";
import { Reports } from "./components/Reports";

export default function App() {
  const [tab, setTab]           = useState("dashboard");
  const [data, setData]         = useState(load);
  const [toast, setToast]       = useState(null);
  const [semType, setSemType]   = useState("even"); // "odd" | "even"

  const semInfo = {
    odd:  { label: "Odd Semester",  nums: "1, 3, 5, 7", badge: "Odd Semesters (1,3,5,7)" },
    even: { label: "Even Semester", nums: "2, 4, 6, 8", badge: "Even Semesters (2,4,6,8)" },
  };

  const update = useCallback(fn => {
    setData(prev => {
      const next = fn(structuredClone(prev));
      save(next);
      return next;
    });
  }, []);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const nav = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "students",  icon: "🎓", label: "Students"  },
    { id: "upload",    icon: "⬆️",  label: "Excel Upload" },
    { id: "reports",   icon: "📄", label: "Reports"   },
  ];

  const atRisk = data.students.filter(s => (s.iaI || 0) < 9 || (s.iaII || 0) < 9).length;

  return (
    <div className="app-shell">
      {/* ── Sidebar ───────────────────────────────── */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">🏛</div>
          <div>
            <div className="brand-title">AcadMarks</div>
            <div className="brand-sub">IA Tracking Portal</div>
          </div>
        </div>

        {/* Semester toggle */}
        <div style={{ padding: "10px 14px 2px" }}>
          <div style={{ fontSize: 10, color: "#3d4270", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>
            Semester Type
          </div>
          <div className="sem-toggle">
            <button
              className={semType === "odd" ? "active" : ""}
              onClick={() => setSemType("odd")}
            >
              Odd<br />
              <span style={{ fontSize: 9, opacity: 0.7 }}>1·3·5·7</span>
            </button>
            <button
              className={semType === "even" ? "active" : ""}
              onClick={() => setSemType("even")}
            >
              Even<br />
              <span style={{ fontSize: 9, opacity: 0.7 }}>2·4·6·8</span>
            </button>
          </div>
        </div>

        <div className="sem-label">Navigation</div>

        <nav>
          {nav.map(n => (
            <button
              key={n.id}
              className={`nav-btn${tab === n.id ? " active" : ""}`}
              onClick={() => setTab(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="side-stats">
          <div className="stat-pill">
            <span>Students</span>
            <b>{data.students.length}</b>
          </div>
          <div className="stat-pill">
            <span>At Risk</span>
            <b style={{ color: atRisk > 0 ? "#f87171" : "#86efac" }}>{atRisk}</b>
          </div>
          <div className="stat-pill">
            <span>Semester</span>
            <b style={{ color: "#a5b4fc", fontSize: 11 }}>{semType === "odd" ? "Odd" : "Even"}</b>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────── */}
      <main className="main-area">
        <header className="topbar">
          <div className="page-title">
            <span>{nav.find(n => n.id === tab)?.icon}</span>
            {nav.find(n => n.id === tab)?.label}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="sem-badge">
              {semInfo[semType].badge}
            </span>
          </div>
        </header>

        <div className="content-area">
          {tab === "dashboard" && <Dashboard data={data} semType={semType} />}
          {tab === "students"  && <Students  data={data} update={update} notify={notify} />}
          {tab === "upload"    && <ExcelUpload data={data} update={update} notify={notify} />}
          {tab === "reports"   && <Reports   data={data} notify={notify} />}
        </div>
      </main>

      {/* ── Toast ─────────────────────────────────── */}
      {toast && (
        <div
          className="toast"
          style={{ background: toast.type === "success" ? "#22c55e" : "#ef4444" }}
        >
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}
