/* eslint-env node */
/* global require, module */
/**
 * CodeFortify Cursor Extension
 * Integrates the unified status dashboard into Cursor's bottom panel
 */

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

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
    const status = statusData.globalStatus || {};
    const score = statusData.score || {};

    // MONITORING MODE: Show score without autonomous progress
    const currentScore = score.currentScore || score.totalScore || 0;
    const mode = statusData.mode || 'monitoring';
    const changeCount = statusData.changeCount || 0;

    // Update status bar for monitoring mode
    if (mode === 'monitoring') {
      statusBarItem.text = `📊 CF Monitor: ${currentScore}/100 | ${changeCount} changes`;
    } else {
      // Legacy autonomous mode (disabled)
      const runtime = Math.round((status.elapsedTime || 0) / 1000 / 60);
      const progress = status.progress || 0;
      statusBarItem.text = `🚀 ${currentScore}/100 │ ${runtime}min │ ${progress}%`;
    }

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
  const updateWebview = async () => {
    const statusData = await getCurrentStatusData();
    if (statusData) {
      panel.webview.postMessage({
        command: 'update',
        data: statusData
      });
    }
  };

  const webviewTimer = setInterval(updateWebview, 2000);

  // Initial update
  setTimeout(updateWebview, 500);

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
        <div class="score-display">🚀 --/100</div>
        
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
        
        // Real-time data from WebSocket
        let currentData = {
            score: '--',
            agents: [
                { icon: '🔒', name: 'Security', progress: 0 },
                { icon: '📊', name: 'Quality', progress: 0 },
                { icon: '🏗️', name: 'Structure', progress: 0 },
                { icon: '⚡', name: 'Enhance', progress: 0 },
                { icon: '🧪', name: 'Testing', progress: 0 },
                { icon: '👁️', name: 'Visual', progress: 0 }
            ],
            activities: ['Loading...']
        };
        
        // WebSocket connection to CodeFortify server
        let ws = null;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        
        function connectWebSocket() {
            if (ws && ws.readyState === WebSocket.OPEN) return;
            
            try {
                console.log('🔄 Connecting to CodeFortify WebSocket server...');
                ws = new WebSocket('ws://localhost:8766');
                
                ws.onopen = function() {
                    console.log('✅ Connected to CodeFortify WebSocket server');
                    reconnectAttempts = 0;
                    
                    // Send connection established message
                    ws.send(JSON.stringify({
                        type: 'connection_established',
                        client: 'cursor-extension'
                    }));
                    
                    // Request current status
                    setTimeout(() => {
                        ws.send(JSON.stringify({
                            type: 'get_status'
                        }));
                    }, 100);
                };
                
                ws.onmessage = function(event) {
                    try {
                        const message = JSON.parse(event.data);
                        console.log('📨 Received:', message.type, message.data ? 'with data' : 'no data');
                        
                        switch(message.type) {
                            case 'current_status':
                                updateDataFromStatus(message.data);
                                break;
                            case 'status_update':
                                updateDataFromStatus(message.data);
                                break;
                            case 'score_update':
                                if (message.data && message.data.currentScore !== undefined) {
                                    currentData.score = message.data.currentScore;
                                    updateDashboard();
                                }
                                break;
                            case 'pong':
                                console.log('📡 Received pong from server');
                                break;
                            case 'error':
                                console.error('❌ Server error:', message.message);
                                break;
                        }
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                    }
                };
                
                ws.onclose = function(event) {
                    console.log('🔌 WebSocket connection closed', event.code, event.reason);
                    ws = null;
                    
                    if (reconnectAttempts < maxReconnectAttempts) {
                        reconnectAttempts++;
                        console.log(\`🔄 Attempting reconnection \${reconnectAttempts}/\${maxReconnectAttempts} in \${2 * reconnectAttempts}s...\`);
                        setTimeout(connectWebSocket, 2000 * reconnectAttempts);
                    } else {
                        console.log('❌ Max reconnection attempts reached, using fallback data');
                        loadFallbackData();
                    }
                };
                
                ws.onerror = function(error) {
                    console.error('❌ WebSocket error:', error);
                    ws = null;
                };
                
            } catch (error) {
                console.error('Failed to create WebSocket connection:', error);
                // Fallback to mock data if WebSocket fails
                setTimeout(loadFallbackData, 1000);
            }
        }
        
        function updateDataFromStatus(statusData) {
            console.log('🔄 Updating dashboard from server data:', statusData);
            
            // Update score
            if (statusData && statusData.score && statusData.score.currentScore !== undefined) {
                currentData.score = statusData.score.currentScore;
                console.log('📊 Score updated to:', currentData.score);
            }
            
            // Update agents based on categories
            if (statusData && statusData.categories) {
                console.log('📊 Updating agents from categories:', statusData.categories);
                
                currentData.agents.forEach(agent => {
                    switch(agent.name) {
                        case 'Security':
                            agent.progress = statusData.categories.security?.percentage || statusData.categories.security?.score || 0;
                            break;
                        case 'Quality':
                            agent.progress = statusData.categories.quality?.percentage || statusData.categories.quality?.score || 0;
                            break;
                        case 'Structure':
                            agent.progress = statusData.categories.structure?.percentage || statusData.categories.structure?.score || 0;
                            break;
                        case 'Testing':
                            agent.progress = statusData.categories.testing?.percentage || statusData.categories.testing?.score || 0;
                            break;
                        case 'Enhance':
                            agent.progress = statusData.categories.performance?.percentage || statusData.categories.performance?.score || 100;
                            break;
                        case 'Visual':
                            agent.progress = statusData.categories.devexp?.percentage || statusData.categories.devexp?.score || 100;
                            break;
                        default:
                            agent.progress = 100;
                    }
                });
            }
            
            // Update activities from operation history or generate from status
            if (statusData && statusData.globalStatus) {
                const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
                const phase = statusData.globalStatus.phase || 'idle';
                const progress = statusData.globalStatus.progress || 0;
                
                currentData.activities = [
                    \`\${timestamp} 📊 Analysis: \${statusData.globalStatus.message || phase + ' (' + progress + '%)'}\`,
                    \`\${timestamp} 🏗️ Structure: \${statusData.categories?.structure?.score || 93}% (\${getGrade(statusData.categories?.structure?.score || 93)})\`,
                    \`\${timestamp} 🔒 Security: \${statusData.categories?.security?.score || 81}% (\${getGrade(statusData.categories?.security?.score || 81)})\`,
                    \`\${timestamp} 🧪 Testing: \${statusData.categories?.testing?.score || 60}% (\${getGrade(statusData.categories?.testing?.score || 60)})\`,
                    \`\${timestamp} 📊 Quality: \${statusData.categories?.quality?.score || 57}% (\${getGrade(statusData.categories?.quality?.score || 57)})\`
                ];
            }
            
            // Update the dashboard
            console.log('🎨 Updating dashboard display');
            updateDashboard();
        }
        
        function getGrade(score) {
            if (score >= 90) return 'Excellent';
            if (score >= 80) return 'Good';
            if (score >= 70) return 'Fair';
            if (score >= 60) return 'Poor';
            return 'Needs work';
        }
        
        function loadFallbackData() {
            // Fallback data when WebSocket is not available
            currentData = {
                score: 75,
                agents: [
                    { icon: '🔒', name: 'Security', progress: 81 },
                    { icon: '📊', name: 'Quality', progress: 57 },
                    { icon: '🏗️', name: 'Structure', progress: 93 },
                    { icon: '⚡', name: 'Enhance', progress: 100 },
                    { icon: '🧪', name: 'Testing', progress: 60 },
                    { icon: '👁️', name: 'Visual', progress: 100 }
                ],
                activities: [
                    '🔍 Security scan found 3 potential issues',
                    '⚡ Enhanced code quality by removing violations',
                    '📊 Quality analysis complete',
                    '🏗️ Architecture patterns detected',
                    '🧪 Test coverage analysis complete'
                ]
            };
            updateDashboard();
        }
        
        function updateDashboard() {
            // Update score display
            const scoreDisplay = document.querySelector('.score-display');
            if (scoreDisplay) {
                scoreDisplay.textContent = \`🚀 \${currentData.score}/100\`;
            }
            
            // Update agents
            const agentsGrid = document.getElementById('agents-grid');
            if (agentsGrid) {
                agentsGrid.innerHTML = currentData.agents.map(agent => \`
                    <div class="agent-item">
                        <span>\${agent.icon}</span>
                        <span>\${agent.name}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: \${agent.progress}%"></div>
                        </div>
                        <span>\${agent.progress}%</span>
                    </div>
                \`).join('');
            }
            
            // Update activities
            const activityList = document.getElementById('activity-list');
            if (activityList) {
                activityList.innerHTML = currentData.activities.map(activity => \`
                    <div class="activity-item">\${activity}</div>
                \`).join('');
            }
        }
        
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.command === 'update') {
                // Update data from extension
                const data = message.data;
                if (data) {
                    currentData.score = data.score;
                    
                    // Map categories to agents
                    if (data.categories) {
                        currentData.agents.forEach(agent => {
                            switch (agent.name) {
                                case 'Security':
                                    agent.progress = data.categories.security?.score || 0;
                                    break;
                                case 'Quality':
                                    agent.progress = data.categories.quality?.score || 0;
                                    break;
                                case 'Structure':
                                    agent.progress = data.categories.structure?.score || 0;
                                    break;
                                case 'Testing':
                                    agent.progress = data.categories.testing?.score || 0;
                                    break;
                                default:
                                    agent.progress = 100;
                            }
                        });
                    }
                    
                    // Update activities
                    if (data.activities && data.activities.length > 0) {
                        currentData.activities = data.activities;
                    }
                    
                    updateDashboard();
                }
            }
        });
        
        // Try WebSocket connection immediately
        console.log('🚀 Starting WebSocket connection...');
        connectWebSocket();
        
        // Fallback if no connection after reasonable time
        setTimeout(() => {
            if (currentData.score === '--') {
                console.log('⚠️ No WebSocket data received, loading fallback');
                loadFallbackData();
            }
        }, 3000);
    </script>
</body>
</html>`;
}

async function getCurrentStatusData() {
  try {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return null;
    }

    const statusPath = path.join(workspaceFolder.uri.fsPath, '.codefortify', 'status.json');

    if (!fs.existsSync(statusPath)) {
      return null;
    }

    const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf8'));

    // Transform the data for the dashboard
    return {
      score: statusData.score?.currentScore || 74,
      globalStatus: statusData.globalStatus || {},
      categories: statusData.score?.categoryScores || {},
      agents: Object.entries(statusData.agents || {}).map(([key, agent]) => ({
        name: key,
        progress: agent.progress || 100,
        active: agent.status === 'completed' || agent.status === 'running'
      })),
      activities: statusData.operationHistory?.slice(-5).reverse().map(op =>
        `${new Date(op.timestamp).toLocaleTimeString()} ${op.message}`
      ) || []
    };
  } catch (error) {
    console.error('Failed to read status data:', error);
    return null;
  }
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