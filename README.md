# AcadMarks

A modern web application for managing and tracking Internal Assessment (IA) marks for students at Reva University's Electrical Engineering department. Built with React + Vite, featuring real-time analytics, Excel import/export, and at-risk student detection.

## ✨ Features

- **📊 Dashboard** – Real-time KPIs, mark distribution, top performers, at-risk students
- **🎓 Student Management** – Add/edit students with class and semester filtering
- **📚 Course Catalog** – Organize courses by semester (Core, Elective, Lab)
- **✏️ Marks Entry** – Input IA-I and IA-II scores (threshold: 8/25)
- **⬆️ Excel Import** – Bulk student and mark data with validation
- **📄 Reports** – Class-wise performance analytics
- **🔍 Search** – Advanced student lookup and record viewing

## 🛠️ Tech Stack

| Component | Version |
|-----------|---------|
| React | 19.2.6 |
| Vite | 8.0.12 |
| Recharts | 3.8.1 |
| ExcelJS / XLSX | 3.4.0 / 0.18.5 |
| Firebase | 12.13.0 |
| ESLint | 10.3.0 |

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm 8+

### Installation
```bash
npm install
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

## 📁 Project Structure

```
src/
├── components/          # 8 React components (Dashboard, Students, Courses, etc.)
├── utils/
│   ├── helpers.js      # Utility functions & data normalization
│   ├── constants.js    # App constants & styling
│   └── firestore.js    # Firebase integration (optional)
├── assets/             # Logo & images
├── App.jsx             # Main app routing
└── index.css           # Global styles
```

## 📋 Usage Guide

1. **Setup Courses** → "Courses" tab → Create entries for each semester
2. **Add Students** → "Students" tab → Select class → Add records
3. **Enter Marks** → "Marks Entry" tab → Input IA-I and IA-II scores
4. **Monitor** → "Dashboard" → View analytics and at-risk students
5. **Export** → "Reports" tab → Generate class performance data
6. **Bulk Import** → "Excel Upload" → Import student/mark data

## ⚙️ Configuration

### Class Structure
- **Odd Semesters:** 1A, 1B, 3A, 3B, 5A, 5B, 7A, 7B
- **Even Semesters:** 2A, 2B, 4A, 4B, 6A, 6B, 8A, 8B

### Constants (in `constants.js`)
```javascript
IA_THRESHOLD = 8           // Risk flag threshold
IA_MAX = 25                // Maximum IA score
MIN_SEMESTER_COURSES = 6   // Min courses per semester
MAX_SEMESTER_COURSES = 8   // Max courses per semester
```

### Risk Levels
- **SAFE** – All courses ≥ 8
- **MEDIUM** – 1-2 courses < 8
- **HIGH** – 3+ courses < 8

## 💾 Data Storage

Data persists in browser **localStorage** (key: `acad_marks_v1`):
- Auto-saves after each operation (debounced 800ms)
- Clear browser storage to reset application
- Export to Excel for backup

**Optional Firebase Setup:** See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for cloud sync

## 📊 Excel Import Format

### Expected Columns
| Column | Format |
|--------|--------|
| SRN | Student Reference Number |
| Student Name | Full name |
| Semester | Number (1-8) |
| Section | A or B |
| Course Code 1, 2, ... | Numeric marks (0-25) or "ABSENT" |

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Data not persisting | Enable localStorage in browser settings |
| Excel import fails | Verify column headers and number format |
| Dashboard empty | Add students and courses first |
| Marks not displaying | Confirm student is enrolled in course |

## 📱 Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

**For Firebase integration:** See [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

## 📝 License

Developed for Reva University - Electrical Engineering Department

## 👨‍💻 Development

```bash
# Watch for changes and rebuild
npm run dev

# Run ESLint to check code quality
npm run lint

# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

## 🤝 Contributing

For bug reports or feature requests, contact the development team.

---

**Last Updated:** May 2026  
**Version:** 1.0.0
