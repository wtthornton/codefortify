/**
 * CodeFortify Cursor Extension
 * Integrates the unified status dashboard into Cursor's bottom panel
 */

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

let statusPanel;
let statusBarItem;
let updateTimer;

function activate(context) {
    console.log('CodeFortify extension activated');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left, 
        100
    );
    statusBarItem.command = 'codefortify.openDashboard';
    context.subscriptions.push(statusBarItem);

    // Register commands
    const openDashboard = vscode.commands.registerCommand('codefortify.openDashboard', () => {
        showDashboardPanel(context);
    });

    const toggleMonitoring = vscode.commands.registerCommand('codefortify.toggleMonitoring', () => {
        toggleStatusMonitoring();
    });

    context.subscriptions.push(openDashboard, toggleMonitoring);

    // Start monitoring
    startStatusMonitoring();
    statusBarItem.show();
}

function startStatusMonitoring() {
    updateTimer = setInterval(async () => {
        await updateStatusBar();
    }, 2000); // Update every 2 seconds

    // Initial update
    updateStatusBar();
}

function stopStatusMonitoring() {
    if (updateTimer) {
        clearInterval(updateTimer);
        updateTimer = null;
    }
}

function toggleStatusMonitoring() {
    if (updateTimer) {
        stopStatusMonitoring();
        statusBarItem.text = '🚀 CodeFortify (Paused)';
        vscode.window.showInformationMessage('CodeFortify monitoring paused');
    } else {
        startStatusMonitoring();
        vscode.window.showInformationMessage('CodeFortify monitoring resumed');
    }
}

async function updateStatusBar() {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            statusBarItem.text = '🚀 CodeFortify';
            return;
        }

        const statusPath = path.join(workspaceFolder.uri.fsPath, '.codefortify', 'status.json');
        
        if (!fs.existsSync(statusPath)) {
            statusBarItem.text = '🚀 CodeFortify (Inactive)';
            statusBarItem.tooltip = 'Run `codefortify enhance` to start background agents';
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            return;
        }

        const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
        const status = statusData.globalStatus;
        const score = statusData.score;
        
        const runtime = Math.round((status.elapsedTime || 0) / 1000 / 60);
        const currentScore = score.currentScore || 73; // Default for demo
        const progress = status.progress || 0;

        // Update status bar
        statusBarItem.text = `🚀 ${currentScore}/100 │ ${runtime}min │ ${progress}%`;
        
        // Color coding based on score
        if (currentScore >= 80) {
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        } else if (currentScore >= 70) {
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else {
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }

        // Enhanced tooltip
        statusBarItem.tooltip = createDetailedTooltip(statusData);

    } catch (error) {
        statusBarItem.text = '🚀 CodeFortify (Error)';
        statusBarItem.tooltip = `Error reading status: ${error.message}`;
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }
}

function createDetailedTooltip(statusData) {
    const status = statusData.globalStatus;
    const score = statusData.score;
    
    return new vscode.MarkdownString(`
### 🚀 CodeFortify Dashboard

**Overall Score:** ${score.currentScore || 73}/100  
**Phase:** ${status.phase} (${status.progress}%)  
**Runtime:** ${Math.round((status.elapsedTime || 0) / 1000 / 60)} minutes  
**Message:** ${status.message}  

---

**Active Analysis:**
- 🔒 Security scanning
- 📊 Quality assessment  
- 🏗️ Structure analysis
- ⚡ Code enhancement
- 🧪 Test coverage
- 👁️ Visual testing

---

*Click to open full dashboard*
    `.trim());
}

function showDashboardPanel(context) {
    // Create and show dashboard webview
    const panel = vscode.window.createWebviewPanel(
        'codefortifyDashboard',
        'CodeFortify Dashboard',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, 'webview'))
            ]
        }
    );

    // Set webview content
    panel.webview.html = getDashboardHTML();

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'pause':
                    toggleStatusMonitoring();
                    break;
                case 'settings':
                    vscode.commands.executeCommand('workbench.action.openSettings', 'codefortify');
                    break;
                case 'report':
                    vscode.commands.executeCommand('codefortify.generateReport');
                    break;
            }
        },
        undefined,
        context.subscriptions
    );

    // Update webview periodically
    const updateWebview = () => {
        panel.webview.postMessage({
            command: 'update',
            data: getCurrentStatusData()
        });
    };

    const webviewTimer = setInterval(updateWebview, 1000);
    
    panel.onDidDispose(() => {
        clearInterval(webviewTimer);
    }, null, context.subscriptions);
}

function getDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeFortify Dashboard</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 20px;
        }
        .dashboard {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .panel {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 8px;
            padding: 15px;
            border: 1px solid var(--vscode-panel-border);
        }
        .agents-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        .agent-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px;
            background: var(--vscode-input-background);
            border-radius: 4px;
        }
        .progress-bar {
            flex: 1;
            height: 6px;
            background: var(--vscode-progressBar-background);
            border-radius: 3px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: var(--vscode-progressBar-foreground);
            transition: width 0.3s ease;
        }
        .activity-feed {
            grid-column: 1 / -1;
            max-height: 200px;
            overflow-y: auto;
        }
        .activity-item {
            padding: 5px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
            font-size: 0.9em;
        }
        .controls {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
        }
        .control-btn {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .control-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .score-display {
            text-align: center;
            font-size: 2em;
            margin-bottom: 10px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div id="dashboard">
        <div class="score-display">🚀 73/100</div>
        
        <div class="dashboard">
            <div class="panel">
                <h3>🤖 Active Agents</h3>
                <div class="agents-grid" id="agents-grid">
                    <!-- Agents will be populated by JavaScript -->
                </div>
            </div>
            
            <div class="panel">
                <h3>📊 Quality Categories</h3>
                <div id="categories-grid">
                    <!-- Categories will be populated by JavaScript -->
                </div>
            </div>
        </div>
        
        <div class="panel activity-feed">
            <h3>📋 Live Activity Feed</h3>
            <div id="activity-list">
                <!-- Activities will be populated by JavaScript -->
            </div>
        </div>
        
        <div class="controls">
            <button class="control-btn" onclick="sendMessage('pause')">⏸️ Pause</button>
            <button class="control-btn" onclick="sendMessage('settings')">🎛️ Settings</button>
            <button class="control-btn" onclick="sendMessage('report')">📊 Report</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function sendMessage(command) {
            vscode.postMessage({ command });
        }
        
        // Mock data for demo
        const mockData = {
            agents: [
                { icon: '🔒', name: 'Security', progress: 80 },
                { icon: '📊', name: 'Quality', progress: 60 },
                { icon: '🏗️', name: 'Structure', progress: 70 },
                { icon: '⚡', name: 'Enhance', progress: 50 },
                { icon: '🧪', name: 'Testing', progress: 60 },
                { icon: '👁️', name: 'Visual', progress: 40 }
            ],
            activities: [
                '19:12:23 🔍 SecurityAgent → Fixed hardcoded secret in .npmrc',
                '19:12:18 ⚡ EnhanceAgent → Improved 15 ESLint violations',
                '19:12:12 📊 QualityAgent → Boosted maintainability 63→65%',
                '19:12:08 🏗️ StructureAgent → Detected 3 new architecture patterns',
                '19:12:03 🧪 TestingAgent → Generated coverage report (60%)'
            ]
        };
        
        function updateDashboard() {
            // Update agents
            const agentsGrid = document.getElementById('agents-grid');
            agentsGrid.innerHTML = mockData.agents.map(agent => \`
                <div class="agent-item">
                    <span>\${agent.icon}</span>
                    <span>\${agent.name}</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: \${agent.progress}%"></div>
                    </div>
                    <span>\${agent.progress}%</span>
                </div>
            \`).join('');
            
            // Update activities
            const activityList = document.getElementById('activity-list');
            activityList.innerHTML = mockData.activities.map(activity => \`
                <div class="activity-item">\${activity}</div>
            \`).join('');
        }
        
        // Initial update
        updateDashboard();
        
        // Update every 2 seconds
        setInterval(updateDashboard, 2000);
    </script>
</body>
</html>`;
}

function getCurrentStatusData() {
    // This would read from the actual status file
    // For now, return mock data
    return {
        score: 73,
        agents: [
            { name: 'Security', progress: 80, active: true },
            { name: 'Quality', progress: 60, active: true },
            // ... more agents
        ]
    };
}

function deactivate() {
    stopStatusMonitoring();
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}

module.exports = {
    activate,
    deactivate
};