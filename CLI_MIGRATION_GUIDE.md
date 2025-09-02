# 🚀 CodeFortify CLI Migration Guide

## **From 17 Commands to 5 Core Commands**

This guide helps you migrate from the old complex CLI structure to the new simplified 5-command system.

## **Migration Overview**

### **Before (17 Commands)**
```bash
# Setup & Configuration
codefortify init
codefortify add
codefortify validate

# Analysis & Scoring  
codefortify score
codefortify status

# Enhancement
codefortify enhance

# Monitoring & Control
codefortify monitor
codefortify dashboard
codefortify stop
codefortify pause
codefortify resume

# Development Tools
codefortify test-mcp
codefortify serve
codefortify generate
codefortify update
codefortify template
codefortify prompt
codefortify agent-init
```

### **After (5 Commands)**
```bash
# Setup & Configuration
codefortify setup

# Analysis & Scoring
codefortify analyze

# Enhancement  
codefortify enhance

# Monitoring & Control
codefortify monitor

# Development Tools
codefortify tools
```

## **Command Mapping**

### **1. SETUP** (Replaces: `init`, `add`, `validate`)
```bash
# OLD
codefortify init
codefortify add --type react-webapp
codefortify validate --strict

# NEW
codefortify setup
codefortify setup --type react-webapp
codefortify setup --force
```

### **2. ANALYZE** (Replaces: `score`, `status`)
```bash
# OLD
codefortify score --detailed --recommendations
codefortify status --format json

# NEW
codefortify analyze --detailed --recommendations
codefortify analyze --format json
```

### **3. ENHANCE** (Unchanged)
```bash
# OLD & NEW (same)
codefortify enhance src/ --target 95 --iterations 3
```

### **4. MONITOR** (Replaces: `monitor`, `status`, `dashboard`, `stop`, `pause`, `resume`)
```bash
# OLD
codefortify monitor --start
codefortify status
codefortify dashboard
codefortify stop
codefortify pause
codefortify resume

# NEW
codefortify monitor --start
codefortify monitor                    # Shows status by default
codefortify monitor --dashboard
codefortify monitor --stop
codefortify monitor --pause
codefortify monitor --resume
```

### **5. TOOLS** (Replaces: `test-mcp`, `validate`, `agent-init`, `prompt`)
```bash
# OLD
codefortify test-mcp
codefortify validate
codefortify agent-init --quick
codefortify prompt --type enhancement

# NEW
codefortify tools --test-mcp
codefortify tools --validate
codefortify tools --init-agent --quick
codefortify tools --prompt enhancement
```

## **Option Consolidation**

### **Standardized Global Options**
```bash
# Available on ALL commands
-v, --verbose     # Enable verbose output
-q, --quiet       # Suppress non-essential output
-c, --config      # Use custom config file
--no-color        # Disable colored output
--dry-run         # Show what would be done without executing
```

### **Standardized Output Options**
```bash
# Available on analyze, enhance, monitor, tools
-f, --format <format>    # Output format (console, json, markdown)
-o, --output <file>      # Save results to file
```

## **Migration Examples**

### **Project Setup**
```bash
# OLD (3 commands)
codefortify init
codefortify validate --strict
codefortify score --detailed

# NEW (1 command)
codefortify setup
```

### **Quality Analysis**
```bash
# OLD (2 commands)
codefortify score --detailed --recommendations --format json
codefortify status --agents

# NEW (1 command)
codefortify analyze --detailed --recommendations --format json
```

### **Agent Management**
```bash
# OLD (6 commands)
codefortify monitor --start
codefortify status --watch
codefortify pause
codefortify resume
codefortify dashboard
codefortify stop

# NEW (1 command with options)
codefortify monitor --start
codefortify monitor --watch
codefortify monitor --pause
codefortify monitor --resume
codefortify monitor --dashboard
codefortify monitor --stop
```

### **Development Workflow**
```bash
# OLD (4 commands)
codefortify agent-init --quick
codefortify test-mcp
codefortify validate
codefortify prompt --type enhancement

# NEW (1 command with options)
codefortify tools --init-agent --quick
codefortify tools --test-mcp
codefortify tools --validate
codefortify tools --prompt enhancement
```

## **Backward Compatibility**

### **Legacy Support**
- Old commands still work but show deprecation warnings
- Automatic migration suggestions provided
- Gradual transition period supported

### **Migration Commands**
```bash
# Check what needs migration
codefortify tools --migrate-check

# Auto-migrate configuration
codefortify tools --migrate-config

# Show migration suggestions
codefortify help --migration
```

## **Benefits of New Structure**

### **1. Reduced Cognitive Load**
- **Before**: 17 commands to remember
- **After**: 5 intuitive commands

### **2. Consistent Options**
- **Before**: Different options per command
- **After**: Standardized options across all commands

### **3. Better Discoverability**
- **Before**: Hidden functionality across many commands
- **After**: Clear command purposes with sub-options

### **4. Improved Workflows**
- **Before**: Multiple commands for single workflow
- **After**: Single command with multiple options

## **Quick Reference**

### **Most Common Workflows**
```bash
# New project setup
codefortify setup

# Daily development
codefortify analyze --detailed
codefortify enhance src/ --target 95
codefortify monitor --dashboard

# Agent onboarding
codefortify tools --init-agent --quick

# Quality assurance
codefortify tools --test-mcp
codefortify tools --validate
```

### **Help Commands**
```bash
# General help
codefortify help

# Command-specific help
codefortify setup --help
codefortify analyze --help
codefortify enhance --help
codefortify monitor --help
codefortify tools --help

# Migration help
codefortify help --migration
```

## **Troubleshooting**

### **Command Not Found**
```bash
# If old commands don't work
codefortify help --migration

# Check available commands
codefortify --help
```

### **Option Not Recognized**
```bash
# Check command-specific options
codefortify <command> --help

# Use standardized options
codefortify <command> --verbose --format json
```

### **Configuration Issues**
```bash
# Reset configuration
codefortify setup --force

# Validate setup
codefortify tools --validate
```

---

**🎉 Welcome to the simplified CodeFortify CLI!**

The new structure makes CodeFortify more intuitive, consistent, and powerful while maintaining all the functionality you need.
