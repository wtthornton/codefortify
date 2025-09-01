# CodeFortify Real-Time Developer Experience

## Overview

CodeFortify's real-time system provides instant visibility into code quality improvements, continuous enhancement progress, and development metrics. Perfect integration with Cursor.ai IDE and Claude Code ensures seamless AI-powered development workflows.

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

## Quick Start

### 1. Install Cursor Extension

```bash
# Navigate to extension directory
cd extensions/vscode

# Install the pre-built VSIX package
cursor --install-extension codefortify-realtime-0.1.0.vsix

# Restart Cursor completely
cursor --reopen-last-session
```

### 2. Start Real-Time Monitoring

```bash
# Start CodeFortify with real-time features
codefortify score --realtime

# Or start dedicated real-time server
codefortify start-realtime --port 8765
```

### 3. Monitor Status

```bash
# Terminal status monitor
codefortify-status

# Watch mode (updates every 2 seconds)
codefortify-status watch

# JSON output for CI/CD integration
codefortify-status json --pretty
```

## Features

### Real-Time Status Bar

Cursor IDE status bar shows live CodeFortify information:

```
CodeFortify: ✓ Score 94.2 (Excellent)     # Idle state with good score
CodeFortify: ⚡ Analyzing... 67%           # Active analysis with progress
CodeFortify: ↗ Score 96.7 (+2.5)          # Score improvement with trend
CodeFortify: ⚠️ 3 Issues Found             # Issues detected
CodeFortify: ❌ Analysis Failed            # Error state
```

### Smart Notifications

Priority-based notifications with contextual actions:

- **Critical**: Security vulnerabilities, breaking changes
- **High**: Significant score improvements available
- **Medium**: Code quality suggestions, new recommendations  
- **Low**: Analysis complete, maintenance reminders

Each notification includes:
- **View Details**: Opens comprehensive status dashboard
- **Apply Fixes**: Quick-apply recommended changes
- **Show Recommendations**: Display AI-generated suggestions

### Terminal Status Monitor

Rich terminal display with live updates:

```bash
┌─ CodeFortify Real-Time Status ─────────────────────────────┐
│ Connection: ✓ Connected                                    │
│ Overall Score: 94.2/100 ↗ Excellent                      │
│ Current Status: ⚡ Analyzing... 67%                       │
│ Progress: [████████████▒▒▒▒▒▒▒▒] 67%                     │
│ Issues Found: 0 Critical, 1 High, 2 Medium, 3 Low        │
│ Time Elapsed: 2m 34s | ETA: 1m 12s                       │
│ Last Update: 3 seconds ago                                │
│ Status: Reviewing security patterns...                    │
└────────────────────────────────────────────────────────────┘

Controls: Ctrl+C to exit | r to refresh | c for compact mode
```

### File-Based Integration

Automatic generation of status files for external tools:

#### JSON Status (`status.json`)
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": {
    "score": 94.2,
    "phase": "complete",
    "progress": 100,
    "message": "Analysis complete",
    "issues": {
      "critical": 0,
      "high": 1,
      "medium": 2,
      "low": 3
    },
    "categories": {
      "security": { "score": 98.5, "status": "complete" },
      "quality": { "score": 92.1, "status": "complete" }
    }
  },
  "history": [...],
  "metadata": {
    "version": "1.0.0",
    "format": "codefortify-status-v1"
  }
}
```

#### Markdown Status (`STATUS.md`)
```markdown
# CodeFortify Status

![Score](https://img.shields.io/badge/Score-94.2-brightgreen)

## Current Status

- **Overall Score**: 94.2/100
- **Phase**: Complete
- **Progress**: 100%
- **Status**: Analysis complete
- **Last Update**: January 15, 2024 at 10:30 AM

## Issues Found

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 1 |
| Medium | 2 |
| Low | 3 |
```

#### Shield Badges (`badges.md`)
```markdown
![CodeFortify Score](https://img.shields.io/badge/CodeFortify-94.2-brightgreen)
![Status](https://img.shields.io/badge/Status-Complete-brightgreen)
![Issues](https://img.shields.io/badge/Issues-6%20found-red)
```

## Configuration

### Extension Settings

Configure via Cursor Settings or `.vscode/settings.json`:

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
  "notifications": {
    "priority": "medium",
    "frequency": "smart",
    "sound": false
  },
  "statusBar": {
    "showScore": true,
    "showProgress": true,
    "updateInterval": 1000
  },
  "fileOutput": {
    "formats": ["json", "markdown", "badges"],
    "updateInterval": 5000,
    "outputDir": ".codefortify"
  },
  "integrations": {
    "claudeCode": {
      "enabled": true,
      "shareContext": true,
      "syncUpdates": true
    }
  }
}
```

## Command Reference

### Core Commands

```bash
# Start real-time monitoring
codefortify score --realtime
codefortify score --realtime --continuous

# Start dedicated server
codefortify start-realtime
codefortify start-realtime --port 8765 --host localhost

# Enhanced scoring with real-time updates
codefortify score --format html --realtime --open
```

### Status Monitor Commands

```bash
# Basic status monitor
codefortify-status

# Custom port/host
codefortify-status --port 8766 --host localhost

# Compact display mode
codefortify-status --compact

# Watch mode with custom interval
codefortify-status watch --interval 5

# Test WebSocket connection
codefortify-status test-connection

# JSON output for scripting
codefortify-status json --pretty
```

### Interactive Controls (in status monitor)

- **r**: Force refresh display
- **c**: Toggle compact/detailed mode
- **q**: Quit monitor
- **Ctrl+C**: Exit

## Integration Examples

### GitHub Actions Workflow

```yaml
name: CodeFortify Real-Time Quality Check
on: [push, pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install CodeFortify
        run: npm install -g codefortify
      
      - name: Run Analysis with Real-Time Output
        run: |
          codefortify score --format json --output results.json --realtime &
          SERVER_PID=$!
          
          # Wait for analysis completion
          sleep 30
          kill $SERVER_PID
      
      - name: Generate Status Badge
        run: |
          SCORE=$(jq -r '.status.score' .codefortify/status.json)
          echo "SCORE_BADGE_URL=https://img.shields.io/badge/CodeFortify-${SCORE}-green" >> $GITHUB_ENV
      
      - name: Comment PR with Results
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const status = JSON.parse(fs.readFileSync('.codefortify/status.json'));
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## CodeFortify Results\n\n![Score](${process.env.SCORE_BADGE_URL})\n\n**Score**: ${status.status.score}/100\n**Issues**: ${Object.values(status.status.issues).reduce((a,b) => a+b, 0)}`
            });
```

### VS Code Task Integration

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "CodeFortify: Start Real-Time",
      "type": "shell",
      "command": "codefortify",
      "args": ["start-realtime"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new",
        "showReuseMessage": true,
        "clear": false
      },
      "runOptions": {
        "runOn": "folderOpen"
      }
    },
    {
      "label": "CodeFortify: Status Monitor",
      "type": "shell",
      "command": "codefortify-status",
      "args": ["--compact"],
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": true,
        "panel": "new"
      }
    }
  ]
}
```

### Docker Integration

```dockerfile
FROM node:18-alpine

# Install CodeFortify
RUN npm install -g codefortify

WORKDIR /app
COPY . .

# Start real-time server in background
RUN codefortify start-realtime --daemon

# Run analysis with real-time updates
RUN codefortify score --realtime --format json --output /results/status.json

EXPOSE 8765
CMD ["codefortify-status", "--host", "0.0.0.0"]
```

### Git Hooks Integration

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "🔍 Running CodeFortify quality check..."

# Start real-time analysis
codefortify score --realtime --format json --output .codefortify/pre-commit-status.json

# Check if quality meets threshold
SCORE=$(jq -r '.status.score' .codefortify/pre-commit-status.json)
THRESHOLD=80

if (( $(echo "$SCORE < $THRESHOLD" | bc -l) )); then
    echo "❌ Code quality score ($SCORE) is below threshold ($THRESHOLD)"
    echo "📊 View details: codefortify-status"
    exit 1
fi

echo "✅ Code quality check passed (Score: $SCORE)"
```

## Troubleshooting

### Common Issues

#### Extension Not Activating
```bash
# Check extension installation
cursor --list-extensions | grep codefortify

# Verify extension files
ls -la ~/.cursor/extensions/codefortify*

# Check activation logs
cursor --verbose
```

#### WebSocket Connection Failed
```bash
# Test connection manually
codefortify-status test-connection

# Check if port is in use
netstat -an | grep 8765

# Try alternative port
codefortify start-realtime --port 8766
```

#### Status Not Updating
```bash
# Verify server is running
ps aux | grep codefortify

# Check configuration
cat .codefortify/realtime-config.json

# Test with verbose logging
codefortify score --realtime --verbose
```

#### Performance Issues
```bash
# Monitor resource usage
codefortify monitor --performance

# Optimize settings
echo '{"performance": {"maxConnections": 3, "bufferSize": 50}}' > .codefortify/realtime-config.json

# Use compact mode
codefortify-status --compact
```

### Debug Mode

Enable detailed logging:

```bash
# Enable debug logging
export CODEFORTIFY_DEBUG=true

# Run with debug output
codefortify score --realtime --debug

# WebSocket debug logging
export CODEFORTIFY_WS_DEBUG=true
codefortify start-realtime
```

### Health Check Script

```bash
#!/bin/bash
# codefortify-health-check.sh

echo "🏥 CodeFortify Health Check"
echo "=========================="

# Check CLI installation
if command -v codefortify &> /dev/null; then
    echo "✅ CodeFortify CLI installed"
    codefortify --version
else
    echo "❌ CodeFortify CLI not found"
    exit 1
fi

# Check Cursor extension
if cursor --list-extensions | grep -q codefortify; then
    echo "✅ Cursor extension installed"
else
    echo "⚠️  Cursor extension not installed"
fi

# Check WebSocket connectivity
if codefortify-status test-connection --timeout 3000; then
    echo "✅ WebSocket server reachable"
else
    echo "⚠️  WebSocket server not running"
fi

# Check file outputs
if [ -f ".codefortify/status.json" ]; then
    echo "✅ Status files being generated"
    SCORE=$(jq -r '.status.score' .codefortify/status.json)
    echo "   Current score: $SCORE"
else
    echo "⚠️  No status files found"
fi

echo ""
echo "🚀 Health check complete"
```

## Performance Optimization

### System Requirements

- **Minimum**: 2GB RAM, dual-core CPU
- **Recommended**: 4GB RAM, quad-core CPU
- **Network**: Local connections only (no external traffic)

### Optimization Settings

```json
{
  "performance": {
    "maxConnections": 5,
    "bufferSize": 100,
    "updateInterval": 1000,
    "batchSize": 10,
    "compression": true,
    "keepAliveInterval": 30000
  }
}
```

### Resource Usage

- **Memory**: ~15-30MB base, +2-5MB per connection
- **CPU**: <2% during idle, ~5-10% during active analysis  
- **Network**: Local WebSocket traffic only
- **Disk**: Status files ~1-5KB, logs ~10-50KB per session

## Support

### Getting Help

```bash
# Show help
codefortify --help
codefortify-status --help

# Version information  
codefortify --version

# Configuration info
codefortify config --show
```

### Reporting Issues

Include the following information:

1. **System Info**: OS, Node.js version, Cursor version
2. **Configuration**: `.codefortify/realtime-config.json`
3. **Logs**: Debug output from `codefortify --debug`
4. **Error Messages**: Complete error messages and stack traces

### Community Resources

- **Documentation**: This guide and inline help
- **Examples**: See `examples/` directory
- **Issues**: Report at GitHub repository
- **Discussions**: Community forum for questions

---

*CodeFortify Real-Time Developer Experience v1.0.0*  
*Perfect integration with Cursor.ai IDE and Claude Code* ✨