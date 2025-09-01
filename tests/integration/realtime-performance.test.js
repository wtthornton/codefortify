/**
 * CodeFortify Real-Time Performance Tests
 * 
 * Performance and load testing for real-time features
 * Tests system behavior under various load conditions
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import WebSocket from 'ws';
import { performance } from 'perf_hooks';
import { RealtimeEventEmitter } from '../../src/core/RealtimeEventEmitter.js';
import { StatusManager } from '../../src/core/StatusManager.js';

const TEST_PORT = 9877;
const PERFORMANCE_TIMEOUT = 30000;

describe('Real-Time Performance Tests', () => {
    let eventEmitter;
    let statusManager;

    beforeAll(async () => {
        eventEmitter = new RealtimeEventEmitter({ 
            port: TEST_PORT,
            maxConnections: 100
        });
        statusManager = new StatusManager({ eventEmitter });

        await eventEmitter.initialize();
        await statusManager.initialize();
    });

    afterAll(async () => {
        if (statusManager) await statusManager.cleanup();
        if (eventEmitter) await eventEmitter.shutdown();
    });

    describe('Connection Performance', () => {
        test('should handle rapid connection establishment', async () => {
            const connectionCount = 20;
            const connections = [];
            
            const startTime = performance.now();
            
            const connectionPromises = Array.from({ length: connectionCount }, async () => {
                return new Promise((resolve, reject) => {
                    const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
                    const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
                    
                    client.on('open', () => {
                        clearTimeout(timeout);
                        connections.push(client);
                        resolve();
                    });
                    
                    client.on('error', reject);
                });
            });

            await Promise.all(connectionPromises);
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(connections).toHaveLength(connectionCount);
            expect(duration).toBeLessThan(3000); // Should connect within 3 seconds
            
            console.log(`Connected ${connectionCount} clients in ${duration.toFixed(2)}ms`);
            console.log(`Average connection time: ${(duration / connectionCount).toFixed(2)}ms per connection`);
            
            // Cleanup
            connections.forEach(conn => conn.close());
            
        }, PERFORMANCE_TIMEOUT);

        test('should maintain performance with many concurrent connections', async () => {
            const connectionCount = 50;
            const connections = [];

            // Establish connections
            for (let i = 0; i < connectionCount; i++) {
                const client = await createTestClient(TEST_PORT);
                connections.push(client);
            }

            expect(connections).toHaveLength(connectionCount);
            expect(eventEmitter.getClientCount()).toBe(connectionCount);

            // Test broadcast performance
            const messageCount = 10;
            const startTime = performance.now();

            for (let i = 0; i < messageCount; i++) {
                await statusManager.updateStatus({
                    phase: 'performance_test',
                    progress: i * 10,
                    score: 80 + i,
                    timestamp: Date.now()
                });
            }

            // Wait for all messages to propagate
            await new Promise(resolve => setTimeout(resolve, 1000));

            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`Broadcasted ${messageCount} messages to ${connectionCount} clients in ${duration.toFixed(2)}ms`);
            console.log(`Messages per second: ${((messageCount * connectionCount) / (duration / 1000)).toFixed(2)}`);

            // Should handle efficiently
            expect(duration).toBeLessThan(5000);

            // Cleanup
            connections.forEach(conn => conn.close());

        }, PERFORMANCE_TIMEOUT);
    });

    describe('Message Throughput', () => {
        test('should handle high-frequency status updates', async () => {
            const client = await createTestClient(TEST_PORT);
            const messagesReceived = [];

            client.on('message', (data) => {
                messagesReceived.push(JSON.parse(data.toString()));
            });

            const updateCount = 1000;
            const batchSize = 50;
            const startTime = performance.now();

            // Send updates in batches to simulate realistic usage
            for (let batch = 0; batch < updateCount / batchSize; batch++) {
                const batchPromises = [];
                
                for (let i = 0; i < batchSize; i++) {
                    const updateIndex = batch * batchSize + i;
                    batchPromises.push(statusManager.updateStatus({
                        phase: 'high_frequency_test',
                        progress: (updateIndex / updateCount) * 100,
                        score: 70 + (updateIndex / updateCount) * 30,
                        updateId: updateIndex
                    }));
                }

                await Promise.all(batchPromises);
                
                // Small delay between batches
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            const endTime = performance.now();
            const sendDuration = endTime - startTime;

            // Wait for all messages to be received
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log(`Sent ${updateCount} updates in ${sendDuration.toFixed(2)}ms`);
            console.log(`Received ${messagesReceived.length} messages`);
            console.log(`Updates per second: ${(updateCount / (sendDuration / 1000)).toFixed(2)}`);

            // Performance expectations
            expect(sendDuration).toBeLessThan(10000); // Should complete within 10 seconds
            expect(messagesReceived.length).toBeGreaterThan(0);

            client.close();

        }, PERFORMANCE_TIMEOUT);

        test('should batch similar messages efficiently', async () => {
            const client = await createTestClient(TEST_PORT);
            const messagesReceived = [];
            const timestamps = [];

            client.on('message', (data) => {
                messagesReceived.push(JSON.parse(data.toString()));
                timestamps.push(Date.now());
            });

            // Send many similar updates rapidly
            const rapidUpdateCount = 100;
            const startTime = Date.now();

            for (let i = 0; i < rapidUpdateCount; i++) {
                await statusManager.updateStatus({
                    phase: 'batching_test',
                    progress: i,
                    score: 85.5 // Same score repeatedly
                });
            }

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 1000));

            const endTime = Date.now();
            const totalDuration = endTime - startTime;

            console.log(`Sent ${rapidUpdateCount} rapid updates`);
            console.log(`Received ${messagesReceived.length} messages (batching should reduce this)`);
            console.log(`Processing took ${totalDuration}ms`);

            // Should batch effectively - fewer messages received than sent
            expect(messagesReceived.length).toBeLessThan(rapidUpdateCount);
            expect(messagesReceived.length).toBeGreaterThan(0);

            client.close();

        }, PERFORMANCE_TIMEOUT);
    });

    describe('Memory Performance', () => {
        test('should not leak memory with long-running connections', async () => {
            const client = await createTestClient(TEST_PORT);
            
            // Get baseline memory
            const initialMemory = process.memoryUsage();
            
            // Run continuous updates for extended period
            const duration = 5000; // 5 seconds
            const updateInterval = 50; // Every 50ms
            const expectedUpdates = duration / updateInterval;
            
            let updateCount = 0;
            const startTime = Date.now();
            
            const interval = setInterval(async () => {
                if (Date.now() - startTime >= duration) {
                    clearInterval(interval);
                    return;
                }
                
                await statusManager.updateStatus({
                    phase: 'memory_test',
                    progress: (updateCount / expectedUpdates) * 100,
                    score: 75 + Math.random() * 20,
                    timestamp: Date.now()
                });
                
                updateCount++;
            }, updateInterval);

            // Wait for test completion
            await new Promise(resolve => setTimeout(resolve, duration + 1000));

            // Check memory usage
            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

            console.log(`Sent ${updateCount} updates over ${duration}ms`);
            console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);
            console.log(`Memory per update: ${(memoryIncrease / updateCount).toFixed(2)} bytes`);

            // Memory should not increase excessively
            expect(memoryIncreaseMB).toBeLessThan(50); // Less than 50MB increase
            expect(updateCount).toBeGreaterThan(80); // Should have sent most updates

            client.close();

        }, PERFORMANCE_TIMEOUT);

        test('should handle connection cleanup efficiently', async () => {
            const connectionCount = 30;
            const connections = [];

            // Create many connections
            for (let i = 0; i < connectionCount; i++) {
                const client = await createTestClient(TEST_PORT);
                connections.push(client);
            }

            expect(eventEmitter.getClientCount()).toBe(connectionCount);

            const initialMemory = process.memoryUsage();

            // Close all connections rapidly
            const startTime = performance.now();
            
            connections.forEach(conn => conn.close());

            // Wait for cleanup
            await new Promise(resolve => setTimeout(resolve, 1000));

            const endTime = performance.now();
            const cleanupDuration = endTime - startTime;

            const finalMemory = process.memoryUsage();
            const memoryDifference = finalMemory.heapUsed - initialMemory.heapUsed;

            console.log(`Cleaned up ${connectionCount} connections in ${cleanupDuration.toFixed(2)}ms`);
            console.log(`Memory difference: ${(memoryDifference / (1024 * 1024)).toFixed(2)}MB`);

            // Should cleanup efficiently
            expect(cleanupDuration).toBeLessThan(2000);
            expect(eventEmitter.getClientCount()).toBe(0);

        }, PERFORMANCE_TIMEOUT);
    });

    describe('Stress Testing', () => {
        test('should remain stable under mixed load patterns', async () => {
            const shortLivedConnections = 20;
            const longLivedConnections = 5;
            const updateBursts = 10;
            
            // Create long-lived connections
            const stableConnections = [];
            for (let i = 0; i < longLivedConnections; i++) {
                const client = await createTestClient(TEST_PORT);
                stableConnections.push(client);
            }

            let totalMessagesReceived = 0;
            stableConnections.forEach(client => {
                client.on('message', () => totalMessagesReceived++);
            });

            const startTime = performance.now();

            // Run mixed load pattern
            for (let burst = 0; burst < updateBursts; burst++) {
                // Create burst of short-lived connections
                const burstConnections = [];
                for (let i = 0; i < shortLivedConnections; i++) {
                    const client = await createTestClient(TEST_PORT);
                    burstConnections.push(client);
                }

                // Send rapid updates
                for (let i = 0; i < 20; i++) {
                    await statusManager.updateStatus({
                        phase: 'stress_test',
                        progress: (burst * 20 + i) / (updateBursts * 20) * 100,
                        score: 60 + Math.random() * 40,
                        burstId: burst,
                        updateId: i
                    });
                }

                // Close burst connections
                burstConnections.forEach(conn => conn.close());
                
                // Brief pause between bursts
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const endTime = performance.now();
            const totalDuration = endTime - startTime;

            // Wait for final message processing
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log(`Stress test completed in ${totalDuration.toFixed(2)}ms`);
            console.log(`Total messages received by stable connections: ${totalMessagesReceived}`);
            console.log(`Stable connections remaining: ${eventEmitter.getClientCount()}`);

            // System should remain stable
            expect(eventEmitter.getClientCount()).toBe(longLivedConnections);
            expect(totalMessagesReceived).toBeGreaterThan(0);
            expect(eventEmitter.isRunning()).toBe(true);

            // Cleanup
            stableConnections.forEach(conn => conn.close());

        }, PERFORMANCE_TIMEOUT);
    });
});

// Helper function
async function createTestClient(port) {
    return new Promise((resolve, reject) => {
        const client = new WebSocket(`ws://localhost:${port}`);
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