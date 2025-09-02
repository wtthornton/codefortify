# Agent Initialization Guide

## 🚀 Quick Agent Onboarding for CodeFortify

This guide provides a **lean, efficient initialization system** for new AI agents working on the CodeFortify project, solving the problem of lengthy initial project reviews.

## The Problem

Previously, new agents needed to:
- Read multiple documentation files (5-10 minutes)
- Run multiple commands to understand project status (2-3 minutes) 
- Manually gather essential project information (3-5 minutes)
- **Total time: 10-18 minutes per agent initialization**

## The Solution: `codefortify agent-init`

A single command that provides everything a new agent needs in **under 30 seconds**.

## Usage

### Quick Start (30 seconds)
```bash
npx codefortify agent-init --quick
```

**Output**: Essential project info, current status, and immediate next steps.

### Comprehensive Overview (1-2 minutes)
```bash
npx codefortify agent-init --detailed
```

**Output**: Full project analysis, all command categories, file inventory, and development context.

### Save for Later Reference
```bash
# JSON format for programmatic use
npx codefortify agent-init --format json --output agent-context.json

# Markdown format for documentation
npx codefortify agent-init --format markdown --output agent-briefing.md
```

## What You Get

### 📋 Project Overview
- Project name, type, and version
- Configuration status
- Project root location

### 📊 Current Status  
- Active/inactive state
- Current enhancement phase
- Quality score (if available)
- Last activity timestamp

### ⚡ Command Categories
- **Essential Commands**: Immediate quality checks (`npm run score`, `npm run lint`, `npm test`)
- **CodeFortify Commands**: Core enhancement operations
- **Development Commands**: Standard development workflow

### 📁 Essential Files
- File inventory with sizes and modification dates
- Direct paths to key documentation and code files

### 🎯 Smart Recommendations
- Context-aware next steps based on current project state
- Different recommendations for active vs inactive projects

## Command Options

| Option | Description | Use Case |
|--------|-------------|----------|
| `--quick` | Minimal essential info only | Fast onboarding, immediate work |
| `--detailed` | Comprehensive project analysis | Deep understanding, complex tasks |
| `--format json` | Machine-readable output | Automation, integration |
| `--format markdown` | Documentation format | Sharing, archival |
| `--output <file>` | Save to file | Reference, handoff |

## Integration Examples

### For New Agent Sessions
```bash
# Start every new agent session with:
npx codefortify agent-init --quick

# Then immediately run the recommended next steps
```

### For Handoffs Between Agents
```bash
# Outgoing agent creates handoff document:
npx codefortify agent-init --detailed --format markdown --output handoff-$(date +%Y%m%d).md

# Incoming agent reviews the handoff document
```

### For Automated Systems
```bash
# Generate machine-readable context:
npx codefortify agent-init --format json --output context.json

# Use in scripts or CI/CD pipelines
```

## Comparison: Before vs After

### Before (10-18 minutes)
```bash
# Manual process - multiple steps, multiple commands
cat README.md                    # 3-5 minutes reading
cat AGENTS.md                    # 2-3 minutes reading  
cat CLAUDE.md                    # 1-2 minutes reading
npm run score                    # 30 seconds
npm run lint                     # 30 seconds
npx codefortify status           # 15 seconds
ls -la                           # Manual file exploration
# Total: 10-18 minutes
```

### After (30 seconds)
```bash
# Single command - everything you need
npx codefortify agent-init --quick
# Total: 30 seconds
```

## Best Practices

### 1. **Always Start Here**
Make `agent-init` the first command for any new agent session.

### 2. **Use Appropriate Detail Level**
- `--quick` for immediate tasks and simple changes
- `--detailed` for complex features and architectural work

### 3. **Save Context for Handoffs** 
Generate markdown summaries when transferring work between agents.

### 4. **Update Documentation**
If agent-init reveals outdated information, update the source files.

## Troubleshooting

### Command Not Found
```bash
# Make sure you're in the project root
cd /path/to/context7-mcp

# Verify CodeFortify is installed
npm list @wtthornton/codefortify
```

### Missing Information
```bash
# Run with verbose flag for debugging
npx codefortify agent-init --detailed --verbose
```

### Outdated Status
```bash
# Refresh project status first
npx codefortify score --detailed
npx codefortify agent-init --detailed
```

## Advanced Usage

### Custom Prompts Integration
```bash
# Generate context for LLM prompts
CONTEXT=$(npx codefortify agent-init --format json)
echo "Project Context: $CONTEXT" | your-ai-tool
```

### CI/CD Integration
```yaml
# In GitHub Actions or similar
- name: Generate Agent Context
  run: npx codefortify agent-init --format json --output agent-context.json
  
- name: Upload Context Artifact
  uses: actions/upload-artifact@v3
  with:
    name: agent-context
    path: agent-context.json
```

## Related Commands

- `npx codefortify --help` - Full command reference
- `npx codefortify status` - Current session status
- `npx codefortify score` - Project quality analysis
- `npx codefortify dashboard` - Real-time monitoring

---

**💡 Pro Tip**: Bookmark this command! It's designed to be your go-to starting point for any CodeFortify project work.
