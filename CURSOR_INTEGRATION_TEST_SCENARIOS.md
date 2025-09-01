# CodeFortify + Cursor.ai Integration Test Scenarios

## Overview
Comprehensive test scenarios for validating CodeFortify real-time integration with Cursor.ai IDE, including Claude Code compatibility testing.

---

## Pre-Test Setup

### Required Components
- [x] CodeFortify VSIX package: `codefortify-realtime-0.1.0.vsix`
- [x] Cursor.ai IDE installed
- [x] Claude Code extension (for dual usage testing)
- [x] CodeFortify CLI tools installed

### Installation Commands
```bash
# Install CodeFortify extension in Cursor
cursor --install-extension codefortify-realtime-0.1.0.vsix

# Verify installation
cursor --list-extensions | grep codefortify
```

---

## Test Scenario 1: Basic Extension Functionality

### TS1.1: Extension Activation
**Expected**: Extension activates on Cursor startup
1. Open Cursor IDE
2. Check status bar for "CodeFortify" indicator
3. Verify extension appears in Extensions panel
4. Check Developer Tools console for activation messages

**Pass Criteria**: 
- ✅ Status bar shows "CodeFortify: Ready"
- ✅ No activation errors in console
- ✅ Extension listed in installed extensions

### TS1.2: Status Bar Integration
**Expected**: Dynamic status bar updates
1. Start CodeFortify analysis: `codefortify score --realtime`
2. Observe status bar changes during analysis
3. Check final score display

**Pass Criteria**:
- ✅ Status shows "CodeFortify: ⚡ Analyzing... X%"
- ✅ Progress updates in real-time
- ✅ Final score displayed: "CodeFortify: ✓ Score XX.X"

### TS1.3: Command Palette Integration
**Expected**: All commands accessible via Ctrl+Shift+P
1. Open Command Palette
2. Type "CodeFortify"
3. Verify all commands present and functional

**Expected Commands**:
- ✅ CodeFortify: Start Real-Time Monitoring
- ✅ CodeFortify: Stop Real-Time Monitoring
- ✅ CodeFortify: Show Status Dashboard
- ✅ CodeFortify: Run Code Analysis
- ✅ CodeFortify: Show Recommendations
- ✅ CodeFortify: Open Settings

---

## Test Scenario 2: Real-Time Communication

### TS2.1: WebSocket Connection
**Expected**: Stable WebSocket connection to CodeFortify server
1. Start real-time monitoring
2. Check connection status in status bar
3. Monitor connection stability for 5 minutes

**Pass Criteria**:
- ✅ Connection establishes within 3 seconds
- ✅ Status shows "connected" indicator
- ✅ No disconnections during monitoring period

### TS2.2: Live Score Updates
**Expected**: Score updates appear immediately in IDE
1. Run continuous analysis: `codefortify score --realtime --continuous`
2. Monitor status bar for score changes
3. Verify score matches CLI output

**Pass Criteria**:
- ✅ Score updates within 1 second of CLI changes
- ✅ Values match exactly between IDE and CLI
- ✅ Trend indicators show correctly (↗ ↘ →)

### TS2.3: Progress Tracking
**Expected**: Detailed progress information during analysis
1. Start complex analysis on large project
2. Monitor progress indicators
3. Check phase transitions

**Pass Criteria**:
- ✅ Progress percentage updates smoothly
- ✅ Phase names display clearly
- ✅ Time estimates reasonable and updating

---

## Test Scenario 3: Smart Notifications

### TS3.1: Notification Filtering
**Expected**: Smart filtering prevents notification spam
1. Configure notification priority: medium
2. Run analysis generating multiple findings
3. Verify only important notifications appear

**Pass Criteria**:
- ✅ Critical/high priority notifications shown
- ✅ Low priority notifications filtered
- ✅ Maximum 3 notifications per minute

### TS3.2: Notification Actions
**Expected**: Action buttons in notifications work correctly
1. Trigger score improvement notification
2. Click "View Details" button
3. Verify detailed view opens

**Pass Criteria**:
- ✅ Action buttons present and clickable
- ✅ "View Details" opens comprehensive status
- ✅ "Apply Fix" triggers appropriate action

---

## Test Scenario 4: Claude Code Integration

### TS4.1: Concurrent Operation
**Expected**: Both tools run simultaneously without conflicts
1. Install Claude Code in Cursor: manual VSIX method
2. Start Claude Code session (Cmd/Ctrl+Esc)
3. Launch CodeFortify real-time monitoring
4. Use both tools simultaneously

**Pass Criteria**:
- ✅ Both tools activate without errors
- ✅ No port conflicts or WebSocket issues
- ✅ Performance remains smooth with both active

### TS4.2: WebSocket Server Sharing
**Expected**: Smart server sharing prevents port conflicts
1. Start CodeFortify real-time server
2. Start Claude Code
3. Check port usage: `netstat -an | grep 8765`

**Pass Criteria**:
- ✅ Only one server instance on port 8765
- ✅ Both tools receive real-time updates
- ✅ No duplicate server processes

### TS4.3: Context Synchronization
**Expected**: CodeFortify metrics available during Claude Code sessions
1. Start Claude Code conversation
2. Request code improvement suggestions
3. Verify Claude Code can access CodeFortify status

**Pass Criteria**:
- ✅ Claude Code shows awareness of current score
- ✅ Recommendations consider CodeFortify metrics
- ✅ Status updates visible to both tools

---

## Test Scenario 5: Configuration & Settings

### TS5.1: Settings Integration
**Expected**: VS Code settings control extension behavior
1. Open Cursor Settings
2. Search for "codefortify"
3. Modify notification preferences
4. Verify changes take effect

**Pass Criteria**:
- ✅ All settings appear in Cursor preferences
- ✅ Changes apply without restart
- ✅ Settings persist between sessions

### TS5.2: Workspace Configuration
**Expected**: Project-specific configuration respected
1. Create `.codefortify/realtime-config.json`
2. Configure custom notification settings
3. Test configuration override

**Pass Criteria**:
- ✅ Workspace config overrides global settings
- ✅ Custom notification rules applied
- ✅ No configuration conflicts

---

## Test Scenario 6: Error Handling & Recovery

### TS6.1: Network Interruption
**Expected**: Graceful handling of connection loss
1. Start real-time monitoring
2. Simulate network disconnection
3. Restore connection
4. Verify automatic reconnection

**Pass Criteria**:
- ✅ Status shows "disconnected" during outage
- ✅ Automatic reconnection within 30 seconds
- ✅ No data loss during reconnection

### TS6.2: Server Restart
**Expected**: Robust recovery when server restarts
1. Start CodeFortify server
2. Connect extension
3. Kill and restart server
4. Monitor extension recovery

**Pass Criteria**:
- ✅ Extension detects server shutdown
- ✅ Automatic reconnection attempts
- ✅ Full functionality restored

---

## Test Scenario 7: Performance Impact

### TS7.1: Memory Usage
**Expected**: Minimal memory footprint
1. Measure Cursor memory usage before extension
2. Install and activate CodeFortify extension
3. Monitor memory usage during 1-hour session

**Pass Criteria**:
- ✅ Extension adds <50MB memory usage
- ✅ No memory leaks during extended use
- ✅ Memory usage stable over time

### TS7.2: CPU Impact
**Expected**: Non-intrusive operation
1. Monitor CPU usage during coding session
2. Activate real-time monitoring
3. Measure impact on typing responsiveness

**Pass Criteria**:
- ✅ <5% CPU usage during normal operation
- ✅ No typing lag or UI delays
- ✅ Smooth real-time updates without stuttering

---

## Test Scenario 8: Cross-Platform Compatibility

### TS8.1: Windows Integration
**Expected**: Full functionality on Windows
1. Test on Windows 10/11
2. Verify file path handling
3. Check WebSocket connectivity

### TS8.2: macOS Integration  
**Expected**: Full functionality on macOS
1. Test on macOS 10.15+
2. Verify command key bindings
3. Check notification behavior

### TS8.3: Linux Integration
**Expected**: Full functionality on Linux
1. Test on Ubuntu/Debian
2. Verify desktop notifications
3. Check dependency resolution

---

## Automated Test Scripts

### Quick Smoke Test
```bash
#!/bin/bash
# cursor-integration-smoke-test.sh

echo "Starting CodeFortify + Cursor integration smoke test..."

# Check extension installation
if cursor --list-extensions | grep -q codefortify; then
    echo "✅ Extension installed"
else
    echo "❌ Extension not found"
    exit 1
fi

# Test basic CLI connectivity
if codefortify score --format json >/dev/null 2>&1; then
    echo "✅ CLI functional"
else
    echo "❌ CLI issues detected"
    exit 1
fi

echo "🚀 Smoke test passed - ready for full integration testing"
```

### WebSocket Connection Test
```javascript
// websocket-test.js - Run in Cursor Developer Tools
const testConnection = async () => {
    const ws = new WebSocket('ws://localhost:8765');
    
    ws.onopen = () => console.log('✅ WebSocket connection established');
    ws.onmessage = (msg) => console.log('📨 Message received:', msg.data);
    ws.onerror = (err) => console.error('❌ WebSocket error:', err);
    
    setTimeout(() => ws.close(), 5000);
};

testConnection();
```

---

## Success Criteria Summary

For successful Cursor.ai integration, all test scenarios should pass:

### Critical Success Metrics
- ✅ Extension installs and activates without errors
- ✅ Real-time status updates work correctly
- ✅ Claude Code + CodeFortify operate simultaneously
- ✅ WebSocket connections remain stable
- ✅ Performance impact <5% CPU, <50MB RAM

### Quality Metrics
- ✅ All notifications respect user preferences
- ✅ Settings integrate with Cursor preferences
- ✅ Error recovery works robustly
- ✅ Cross-platform compatibility verified

### User Experience Metrics
- ✅ Setup takes <5 minutes total
- ✅ No configuration conflicts
- ✅ Intuitive status indicators
- ✅ Comprehensive documentation available

---

## Troubleshooting Guide

### Common Issues & Solutions

**Extension not showing in status bar**
```bash
# Restart Cursor completely
cursor --reopen-last-session

# Check extension activation
cursor --verbose
```

**WebSocket connection failures**
```bash
# Check port availability
netstat -an | grep 8765

# Test manual connection
codefortify start-realtime --port 8766
```

**Claude Code conflicts**  
```bash
# Verify both tools using same server
ps aux | grep codefortify
ps aux | grep claude

# Check configuration
cat .codefortify/realtime-config.json
```

This comprehensive test suite ensures robust, production-ready integration between CodeFortify and Cursor.ai IDE with full Claude Code compatibility.