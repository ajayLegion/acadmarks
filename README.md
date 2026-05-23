# AcadMarks – IA Marks Portal for Electrical Engineering

A modern web application for managing and tracking Internal Assessment (IA) marks for Electrical Engineering students at Reva University. Built with **React** and **Vite**, featuring real-time analytics, Excel import/export, and student risk assessment.

## 🎯 Features

### Core Functionality
- **📊 Dashboard** – Real-time KPIs, mark distribution analysis, top performers, and at-risk student identification
- **🎓 Student Management** – Add, edit, and manage student records with class and semester filtering
- **📚 Course Catalog** – Define and organize courses by semester (Core, Elective, Lab)
- **✏️ Marks Entry** – Input IA-I and IA-II marks with automatic date validation
- **⬆️ Excel Upload** – Bulk import student and mark data with built-in error detection
- **📄 Reports** – Class-wise performance analytics and export capabilities
- **🔍 Search** – Advanced student search with detailed record viewing

### Smart Analytics
- **At-Risk Detection** – Automatically flags students below the IA threshold (8/25)
- **Course Load Validation** – Ensures 6-8 courses per semester per student
- **Pass Rate Tracking** – Visual distribution charts and pass rate monitoring
- **Student Rankings** – Top performers ranked by average marks

## 🛠️ Tech Stack

- **Frontend Framework:** React 19.2.6
- **Build Tool:** Vite 8.0.12
- **Data Visualization:** Recharts 3.8.1
- **Excel Handling:** ExcelJS 3.4.0, XLSX 0.18.5
- **Linting:** ESLint 10.3.0
- **Storage:** Browser localStorage
- **CSS:** Vanilla CSS with CSS custom properties

## 📦 Installation

### Prerequisites
- Node.js 16.x or higher
- npm 8.x or higher

### Setup
```bash
# Clone or download the project
cd acadmarks

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

The application will be available at `http://localhost:5173` (default Vite port).

## 📁 Project Structure

```
acadmarks/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx      # Analytics & KPI display
│   │   ├── Students.jsx       # Student CRUD & filtering
│   │   ├── Courses.jsx        # Course catalog management
│   │   ├── MarksEntry.jsx     # IA mark entry form
│   │   ├── ExcelUpload.jsx    # Bulk import with validation
│   │   ├── Reports.jsx        # Class-wise analytics
│   │   ├── search.jsx         # Student search interface
│   │   └── EmptyState.jsx     # Empty state placeholder
│   ├── utils/
│   │   ├── helpers.js         # Utility functions & data normalization
│   │   └── constants.js       # App constants & styling
│   ├── assets/                # Logo & images
│   ├── App.jsx                # Main app shell & routing
│   ├── App.css                # Component styles
│   ├── main.jsx               # React entry point
│   └── index.css              # Global styles
├── public/                    # Static files
├── vite.config.js             # Vite configuration
├── eslint.config.js           # ESLint rules
├── package.json               # Dependencies & scripts
└── index.html                 # HTML entry point
```

## 🚀 Quick Start

1. **Add Courses** – Navigate to "Courses" tab and create course entries for each semester
2. **Add Students** – Go to "Students" tab, select a class, and add student records
3. **Enter Marks** – Use "Marks Entry" tab to input IA-I and IA-II scores
4. **Monitor Progress** – Check "Dashboard" for analytics and at-risk students
5. **Generate Reports** – Export class performance data via "Reports" tab
6. **Bulk Import** – Upload Excel files with student and mark data via "Excel Upload"

## 📊 Data Model

### Student
```javascript
{
  id: "unique_id",
  name: "John Doe",
  SRN: "1RE21EC001",
  department: "Electrical Engineering",
  semester: "4",
  classSection: "4A",
  courses: [...],  // Array of enrolled courses
  riskLevel: "SAFE" | "MEDIUM" | "HIGH"
}
```

### Course
```javascript
{
  id: "unique_id",
  code: "EE401",
  name: "Electrical Machines",
  semester: "4",
  credits: "3",
  type: "Core" | "Elective" | "Lab"
}
```

### Student Mark Entry
```javascript
{
  courseCode: "EE401",
  courseName: "Electrical Machines",
  courseType: "Core",
  iaI: 22,           // IA-I score (0-25)
  iaII: 20,          // IA-II score (0-25)
  iaIDate: "2026-01-15",
  iaIIDate: "2026-03-15",
  iaIAbsent: false,
  iaIIAbsent: false
}
```

## ⚙️ Configuration Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `IA_THRESHOLD` | 8 | Minimum score to avoid risk flag |
| `IA_MAX` | 25 | Maximum IA score |
| `IA_GAP_MONTHS` | 1.5 | Expected gap between IA-I and IA-II exams |
| `MIN_SEMESTER_COURSES` | 6 | Minimum courses per semester |
| `MAX_SEMESTER_COURSES` | 8 | Maximum courses per semester |

## 🎨 Semester & Class Structure

### Class Naming
- **Odd Semesters:** 1A, 1B, 3A, 3B, 5A, 5B, 7A, 7B
- **Even Semesters:** 2A, 2B, 4A, 4B, 6A, 6B, 8A, 8B

## 💾 Data Storage

All data is persisted in the browser's **localStorage** under the key `acad_marks_v1`. 
- Data syncs automatically after every operation
- Clear browser storage to reset the application
- Export to Excel for backup and analysis

## 🔄 Excel Import Format

### Required Columns
- **SRN** – Student Reference Number
- **Student Name** – Full name of student
- **Semester** – Semester number
- **Section** – Class section (A, B, etc.)
- **Course Code 1, Course Code 2, ...** – Marks for each course

### Mark Format
- Enter numeric values (0-25) for valid marks
- Enter "ABSENT" for absent entries
- Leave empty for no mark

## 📈 Risk Level Classification

- **SAFE** – No course below IA threshold (8)
- **MEDIUM** – 1-2 courses below threshold
- **HIGH** – 3+ courses below threshold

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Data not persisting | Check browser localStorage is enabled |
| Excel import fails | Verify column headers match expected format |
| Marks not showing | Ensure student is enrolled in the course |
| Semester toggle not working | Refresh page and re-select class |

## 📋 Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

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
