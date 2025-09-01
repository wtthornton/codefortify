# Cursor.ai IDE Integration Guide

## Overview

CodeFortify provides seamless real-time integration with Cursor.ai IDE, delivering instant visibility into code quality improvements and continuous enhancement progress. Perfect compatibility with Claude Code ensures optimal AI-powered development workflows.

## Quick Start

### Installation

```bash
# Install CodeFortify globally
npm install -g @wtthornton/codefortify

# Install Cursor extension
cd extensions/vscode
cursor --install-extension codefortify-realtime-0.1.0.vsix

# Start real-time monitoring
codefortify score --realtime
```

### Verification

Your Cursor IDE should show:
- **Status Bar**: `CodeFortify: ✓ Score 94.2 (Excellent)`
- **Extension Active**: Listed in Extensions panel
- **Real-Time Updates**: Live progress during analysis

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cursor IDE    │◄──►│  CodeFortify     │◄──►│  Claude Code    │
│   Extension     │    │  Real-Time Core  │    │  Integration    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              WebSocket Server (Port 8765)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌──────────┐ │
│  │   Event     │ │   Status    │ │   Message    │ │   File   │ │
│  │  Emitter    │ │  Manager    │ │    Queue     │ │  Writer  │ │
│  └─────────────┘ └─────────────┘ └──────────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Real-Time Features

### Status Bar Integration
- **Live Score Display**: `CodeFortify: ✓ Score 94.2`
- **Progress Indicators**: `CodeFortify: ⚡ Analyzing... 67%`  
- **Trend Arrows**: `CodeFortify: ↗ Score 94.2 (+2.1)`
- **Click for Details**: Opens comprehensive dashboard

### Smart Notifications
- **Critical**: Security vulnerabilities, breaking changes
- **High**: Significant score improvements available
- **Medium**: Code quality suggestions, new recommendations
- **Low**: Analysis complete, maintenance reminders

### Terminal Status Monitor

```bash
# Rich terminal display
codefortify-status

# Compact mode
codefortify-status --compact

# Watch mode with custom interval
codefortify-status watch --interval 5
```

**Terminal Output Example:**
```
┌─ CodeFortify Real-Time Status ─────────────────────────────┐
│ Connection: ✓ Connected                                    │
│ Overall Score: 94.2/100 ↗ Excellent                      │
│ Current Status: ⚡ Analyzing... 67%                       │
│ Progress: [████████████▒▒▒▒▒▒▒▒] 67%                     │
│ Issues Found: 0 Critical, 1 High, 2 Medium, 3 Low        │
│ Time Elapsed: 2m 34s | ETA: 1m 12s                       │
└────────────────────────────────────────────────────────────┘
```

## Claude Code Integration

### Perfect Compatibility
- **Cursor Architecture**: Built on VS Code - 100% extension compatibility
- **Proven Integration**: Manual VSIX installation method (same as Claude Code)
- **Shared Infrastructure**: Smart WebSocket server sharing prevents conflicts
- **Zero Port Conflicts**: Automatic port detection and fallback

### Installation Order

1. **Install Claude Code** (if not already installed):
   ```bash
   cursor --install-extension ~/.claude/local/node_modules/@anthropic-ai/claude-code/vendor/claude-code.vsix
   ```

2. **Install CodeFortify Extension**:
   ```bash
   cd extensions/vscode
   cursor --install-extension codefortify-realtime-0.1.0.vsix
   ```

3. **Restart Cursor** completely

### Synchronized Workflow

```bash
# Typical development session:
1. Open project in Cursor
2. Start Claude Code session (Cmd/Ctrl+Esc)
3. CodeFortify automatically analyzes code
4. Real-time feedback in status bar
5. Smart notifications for improvements
6. Claude Code provides contextual AI assistance
```

### Context Synchronization

CodeFortify provides real-time context to Claude Code sessions:

```javascript
{
  "currentScore": 94.2,
  "trend": "improving", 
  "activeAnalysis": {
    "phase": "security",
    "progress": 67,
    "findings": ["vulnerability-fix-needed", "performance-optimization"]
  },
  "recommendations": [
    "Implement input validation in auth.js:45",
    "Optimize database query in user.service.ts:123"
  ]
}
```

## Configuration

### Extension Settings

Configure via Cursor Settings:

```json
{
  "codefortify.realtime.enabled": true,
  "codefortify.realtime.serverPort": 8765,
  "codefortify.realtime.autoConnect": true,
  "codefortify.statusBar.showScore": true,
  "codefortify.statusBar.showProgress": true,
  "codefortify.notifications.priority": "medium",
  "codefortify.notifications.frequency": "smart"
}
```

### Project Configuration

Create `.codefortify/realtime-config.json`:

```json
{
  "realtime": {
    "enabled": true,
    "serverPort": 8765,
    "autoConnect": true
  },
  "integrations": {
    "claudeCode": {
      "enabled": true,
      "shareContext": true,
      "syncUpdates": true
    }
  },
  "notifications": {
    "priority": "medium",
    "frequency": "smart",
    "sound": false
  },
  "fileOutput": {
    "formats": ["json", "markdown", "badges"],
    "updateInterval": 5000
  }
}
```

## File-Based Integration

CodeFortify automatically generates status files for CI/CD and external tools:

### JSON Status (`status.json`)
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "status": {
    "score": 94.2,
    "phase": "complete", 
    "progress": 100,
    "issues": {
      "critical": 0,
      "high": 1,
      "medium": 2,
      "low": 3
    }
  }
}
```

### Markdown Status (`STATUS.md`)
Includes tables, badges, and category breakdowns for README integration.

### Shield Badges (`badges.md`)
Ready-to-use shield.io URLs:
```markdown
![CodeFortify Score](https://img.shields.io/badge/CodeFortify-94.2-brightgreen)
![Status](https://img.shields.io/badge/Status-Complete-brightgreen)
```

## Commands Reference

### Core Commands
```bash
# Start real-time monitoring
codefortify score --realtime
codefortify start-realtime

# Terminal status monitor
codefortify-status
codefortify-status watch --interval 5
codefortify-status test-connection

# JSON output for CI/CD
codefortify-status json --pretty
```

### VS Code Extension Commands
Available via Command Palette (Ctrl+Shift+P):
- **CodeFortify: Start Real-Time Monitoring**
- **CodeFortify: Show Status Dashboard**
- **CodeFortify: Run Code Analysis**
- **CodeFortify: Show Recommendations**

## CI/CD Integration Examples

### GitHub Actions
```yaml
name: CodeFortify Quality Check
on: [push, pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install CodeFortify
        run: npm install -g @wtthornton/codefortify
      
      - name: Run Analysis
        run: codefortify score --format json --output results.json --realtime
      
      - name: Generate Badge
        run: |
          SCORE=$(jq -r '.status.score' .codefortify/status.json)
          echo "![CodeFortify](https://img.shields.io/badge/CodeFortify-${SCORE}-green)" >> $GITHUB_STEP_SUMMARY
```

### Docker Integration
```dockerfile
FROM node:18-alpine
RUN npm install -g @wtthornton/codefortify
WORKDIR /app
COPY . .
RUN codefortify score --realtime --format json --output /results/
EXPOSE 8765
CMD ["codefortify-status", "--host", "0.0.0.0"]
```

## Troubleshooting

### Extension Not Activating
```bash
# Verify installation
cursor --list-extensions | grep codefortify

# Check logs
cursor --verbose

# Reinstall extension
cursor --uninstall-extension codefortify-realtime
cursor --install-extension codefortify-realtime-0.1.0.vsix
```

### WebSocket Connection Issues
```bash
# Test connection
codefortify-status test-connection

# Check port availability
netstat -an | grep 8765

# Try alternative port
codefortify start-realtime --port 8766
```

### Claude Code Conflicts
```bash
# Verify both extensions
cursor --list-extensions | grep -E "(claude|codefortify)"

# Check shared server
ps aux | grep -E "(claude|codefortify)"

# Reset configuration  
rm .codefortify/realtime-config.json
codefortify init --reset
```

## Performance

### System Requirements
- **RAM**: 2-4GB (15-30MB for extension)
- **CPU**: <5% additional usage
- **Network**: Local WebSocket only
- **Disk**: ~1-5KB status files

### Optimization Settings
```json
{
  "performance": {
    "maxConnections": 5,
    "bufferSize": 100,
    "updateInterval": 1000,
    "smartBatching": true
  }
}
```

## Support

For issues, questions, or contributions:
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: This guide and inline help
- **Health Check**: Run `codefortify-status test-connection`

---

*Perfect integration with Cursor.ai IDE and Claude Code for seamless AI-powered development* ✨