#!/usr/bin/env node

/**
 * Parses wna_test_cases.md into structured test-cases.json
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.resolve(__dirname, '..', 'wna_test_cases.md');
const outputFile = path.resolve(__dirname, 'test-cases.json');

const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.split('\n');

const testCases = [];
let currentSection = '';
let i = 0;

while (i < lines.length) {
  const line = lines[i];

  // Track current section
  const sectionMatch = line.match(/^## Section (\d+: .+)$/);
  if (sectionMatch) {
    currentSection = sectionMatch[1];
    i++;
    continue;
  }

  // Match test case header: ### TC-NNN: Name
  const tcMatch = line.match(/^### (TC-\d+): (.+)$/);
  if (tcMatch) {
    const tc = {
      id: tcMatch[1],
      name: tcMatch[2],
      priority: '',
      area: '',
      section: currentSection,
      preconditions: '',
      steps: [],
      expected: ''
    };

    i++;

    // Parse priority and area line
    while (i < lines.length && lines[i].trim() === '') i++;
    if (i < lines.length) {
      const prioMatch = lines[i].match(/\*\*Priority:\*\*\s*(\w+)\s*\|\s*\*\*Area:\*\*\s*(.+)/);
      if (prioMatch) {
        tc.priority = prioMatch[1].trim();
        tc.area = prioMatch[2].trim();
        i++;
      }
    }

    // Parse remaining fields
    let currentField = '';
    let fieldContent = [];

    const flushField = () => {
      const text = fieldContent.join('\n').trim();
      if (currentField === 'preconditions') {
        tc.preconditions = text;
      } else if (currentField === 'steps') {
        // Parse numbered steps
        tc.steps = [];
        const stepLines = text.split('\n');
        let currentStep = '';
        for (const sl of stepLines) {
          const stepMatch = sl.match(/^\d+\.\s+(.+)/);
          if (stepMatch) {
            if (currentStep) tc.steps.push(currentStep.trim());
            currentStep = stepMatch[1];
          } else if (sl.trim() && currentStep) {
            currentStep += ' ' + sl.trim();
          }
        }
        if (currentStep) tc.steps.push(currentStep.trim());
      } else if (currentField === 'expected') {
        tc.expected = text;
      }
      fieldContent = [];
    };

    while (i < lines.length) {
      const l = lines[i];

      // Stop at next test case, section, or horizontal rule before next TC
      if (l.match(/^### TC-\d+:/) || l.match(/^## Section/)) {
        break;
      }

      // Detect field headers
      if (l.match(/^\*\*Preconditions?:\*\*/)) {
        flushField();
        currentField = 'preconditions';
        const inline = l.replace(/^\*\*Preconditions?:\*\*\s*/, '').trim();
        if (inline) fieldContent.push(inline);
        i++;
        continue;
      }
      if (l.match(/^\*\*Steps:\*\*/)) {
        flushField();
        currentField = 'steps';
        i++;
        continue;
      }
      if (l.match(/^\*\*Expected Result:\*\*/)) {
        flushField();
        currentField = 'expected';
        const inline = l.replace(/^\*\*Expected Result:\*\*\s*/, '').trim();
        if (inline) fieldContent.push(inline);
        i++;
        continue;
      }

      // Stop collecting expected when we hit the result table
      if (l.match(/^\|\s*Date\s*\|/)) {
        flushField();
        currentField = '';
        i++;
        // Skip through the table rows
        while (i < lines.length && (lines[i].match(/^\|/) || lines[i].trim() === '')) {
          i++;
        }
        continue;
      }

      // Horizontal rule (---) between test cases - skip
      if (l.match(/^---\s*$/) && currentField === '') {
        i++;
        continue;
      }

      if (currentField) {
        // For expected results, handle bullet points
        const bulletMatch = l.match(/^- (.+)/);
        if (currentField === 'expected' && bulletMatch) {
          fieldContent.push(bulletMatch[0]);
        } else {
          fieldContent.push(l);
        }
      }

      i++;
    }

    flushField();
    testCases.push(tc);
    continue;
  }

  i++;
}

fs.writeFileSync(outputFile, JSON.stringify(testCases, null, 2));
console.log(`Parsed ${testCases.length} test cases into ${path.basename(outputFile)}`);

// Embed test data into index.html so it works offline (double-click, no server)
const htmlFile = path.resolve(__dirname, 'index.html');
let html = fs.readFileSync(htmlFile, 'utf-8');
const startMarker = '/* __TEST_CASES_DATA__ */';
const endMarker = '/* __END_TEST_CASES_DATA__ */';
const dataLine = `const TEST_CASES_DATA = ${JSON.stringify(testCases)};`;
const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  html = html.substring(0, startIdx) + startMarker + '\n' + dataLine + '\n' + html.substring(endIdx);
  fs.writeFileSync(htmlFile, html);
  console.log(`Embedded ${testCases.length} test cases into index.html`);
} else {
  console.error('ERROR: Could not find data markers in index.html');
  process.exit(1);
}

// Print summary by section
const bySec = {};
for (const tc of testCases) {
  bySec[tc.section] = (bySec[tc.section] || 0) + 1;
}
console.log('\nBy section:');
for (const [sec, count] of Object.entries(bySec)) {
  console.log(`  ${sec}: ${count} test cases`);
}

// Print summary by priority
const byPrio = {};
for (const tc of testCases) {
  byPrio[tc.priority] = (byPrio[tc.priority] || 0) + 1;
}
console.log('\nBy priority:');
for (const [prio, count] of Object.entries(byPrio)) {
  console.log(`  ${prio}: ${count}`);
}
