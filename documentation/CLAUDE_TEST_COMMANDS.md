# Claude Test Commands Reference

## 🚀 Quick Commands for Claude

When you want Claude to run the test suite, use these exact phrases:

### **Full Test Suite with Live Scoreboard**
```
"Run the full test suite with scoreboard"
```
**Claude will execute**: `npm run test:full`

### **Critical Path Tests Only** 
```
"Run critical path tests"
```
**Claude will execute**: `npm run test:critical`

### **Quick Test Health Check**
```
"Run a quick test to verify everything is working"  
```
**Claude will execute**: `npm run test:critical`

### **Full Analysis and Optimization**
```
"Run tests and analyze stability"
```
**Claude will execute**: `npm run test:analyze`

### **Specific Test Types**
```
"Test the driver mobile interface"
```
**Claude will execute**: `npm run test:driver`

```
"Test the admin panel functionality"  
```
**Claude will execute**: `npm run test:admin`

## 🎯 Automated Features

### ✅ **Fully Automated Infrastructure:**

1. **Pre-flight Health Checks**
   - API server connectivity (localhost:4000/health)
   - Web server responsiveness (localhost:3002) 
   - TypeScript compilation verification
   - Build cache validation

2. **Real-time Progress Scoreboard**
   - Live progress: x/y tests (%) with datetime stamps
   - Pass rate percentage with color coding
   - Performance metrics (fastest/slowest/average)
   - Project breakdown (critical-path, extended-features)
   - ETA calculation based on current pace

3. **Datetime Breadcrumb System** 
   - Format: "Aug 27 8:45am" for easy time tracking
   - Events: Test start/complete, pass/fail, errors, milestones
   - Historical tracking with 20-event rolling window

4. **Automatic Analysis & Reporting**
   - Flaky test detection with reliability scoring
   - Performance trend analysis  
   - Failure pattern categorization
   - Optimization recommendations
   - Stability reports (JSON + Markdown)

5. **Error Classification & Recovery**
   - Server health issues → Auto-restart protocol
   - Rate limiting → Expected behavior validation  
   - Compilation errors → Build fix recommendations
   - Element location → Selector improvement suggestions

### ✅ **Generated Artifacts** (Automatic):

1. **`test-progress-status.json`** - Machine readable progress data
2. **`live-scoreboard.html`** - Auto-refreshing browser dashboard
3. **`test-stability-report.md`** - Human readable analysis  
4. **`test-history.json`** - Historical performance database
5. **`final-test-results.html`** - Completion summary with timeline

## 📊 Scoreboard Display Format

```
🧪 TEST SUITE SCOREBOARD                    Aug 27 8:47am
═══════════════════════════════════════════════════════════════

📊 EXECUTION STATUS
┌─────────────────────────────────────────────────────────────┐
│ Progress: 16/16 tests (100%) 50.1s elapsed                 │
│ ████████████████████████████████████████ 100%              │
│ Pass Rate: 100% (16✅ 0❌ 0⏭️)                              │
│ ETA: Complete                                               │
│ Avg Test Time: 3.1s                                        │
└─────────────────────────────────────────────────────────────┘

🔄 CURRENT TEST
▶ Complete customer workflow verification
   Project: critical-path | Duration: 8.6s

📋 PROJECT BREAKDOWN
✅ critical-path        16/16 (100%)
⚠️ extended-features    8/10 (80%)

⚡ PERFORMANCE METRICS
🏃 Fastest: Infrastructure health check (2.9s)
🐌 Slowest: Customer workflow verification (8.6s)  
📊 Average: 3.1s

📝 RECENT ACTIVITY
Aug 27 8:45am 🚀 Test runner started
Aug 27 8:45am ✅ API Server: 200
Aug 27 8:46am ✅ Infrastructure health check passed
Aug 27 8:46am ✅ Authentication foundation verified  
Aug 27 8:47am ✅ All portals accessible
Aug 27 8:47am ✅ Customer workflow verified
Aug 27 8:47am ✅ Staff workflow verified
Aug 27 8:47am 🎉 All tests completed

Last update: Aug 27 8:47am
```

## 🎯 Usage for Claude

### When you want Claude to run tests, simply say:

**For comprehensive testing:**
> "Run the full test suite with scoreboard"

**For quick verification:**  
> "Run critical path tests"

**For analysis:**
> "Run tests and generate stability analysis"

### Claude will automatically:

1. ✅ Start the enhanced test runner
2. ✅ Perform pre-flight health checks  
3. ✅ Display real-time progress with datetime stamps
4. ✅ Show live pass rates and performance metrics
5. ✅ Generate comprehensive reports
6. ✅ Provide stability recommendations
7. ✅ Create browser-viewable scoreboard

### Files you can monitor:

- **`live-scoreboard.html`** - Open in browser for live updates
- **`test-stability-report.md`** - Read human-friendly analysis
- **`final-test-results.html`** - View completion summary

**Everything is fully automated - Claude just needs the simple command and all the infrastructure will activate automatically!**