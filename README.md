# 📝 12th Self Objective Test App

This is a **Progressive Web Application (PWA)** designed for self-study and objective testing, focusing on offline functionality and a streamlined user experience. It supports dynamic content loading based on a structured file system (ideal for GitHub hosting) and includes advanced analytics for performance tracking.

## ✨ Key Features

- **Offline First (PWA):** Fully functional offline capability through a Service Worker for continuous study.
- **User Identity:** Prompts the user for their name and displays a personalized welcome message.
- **Dynamic Content Loading:** Replaces file upload with dynamic **Subject and Chapter selection** based on a central `subjects.json` index.
- **Test Customization:** Allows configuration of the number of questions, time limits, question shuffling, and option shuffling.
- **Enhanced Results UI:** Visually improved result screen with clear color-coding for correct and incorrect answers during review.
- **Advanced Analytics:** A dedicated screen powered by **Chart.js** to visualize performance data (e.g., Average Score, Subject Performance, Score Distribution).
- **Urdu Font Support:** Automatically applies the **Noto Nastaliq Urdu** font and Right-to-Left (RTL) direction when the 'Urdu' subject is selected for an optimal reading experience.
- **History Management:** Saves test results locally and provides options to view details, delete individual attempts, or clear all history.

---

## 🚀 Setup and Installation

The app is designed to run statically (e.g., on GitHub Pages) without needing any server-side environment or database.

### 1. Required Folder Structure

Ensure your repository adheres to this strict structure, as the JavaScript logic relies on these paths:

```
/ (Repository Root)
├── index.html
├── analytics.html
├── script.js
├── style.css
├── sw.js
├── manifest.json
├── subjects.json
└── subjects/
    ├── History/
    │   ├── Ch-1.csv
    │   └── Ch-2.csv
    ├── Urdu/
    │   └── Ch-1.csv
    └── [Other Subject Folders]/
        └── [Chapter CSV Files].csv
```

### 2. `subjects.json` Configuration

This file acts as the central index for all subjects and chapters. It must accurately map subject and chapter names to their physical CSV file paths.

**Example (`subjects.json`):**

```json
{
  "विषय": [
    {
      "नाम": "History",
      "अध्याय": [
        {"नाम": "Ch-1", "csv_path": "subjects/History/Ch-1.csv"},
        {"नाम": "Ch-2", "csv_path": "subjects/History/Ch-2.csv"}
      ]
    },
    {
      "नाम": "Urdu",
      "अध्याय": [
        {"नाम": "Ch-1", "csv_path": "subjects/Urdu/Ch-1.csv"}
      ]
    }
  ]
}
```

> 💡 **Note:** The top-level key `"विषय"` (Hindi for "Subjects") is hardcoded in `script.js`. Do not change it unless you also update the JavaScript logic.

### 3. CSV File Format

All chapter CSV files must:
- Use the **pipe (`|`) character** as delimiter.
- **Not include a header row**.
- Follow this exact column order:

| Column # | Field Name    | Required | Description                                                                 |
|:--------:|---------------|:--------:|-----------------------------------------------------------------------------|
| 1        | `ID`          | Yes      | Unique numeric or string identifier for the question.                       |
| 2        | `Question`    | Yes      | The full question text.                                                     |
| 3        | `Option 1`    | Yes      | First multiple-choice option.                                               |
| 4        | `Option 2`    | Yes      | Second multiple-choice option.                                              |
| 5        | `Option 3`    | Yes      | Third multiple-choice option.                                               |
| 6        | `Option 4`    | Yes      | Fourth multiple-choice option.                                              |
| 7        | `Answer`      | Yes      | Exact text of the correct option (must match one of Options 1–4).           |
| 8        | `Tags`        | Yes      | Comma-separated tags or categories (e.g., `Easy,Geography`).                 |
| 9        | `Time Limit`  | No       | Time limit for this question in seconds (e.g., `45`). Defaults to `30` if missing or empty. |

**Example CSV Line (no quotes, no headers):**

```csv
1|What is the capital of India?|Mumbai|Delhi|Kolkata|Chennai|Delhi|Geography|30
2|کون سا شہر پاکستان کا دارالحکومت ہے؟|لاہور|کراچی|اسلام آباد|پشاور|اسلام آباد|Urdu,Easy|40
```

> ⚠️ **Critical:**  
> - Do **not** add quotes around fields.  
> - Do **not** include a header line.  
> - Ensure the `Answer` field **exactly matches** one of the four options (including spaces and case).

---

## ⚙️ Core Files and Their Roles

| File             | Purpose                              | Key Responsibilities                                                                 |
|------------------|--------------------------------------|--------------------------------------------------------------------------------------|
| `index.html`     | Main application interface           | Renders UI, handles user onboarding, subject/chapter selection, and test flow.       |
| `analytics.html` | Performance analytics dashboard      | Displays charts using **Chart.js**; loads historical test data from `localStorage`.  |
| `script.js`      | **Core application logic**           | Manages:<br>- `localStorage` (user name, test history)<br>- CSV parsing<br>- Timer logic<br>- Urdu RTL/font logic<br>- Result calculation<br>- Dynamic UI updates |
| `style.css`      | Styling and layout                   | Includes responsive design, animations, Urdu-specific styles, and result review highlighting (green = correct, red = incorrect). |
| `sw.js`          | Service Worker                       | Caches essential assets (`index.html`, `script.js`, `style.css`, etc.) for offline use. |
| `manifest.json`  | PWA configuration                    | Defines app name, icons, theme color, display mode, and installability.              |
| `subjects.json`  | Content index                        | Maps subject/chapter names to actual CSV file paths.                                |

---

## 💡 Technical Implementation Details

### 1. Data Storage (`localStorage`)

- All data (user name, test results, settings) is stored in the browser’s `localStorage`.
- Test history is capped at **50 most recent attempts** to avoid storage bloat.
- Each test result includes:
  - Timestamp
  - Subject & Chapter
  - Total questions
  - Correct answers
  - Score (%)
  - Time taken

### 2. Dynamic Content Loading

- On app load, `fetch('subjects.json')` retrieves the subject index.
- When a user selects a chapter, the app calls `fetch(csv_path)` to load the CSV.
- The `parseCSV(data)` function splits lines and fields using `|`, then constructs question objects.

### 3. Urdu Language Support

When the selected subject name is exactly `"Urdu"` (case-sensitive):

- The `<body>` element receives the class `urdu-font`.
- CSS applies:
  ```css
  .urdu-font {
    font-family: 'Noto Nastaliq Urdu', serif;
    direction: rtl;
    text-align: right;
    font-size: 1.4em;
  }
  ```
- Google Fonts CDN link in HTML ensures the font loads:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet">
  ```

### 4. Analytics & Visualization

On `analytics.html`:

- **Chart.js** is loaded via CDN:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  ```
- Two charts are rendered:
  - **Bar Chart**: Average score per subject.
  - **Line Chart**: Score trend over last 10 tests.
- Data is extracted from `localStorage.testHistory` and aggregated in real time.

---

## 🤝 How to Contribute

We welcome contributions! Follow these steps:

1. **Fork** this repository.
2. Create a new branch: `git checkout -b feature/new-subject`
3. Add your content:
   - Place CSV files in the correct subject folder under `subjects/`.
   - Update `subjects.json` with new subject/chapter entries and valid `csv_path`.
4. Validate your CSV:
   - No headers.
   - Pipe-delimited.
   - Correct answer matches an option exactly.
5. Test locally (use a local server like `Live Server` in VS Code or `python -m http.server`).
6. Commit and push your changes.
7. Open a **Pull Request** with a clear description.

> ✅ **Best Practices:**
> - Keep subject names consistent (e.g., always `"Urdu"`, not `"urdu"`).
> - Use meaningful chapter names (`Ch-1`, `Introduction`, etc.).
> - Avoid special characters in file names (use `-` or `_` instead of spaces).

---

Made with ❤️ for students, teachers, and lifelong learners.  
**Study anywhere. Test anytime. Even offline.**
