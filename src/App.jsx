import { useState, useCallback } from "react";
import { styles } from "./utils/constants";
import { load, save } from "./utils/helpers";
import { Dashboard } from "./components/Dashboard";
import { Students } from "./components/Students";
import { Courses } from "./components/Courses";
import { MarksEntry } from "./components/MarksEntry";
import { ExcelUpload } from "./components/ExcelUpload";
import { Reports } from "./components/Reports";

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState(load);
  const [toast, setToast] = useState(null);

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
    { id: "students",  icon: "🎓", label: "Students" },
    { id: "courses",   icon: "📚", label: "Courses" },
    { id: "marks",     icon: "✏️",  label: "Marks Entry" },
    { id: "upload",    icon: "⬆️",  label: "Excel Upload" },
    { id: "reports",   icon: "📄", label: "Reports" },
  ];

  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>🏛</span>
          <div>
            <div style={styles.brandTitle}>AcadMarks</div>
            <div style={styles.brandSub}>Academic Head Portal</div>
          </div>
        </div>
        <nav style={styles.nav}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              style={{ ...styles.navBtn, ...(tab === n.id ? styles.navActive : {}) }}>
              <span style={styles.navIcon}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div style={styles.sideStats}>
          <div style={styles.statPill}><b>{data.students.length}</b> Students</div>
          <div style={styles.statPill}><b>{data.courses.length}</b> Courses</div>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>
            {nav.find(n => n.id === tab)?.icon} {nav.find(n => n.id === tab)?.label}
          </h1>
          <div style={styles.headerRight}>
            <span style={styles.badge}>Academic Year 2024–25</span>
          </div>
        </header>

        <div style={styles.content}>
          {tab === "dashboard" && <Dashboard data={data} />}
          {tab === "students"  && <Students data={data} update={update} notify={notify} />}
          {tab === "courses"   && <Courses  data={data} update={update} notify={notify} />}
          {tab === "marks"     && <MarksEntry data={data} update={update} notify={notify} />}
          {tab === "upload"    && <ExcelUpload data={data} update={update} notify={notify} />}
          {tab === "reports"   && <Reports data={data} notify={notify} />}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "success" ? "#22c55e" : "#ef4444" }}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}
