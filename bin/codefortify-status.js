#!/usr/bin/env node
/**
 * CodeFortify Status Monitor CLI
 *
 * Standalone command for monitoring CodeFortify real-time status
 * Usage: codefortify-status [options]
 */

import { Command } from 'commander';
import { createStatusMonitor } from '../src/cli/RealtimeStatus.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('codefortify-status')
  .description('Real-time CodeFortify status monitor')
  .version('1.0.0')
  .option('-p, --port <number>', 'WebSocket server port', 8765)
  .option('-h, --host <host>', 'WebSocket server host', 'localhost')
  .option('-i, --interval <ms>', 'Update interval in milliseconds', 1000)
  .option('-c, --compact', 'Use compact display mode')
  .option('--no-color', 'Disable color output')
  .option('--no-details', 'Hide detailed information')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Starting CodeFortify Status Monitor...\n'));

      const monitorOptions = {
        port: parseInt(options.port),
        host: options.host,
        updateInterval: parseInt(options.interval),
        compactMode: options.compact,
        colorMode: options.color,
        showDetails: options.details
      };

      await createStatusMonitor(monitorOptions);
    } catch (error) {
      console.error(chalk.red('❌ Failed to start status monitor:'), error.message);

      if (error.code === 'ECONNREFUSED') {
        console.log(chalk.yellow('\n💡 Make sure CodeFortify real-time server is running:'));
        console.log(chalk.cyan('   codefortify start-realtime'));
      }

      process.exit(1);
    }
  });

// Add subcommands
program
  .command('test-connection')
  .description('Test WebSocket connection to CodeFortify server')
  .option('-p, --port <number>', 'WebSocket server port', 8765)
  .option('-h, --host <host>', 'WebSocket server host', 'localhost')
  .action(async (options) => {
    const WebSocket = (await import('ws')).default;

    console.log(chalk.blue(`🔍 Testing connection to ws://${options.host}:${options.port}...`));

    const ws = new WebSocket(`ws://${options.host}:${options.port}`);

    const timeout = setTimeout(() => {
      console.log(chalk.red('❌ Connection timeout'));
      ws.terminate();
      process.exit(1);
    }, 5000);

    ws.on('open', () => {
      clearTimeout(timeout);
      console.log(chalk.green('✅ Connection successful'));
      ws.close();
      process.exit(0);
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      console.log(chalk.red('❌ Connection failed:'), error.message);
      process.exit(1);
    });
  });

program
  .command('watch')
  .description('Watch mode with automatic refresh (similar to Unix watch)')
  .option('-n, --interval <seconds>', 'Update interval in seconds', 2)
  .option('-p, --port <number>', 'WebSocket server port', 8765)
  .action(async (options) => {
    const monitorOptions = {
      port: parseInt(options.port),
      updateInterval: parseInt(options.interval) * 1000,
      compactMode: true
    };

    console.log(chalk.blue(`🔄 Starting watch mode (${options.interval}s intervals)...\n`));
    await createStatusMonitor(monitorOptions);
  });

program
  .command('json')
  .description('Output current status as JSON')
  .option('-p, --port <number>', 'WebSocket server port', 8765)
  .option('--pretty', 'Pretty print JSON output')
  .action(async (options) => {
    const WebSocket = (await import('ws')).default;

    try {
      const ws = new WebSocket(`ws://localhost:${options.port}`);
      let statusReceived = false;

      const timeout = setTimeout(() => {
        if (!statusReceived) {
          console.error('{"error": "Connection timeout"}');
          ws.terminate();
          process.exit(1);
        }
      }, 3000);

      ws.on('open', () => {
        // Request current status
        ws.send(JSON.stringify({ type: 'get_status' }));
      });

      ws.on('message', (data) => {
        clearTimeout(timeout);
        statusReceived = true;

        try {
          const message = JSON.parse(data.toString());
          const output = options.pretty ?
            JSON.stringify(message, null, 2) :
            JSON.stringify(message);

          console.log(output);
          ws.close();
          process.exit(0);
        } catch (error) {
          console.error('{"error": "Invalid JSON response"}');
          process.exit(1);
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        console.error(`{"error": "${error.message}"}`);
        process.exit(1);
      });

    } catch (error) {
      console.error(`{"error": "${error.message}"}`);
      process.exit(1);
    }
  });

// Handle help
program.on('--help', () => {
  console.log('');
  console.log('Examples:');
  console.log('  $ codefortify-status                    # Start status monitor');
  console.log('  $ codefortify-status --compact          # Compact display mode');
  console.log('  $ codefortify-status --port 8766        # Custom port');
  console.log('  $ codefortify-status test-connection    # Test WebSocket connection');
  console.log('  $ codefortify-status watch --interval 5 # Watch mode with 5s updates');
  console.log('  $ codefortify-status json --pretty      # Get status as JSON');
  console.log('');
  console.log('Interactive Controls (in monitor mode):');
  console.log('  r  - Force refresh display');
  console.log('  c  - Toggle compact/detailed mode');
  console.log('  q  - Quit monitor');
  console.log('  Ctrl+C - Exit');
});

program.parse();