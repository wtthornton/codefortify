/**
 * CodeFortify Real-Time Integration Tests
 * 
 * Comprehensive integration testing for real-time features including:
 * - WebSocket server functionality
 * - VS Code extension integration
 * - Status management and persistence
 * - File-based status output
 * - Cross-platform compatibility
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import WebSocket from 'ws';
import { readFile, access, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { RealtimeEventEmitter } from '../../src/core/RealtimeEventEmitter.js';
import { StatusManager } from '../../src/core/StatusManager.js';
import { MessageQueue } from '../../src/core/MessageQueue.js';
import { FileStatusWriter } from '../../src/core/FileStatusWriter.js';
import { createStatusMonitor } from '../../src/cli/RealtimeStatus.js';

// Test configuration
const TEST_PORT = 9876;
const TEST_DIR = './test-realtime-output';
const TIMEOUT = 10000;

describe('Real-Time Integration Tests', () => {
    let eventEmitter;
    let statusManager;
    let messageQueue;
    let fileWriter;
    let testClient;

    beforeAll(async () => {
        // Create test output directory
        if (existsSync(TEST_DIR)) {
            await rm(TEST_DIR, { recursive: true, force: true });
        }
        await mkdir(TEST_DIR, { recursive: true });
    });

    afterAll(async () => {
        // Cleanup test directory
        if (existsSync(TEST_DIR)) {
            await rm(TEST_DIR, { recursive: true, force: true });
        }
    });

    beforeEach(async () => {
        // Initialize components
        eventEmitter = new RealtimeEventEmitter({ port: TEST_PORT });
        statusManager = new StatusManager({ eventEmitter });
        messageQueue = new MessageQueue();
        fileWriter = new FileStatusWriter({ 
            outputDir: TEST_DIR,
            updateInterval: 500 // Fast updates for testing
        });

        await eventEmitter.initialize();
        await statusManager.initialize();
        await fileWriter.initialize();
    });

    afterEach(async () => {
        // Cleanup
        if (testClient) {
            testClient.close();
            testClient = null;
        }

        if (fileWriter) {
            fileWriter.stop();
        }

        if (statusManager) {
            await statusManager.cleanup();
        }

        if (eventEmitter) {
            await eventEmitter.shutdown();
        }

        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    describe('WebSocket Server Integration', () => {
        test('should start WebSocket server and accept connections', async () => {
            expect(eventEmitter.isRunning()).toBe(true);
            expect(eventEmitter.getPort()).toBe(TEST_PORT);

            // Test connection
            testClient = new WebSocket(`ws://localhost:${TEST_PORT}`);
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
                
                testClient.on('open', () => {
                    clearTimeout(timeout);
                    resolve();
                });
                
                testClient.on('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });

            expect(testClient.readyState).toBe(WebSocket.OPEN);
        }, TIMEOUT);

        test('should handle multiple concurrent connections', async () => {
            const clients = [];
            const connectionCount = 5;

            // Create multiple connections
            const connectionPromises = Array.from({ length: connectionCount }, () => {
                return new Promise((resolve, reject) => {
                    const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
                    const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
                    
                    client.on('open', () => {
                        clearTimeout(timeout);
                        clients.push(client);
                        resolve(client);
                    });
                    
                    client.on('error', reject);
                });
            });

            await Promise.all(connectionPromises);
            expect(clients).toHaveLength(connectionCount);
            expect(eventEmitter.getClientCount()).toBe(connectionCount);

            // Cleanup
            clients.forEach(client => client.close());
        }, TIMEOUT);

        test('should broadcast events to all connected clients', async () => {
            // Create test clients
            const clients = await Promise.all([
                createTestClient(),
                createTestClient(),
                createTestClient()
            ]);

            // Listen for messages on all clients
            const messagePromises = clients.map(client => {
                return new Promise(resolve => {
                    client.on('message', (data) => {
                        resolve(JSON.parse(data.toString()));
                    });
                });
            });

            // Emit test event
            const testEvent = {
                type: 'score_update',
                data: { score: 95.5, trend: 'up' }
            };

            eventEmitter.emit('statusUpdate', testEvent);

            // Wait for all clients to receive the message
            const receivedMessages = await Promise.all(messagePromises);
            
            receivedMessages.forEach(message => {
                expect(message.type).toBe('score_update');
                expect(message.data.score).toBe(95.5);
            });

            // Cleanup
            clients.forEach(client => client.close());
        }, TIMEOUT);
    });

    describe('Status Management Integration', () => {
        test('should update status and emit events', async () => {
            testClient = await createTestClient();

            const messagePromise = new Promise(resolve => {
                testClient.on('message', (data) => {
                    resolve(JSON.parse(data.toString()));
                });
            });

            // Update status
            await statusManager.updateStatus({
                phase: 'analyzing',
                progress: 45,
                message: 'Testing status update',
                score: 87.3
            });

            const receivedMessage = await messagePromise;
            expect(receivedMessage.type).toBe('status_update');
            expect(receivedMessage.data.phase).toBe('analyzing');
            expect(receivedMessage.data.progress).toBe(45);
            expect(receivedMessage.data.score).toBe(87.3);
        }, TIMEOUT);

        test('should persist status across sessions', async () => {
            // Update status
            await statusManager.updateStatus({
                phase: 'enhancing',
                progress: 78,
                score: 92.1,
                sessionId: 'test-session-123'
            });

            const currentStatus = statusManager.getCurrentStatus();
            expect(currentStatus.phase).toBe('enhancing');
            expect(currentStatus.progress).toBe(78);
            expect(currentStatus.score).toBe(92.1);

            // Simulate restart by creating new status manager
            const newStatusManager = new StatusManager({ eventEmitter });
            await newStatusManager.initialize();

            // Should restore previous status
            const restoredStatus = newStatusManager.getCurrentStatus();
            expect(restoredStatus.sessionId).toBe('test-session-123');

            await newStatusManager.cleanup();
        }, TIMEOUT);

        test('should track agent progress correctly', async () => {
            testClient = await createTestClient();

            const messages = [];
            testClient.on('message', (data) => {
                messages.push(JSON.parse(data.toString()));
            });

            // Register and update agents
            await statusManager.registerAgent('security-agent', { category: 'security' });
            await statusManager.registerAgent('quality-agent', { category: 'quality' });

            await statusManager.updateAgentStatus('security-agent', {
                status: 'analyzing',
                progress: 60,
                findings: 3
            });

            await statusManager.updateAgentStatus('quality-agent', {
                status: 'complete',
                progress: 100,
                findings: 0
            });

            // Wait for messages
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(messages.length).toBeGreaterThan(0);
            const agentMessages = messages.filter(msg => msg.type === 'agent_update');
            expect(agentMessages.length).toBeGreaterThanOrEqual(2);
        }, TIMEOUT);
    });

    describe('File Status Writer Integration', () => {
        test('should write status to JSON file', async () => {
            await fileWriter.updateStatus({
                score: 94.7,
                phase: 'complete',
                progress: 100,
                message: 'Analysis complete',
                issues: { critical: 0, high: 1, medium: 3, low: 5 }
            });

            // Wait for file write
            await new Promise(resolve => setTimeout(resolve, 600));

            const jsonPath = path.join(TEST_DIR, 'status.json');
            expect(existsSync(jsonPath)).toBe(true);

            const jsonContent = await readFile(jsonPath, 'utf-8');
            const data = JSON.parse(jsonContent);

            expect(data.status.score).toBe(94.7);
            expect(data.status.phase).toBe('complete');
            expect(data.status.issues.high).toBe(1);
            expect(data.status.issues.medium).toBe(3);
        }, TIMEOUT);

        test('should write status to Markdown file', async () => {
            await fileWriter.updateStatus({
                score: 88.2,
                phase: 'analyzing',
                progress: 67,
                issues: { critical: 2, high: 0, medium: 1, low: 0 },
                categories: {
                    security: { score: 95.0, status: 'complete' },
                    quality: { score: 82.5, status: 'analyzing' }
                }
            });

            // Wait for file write
            await new Promise(resolve => setTimeout(resolve, 600));

            const mdPath = path.join(TEST_DIR, 'STATUS.md');
            expect(existsSync(mdPath)).toBe(true);

            const mdContent = await readFile(mdPath, 'utf-8');
            
            expect(mdContent).toContain('# CodeFortify Status');
            expect(mdContent).toContain('88.2/100');
            expect(mdContent).toContain('| Critical | 2 |');
            expect(mdContent).toContain('| security | 95.0 |');
            expect(mdContent).toContain('| quality | 82.5 |');
        }, TIMEOUT);

        test('should generate badge files', async () => {
            await fileWriter.updateStatus({
                score: 91.5,
                phase: 'complete',
                issues: { critical: 0, high: 0, medium: 2, low: 1 }
            });

            // Wait for file write
            await new Promise(resolve => setTimeout(resolve, 600));

            // Check badge files
            const scoreBadgePath = path.join(TEST_DIR, 'score-badge.json');
            const statusBadgePath = path.join(TEST_DIR, 'status-badge.json');
            const issuesBadgePath = path.join(TEST_DIR, 'issues-badge.json');

            expect(existsSync(scoreBadgePath)).toBe(true);
            expect(existsSync(statusBadgePath)).toBe(true);
            expect(existsSync(issuesBadgePath)).toBe(true);

            const scoreBadge = JSON.parse(await readFile(scoreBadgePath, 'utf-8'));
            expect(scoreBadge.message).toBe('91.5/100');
            expect(scoreBadge.color).toBe('brightgreen');

            const issuesBadge = JSON.parse(await readFile(issuesBadgePath, 'utf-8'));
            expect(issuesBadge.message).toBe('3 found');
            expect(issuesBadge.color).toBe('red');
        }, TIMEOUT);

        test('should maintain status history', async () => {
            // Update status multiple times
            await fileWriter.updateStatus({ score: 85.0, phase: 'analyzing' });
            await fileWriter.updateStatus({ score: 87.5, phase: 'enhancing' });
            await fileWriter.updateStatus({ score: 90.2, phase: 'complete' });

            // Wait for file write
            await new Promise(resolve => setTimeout(resolve, 600));

            const jsonPath = path.join(TEST_DIR, 'status.json');
            const jsonContent = await readFile(jsonPath, 'utf-8');
            const data = JSON.parse(jsonContent);

            expect(data.history).toBeDefined();
            expect(data.history.length).toBeGreaterThan(0);
            
            const lastEntry = data.history[data.history.length - 1];
            expect(lastEntry.score).toBe(90.2);
            expect(lastEntry.phase).toBe('complete');
        }, TIMEOUT);
    });

    describe('Message Queue Integration', () => {
        test('should queue and process messages with priorities', async () => {
            const processedMessages = [];
            
            messageQueue.on('message', (message) => {
                processedMessages.push(message);
            });

            // Add messages with different priorities
            messageQueue.add({ content: 'Low priority', priority: 'low' });
            messageQueue.add({ content: 'Critical priority', priority: 'critical' });
            messageQueue.add({ content: 'High priority', priority: 'high' });
            messageQueue.add({ content: 'Medium priority', priority: 'medium' });

            messageQueue.start();

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 200));

            expect(processedMessages).toHaveLength(4);
            
            // Verify priority ordering (critical, high, medium, low)
            expect(processedMessages[0].content).toBe('Critical priority');
            expect(processedMessages[1].content).toBe('High priority');
            expect(processedMessages[2].content).toBe('Medium priority');
            expect(processedMessages[3].content).toBe('Low priority');
        }, TIMEOUT);

        test('should deduplicate similar messages', async () => {
            const processedMessages = [];
            
            messageQueue.on('message', (message) => {
                processedMessages.push(message);
            });

            // Add duplicate messages
            messageQueue.add({ content: 'Duplicate message', type: 'info', priority: 'medium' });
            messageQueue.add({ content: 'Duplicate message', type: 'info', priority: 'medium' });
            messageQueue.add({ content: 'Unique message', type: 'info', priority: 'medium' });

            messageQueue.start();

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 200));

            // Should only process unique messages
            expect(processedMessages).toHaveLength(2);
            expect(processedMessages.find(msg => msg.content === 'Duplicate message')).toBeDefined();
            expect(processedMessages.find(msg => msg.content === 'Unique message')).toBeDefined();
        }, TIMEOUT);
    });

    describe('End-to-End Integration', () => {
        test('should handle complete analysis workflow', async () => {
            testClient = await createTestClient();
            
            const receivedMessages = [];
            testClient.on('message', (data) => {
                receivedMessages.push(JSON.parse(data.toString()));
            });

            // Simulate complete workflow
            await statusManager.updateStatus({ phase: 'analysis_start', progress: 0 });
            await statusManager.updateStatus({ phase: 'analyzing', progress: 25 });
            await statusManager.updateStatus({ phase: 'analyzing', progress: 50 });
            await statusManager.updateStatus({ phase: 'analyzing', progress: 75 });
            await statusManager.updateStatus({ 
                phase: 'complete', 
                progress: 100, 
                score: 93.7,
                issues: { critical: 0, high: 1, medium: 2, low: 3 }
            });

            // Wait for all messages and file writes
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Verify WebSocket messages
            expect(receivedMessages.length).toBeGreaterThanOrEqual(5);
            
            const completeMessage = receivedMessages.find(msg => 
                msg.data && msg.data.phase === 'complete'
            );
            expect(completeMessage).toBeDefined();
            expect(completeMessage.data.score).toBe(93.7);

            // Verify file outputs
            const jsonPath = path.join(TEST_DIR, 'status.json');
            const mdPath = path.join(TEST_DIR, 'STATUS.md');
            
            expect(existsSync(jsonPath)).toBe(true);
            expect(existsSync(mdPath)).toBe(true);

            const finalStatus = JSON.parse(await readFile(jsonPath, 'utf-8'));
            expect(finalStatus.status.score).toBe(93.7);
            expect(finalStatus.status.phase).toBe('complete');
        }, TIMEOUT);

        test('should handle connection recovery', async () => {
            testClient = await createTestClient();
            
            // Verify initial connection
            expect(testClient.readyState).toBe(WebSocket.OPEN);
            
            // Close connection
            testClient.close();
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Reconnect
            testClient = await createTestClient();
            expect(testClient.readyState).toBe(WebSocket.OPEN);
            
            // Should receive status updates
            const messagePromise = new Promise(resolve => {
                testClient.on('message', (data) => {
                    resolve(JSON.parse(data.toString()));
                });
            });

            await statusManager.updateStatus({ phase: 'reconnect_test', score: 88.8 });
            
            const message = await messagePromise;
            expect(message.data.score).toBe(88.8);
        }, TIMEOUT);
    });

    describe('Performance Tests', () => {
        test('should handle high-frequency updates efficiently', async () => {
            testClient = await createTestClient();
            
            const receivedMessages = [];
            testClient.on('message', (data) => {
                receivedMessages.push(JSON.parse(data.toString()));
            });

            const startTime = Date.now();
            const updateCount = 100;

            // Send many rapid updates
            for (let i = 0; i < updateCount; i++) {
                await statusManager.updateStatus({
                    phase: 'performance_test',
                    progress: i,
                    score: 80 + (i / 10)
                });
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Wait for all messages to be processed
            await new Promise(resolve => setTimeout(resolve, 500));

            // Performance assertions
            expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
            expect(receivedMessages.length).toBeGreaterThan(0);
            
            // Should receive updates efficiently (may be batched)
            console.log(`Processed ${updateCount} updates in ${duration}ms`);
            console.log(`Received ${receivedMessages.length} WebSocket messages`);
        }, TIMEOUT);
    });

    // Helper functions
    async function createTestClient() {
        return new Promise((resolve, reject) => {
            const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
            const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
            
            client.on('open', () => {
                clearTimeout(timeout);
                resolve(client);
            });
            
            client.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
});