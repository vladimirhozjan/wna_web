============================================================
  WNA REGRESSION UI TEST DASHBOARD
============================================================

WHAT IS THIS?
  An interactive HTML dashboard for running manual regression
  tests against the WNA application. It loads 338 test cases
  parsed from wna_test_cases.md.

============================================================

FILES

  index.html            The dashboard. Double-click to open.
  test-cases.json       Test cases in JSON (also embedded in HTML).
  parse-test-cases.cjs  Script that parses wna_test_cases.md.
  README.txt            This file.

============================================================

HOW TO OPEN

  Just double-click index.html in Finder.
  It opens in your browser. No server needed.

============================================================

HOW TO USE

  1. Click "+ New Run" to start a test run.
     Enter your name and the build/branch you're testing.

  2. For each test case, pick a status from the dropdown:
     P = Pass, F = Fail, S = Skip, B = Blocked.
     Add a comment if needed.

  3. If you mark a test as "Fail", it will ask if you want
     to create a bug. You can also create bugs manually in
     the "Bug Tracker" tab.

  4. Use filters to narrow down test cases by ID, section,
     area, priority, or status.

  5. The summary at the bottom auto-updates with breakdowns
     by priority, area, and failed test cases.

============================================================

WHERE IS DATA STORED?

  While the page is open, data lives in your browser's
  localStorage (temporary). This is NOT saved to disk.

  *** IMPORTANT ***
  Before closing the browser tab, you MUST export your data:

    Click "EXPORT DATA NOW" (red banner at top)
    - or -
    Click "Data Management" > "Export All Data (JSON)"

  This downloads a .json file to your Downloads folder.
  That file IS your save. Keep it safe.

============================================================

HOW TO RESTORE / IMPORT DATA

  1. Open index.html in your browser.
  2. Click "Data Management".
  3. Click "Import Data (JSON)" and pick your .json file.
  4. All your test runs, results, and bugs are restored.

============================================================

HOW TO DOWNLOAD REPORTS

  - "Download Summary MD"  = markdown summary of all test runs
  - "Download Bugs MD"     = markdown list of all tracked bugs

  These go to your Downloads folder.

============================================================

HOW TO UPDATE TEST CASES

  If wna_test_cases.md changes (new tests added, text edited):

  1. Open a terminal in the regression-ui-tests/ folder.
  2. Run:  node parse-test-cases.cjs
  3. This re-parses the markdown and updates both
     test-cases.json and the embedded data in index.html.
  4. Refresh the dashboard in your browser.

  Your test run data (pass/fail results, bugs) is NOT affected
  by re-parsing. It lives separately in your exported JSON.

============================================================

FULL WORKFLOW EXAMPLE

  Day 1:
    - Open index.html
    - Create a new run, test 50 cases
    - Click "EXPORT DATA NOW" -> saves .json to Downloads
    - Close the browser

  Day 2:
    - Open index.html
    - Click "Data Management" > Import your .json file
    - Continue testing
    - Click "EXPORT DATA NOW" before closing

  When done:
    - Download Summary MD for a report
    - Download Bugs MD for the bug list

============================================================
