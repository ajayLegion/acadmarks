import { useState, useCallback } from "react";
import { isStudentAtRisk, load, normalizeData, save } from "./utils/helpers";
import { Search } from "./components/search";
import { Dashboard } from "./components/Dashboard";
import { Students } from "./components/Students";
import { ExcelUpload } from "./components/ExcelUpload";
import { Reports } from "./components/Reports";
import { Courses } from "./components/Courses";
import { MarksEntry } from "./components/MarksEntry";
import { CLASS_MAP } from "./utils/constants";

import "./App.css";
import logo from "./assets/reva-2.png";

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState(load);
  const [toast, setToast] = useState(null);
  const [semType, setSemType] = useState("even");        // "odd" | "even"
  const [selClass, setSelClass] = useState("all");         // "all" | "2A" | …

  const classes = CLASS_MAP[semType];

  /* reset class selection when sem type changes */
  const changeSem = t => { setSemType(t); setSelClass("all"); };
  const [menuOpen, setMenuOpen] = useState(true);

  const update = useCallback(fn => {
    setData(prev => {
      const next = normalizeData(fn(structuredClone(prev)));
      save(next);
      return next;
    });
  }, []);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const nav = [
    { id: "search", icon: "🔍", label: "Search" },
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "students", icon: "🎓", label: "Students" },
    { id: "courses", icon: "📚", label: "Courses" },
    { id: "marks", icon: "✏️", label: "Marks Entry" },
    { id: "upload", icon: "⬆️", label: "Excel Upload" },
    { id: "reports", icon: "📄", label: "Reports" },
  ];

  const atRisk = data.students.filter(isStudentAtRisk).length;
  const activeLabel = selClass === "all" ? "All Classes" : `Class ${selClass}`;

  return (
    <div className={`app-shell ${menuOpen ? "menu-open" : "menu-closed"}`}>

      {/* ══ Sidebar ══════════════════════════════════════════════ */}
      <aside className={`sidebar ${menuOpen ? "show" : "hide"}`}>
        <div className="brand">
          <div className="brand-icon"><img src={logo} alt="Reva University" /></div>
          <div>
            <div className="brand-sub">IA Marks Portal For EE</div>
          </div>
        </div>

        {/* Odd / Even toggle */}
        <div style={{ padding: "10px 14px 4px" }}>
          <div style={{
            fontSize: 10, color: "#3d4270", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6
          }}>
            Semester Type
          </div>
          <div className="sem-toggle">
            {["odd", "even"].map(t => (
              <button key={t} className={semType === t ? "active" : ""}
                onClick={() => changeSem(t)}>
                {t === "odd" ? "Odd" : "Even"}<br />
                <span style={{ fontSize: 9, opacity: 0.7 }}>
                  {t === "odd" ? "1·3·5·7" : "2·4·6·8"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Class selector */}
        <div style={{ padding: "8px 14px 4px" }}>
          <div style={{
            fontSize: 10, color: "#3d4270", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6
          }}>
            Class Section
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            <button
              onClick={() => setSelClass("all")}
              style={{
                gridColumn: "span 2",
                padding: "6px 0", borderRadius: 7, border: "none", cursor: "pointer",
                fontFamily: "var(--sans)", fontSize: 12, fontWeight: 600,
                background: selClass === "all"
                  ? "linear-gradient(135deg,#5b5ef4,#818cf8)"
                  : "rgba(255,255,255,0.05)",
                color: selClass === "all" ? "#fff" : "#6b71a3",
                transition: "all 0.15s",
              }}>
              All Classes
            </button>
            {classes.map(cls => (
              <button key={cls} onClick={() => setSelClass(cls)} style={{
                padding: "6px 0", borderRadius: 7, border: "none", cursor: "pointer",
                fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700,
                background: selClass === cls
                  ? "linear-gradient(135deg,#5b5ef4,#818cf8)"
                  : "rgba(255,255,255,0.05)",
                color: selClass === cls ? "#fff" : "#6b71a3",
                transition: "all 0.15s",
              }}>{cls}</button>
            ))}
          </div>
        </div>

        <div className="sem-label" style={{ marginTop: 6 }}>Navigation</div>

        <nav>
          {nav.map(n => (
            <button key={n.id}
              className={`nav-btn${tab === n.id ? " active" : ""}`}
              onClick={() => setTab(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="side-stats">
          <div className="stat-pill">
            <span>Students</span><b>{data.students.length}</b>
          </div>
          <div className="stat-pill">
            <span>At Risk</span>
            <b style={{ color: atRisk > 0 ? "#f87171" : "#86efac" }}>{atRisk}</b>
          </div>
          <div className="stat-pill">
            <span>Viewing</span>
            <b style={{ color: "#a5b4fc", fontSize: 11 }}>{activeLabel}</b>
          </div>
        </div>
      </aside>

      {/* ══ Main ══════════════════════════════════════════════════ */}
      <main className="main-area">
        <header className="topbar">

          <div style={{ display: "flex", alignItems: "center", gap: 12  }}>

            <button
              className="menu-toggle"
              style={{ color: "black" }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? "✖" : "☰"}
            </button>

            <div className="page-title">
              <span>{nav.find(n => n.id === tab)?.icon}</span>
              {nav.find(n => n.id === tab)?.label}
            </div>

          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="sem-badge">
              {semType === "even" ? "Even" : "Odd"} Semester
            </span>

            <span
              className="sem-badge"
              style={{
                background: selClass === "all"
                  ? "var(--bg-2)"
                  : "var(--accent-bg)",
                color: selClass === "all"
                  ? "var(--text-2)"
                  : "var(--accent)",
              }}
            >
              {activeLabel}
            </span>
          </div>

        </header>

        <div className="content-area">
          {tab === "search" &&
            <Search data={data} update={update} notify={notify}
              selClass={selClass} classes={classes} />}
          {tab === "dashboard" &&
            <Dashboard data={data} selClass={selClass} classes={classes} />}
          {tab === "students" &&
            <Students data={data} update={update} notify={notify}
              semType={semType} selClass={selClass} classes={classes} />}
          {tab === "courses" &&
            <Courses data={data} update={update} notify={notify} />}
          {tab === "marks" &&
            <MarksEntry data={data} update={update} notify={notify}
              selClass={selClass} classes={classes} />}
          {tab === "upload" &&
            <ExcelUpload data={data} update={update} notify={notify}
              classes={classes} />}
          {tab === "reports" &&
            <Reports data={data} notify={notify}
              selClass={selClass} classes={classes} />}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="toast"
          style={{ background: toast.type === "success" ? "#22c55e" : "#ef4444" }}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}
