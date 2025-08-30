# Test Report Process - NEVER AUTO-OPEN FILES

## CRITICAL RULE: NO AUTO-OPENING BROWSER FILES

### ❌ NEVER USE THESE COMMANDS:
```bash
open /path/to/file.html
xdg-open /path/to/file.html
start /path/to/file.html
```

### ✅ CORRECT APPROACH:
1. **Generate reports inside Docker** (automatic via test commands)
2. **Read JSON/text results programmatically** with node/bash
3. **Reference HTML file locations** for user to open manually
4. **Extract and format data** for console display

### APPROVED COMMANDS FOR REPORT ANALYSIS:
```bash
# Read JSON results
node -e "const data = require('./test-reports/results.json'); console.log(data.stats);"

# Check file contents with cat/head/tail
cat /path/to/results.json | jq .

# List generated files
ls -la test-reports/

# Extract specific data
grep -o "passed.*failed" test-output.txt
```

### REPORT DELIVERY FORMAT:
1. **Console output** with formatted stats and analysis
2. **File path references** like: "Report available at: test-reports/html-report/index.html"  
3. **Extracted key findings** displayed in terminal
4. **Never automatically open** any GUI applications

This prevents unwanted popups on user's system while still providing comprehensive test analysis.