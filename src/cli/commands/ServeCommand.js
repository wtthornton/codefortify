/**
 * Serve Command
 * Starts the MCP server
 */

import { BaseCommand } from './BaseCommand.js';
import { SystemUtils } from '../utils/SystemUtils.js';

export class ServeCommand extends BaseCommand {
  constructor(config, packageRoot) {
    super(config);
    this.packageRoot = packageRoot;
  }

  async execute(options = {}) {
    try {
      const port = options.port || await SystemUtils.findAvailablePort(3000);
      if (!port) {
        throw new Error('No available ports found');
      }

      // Import and start MCP server
      const { CodeFortifyMCPServer } = await import('../../server/CodeFortifyMCPServer.js');
      const server = new CodeFortifyMCPServer(this.config);

      await server.start({
        port,
        host: options.host || 'localhost',
        ...options
      });

      return {
        success: true,
        message: `MCP server started on port ${port}`,
        data: {
          port,
          host: options.host || 'localhost',
          url: `http://${options.host || 'localhost'}:${port}`
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to start MCP server'
      };
    }
  }

  getHelp() {
    return {
      description: 'Start the Model Context Protocol server',
      usage: 'codefortify serve [options]',
      options: [
        '--port: Port to listen on (default: auto-detect)',
        '--host: Host to bind to (default: localhost)',
        '--watch: Enable file watching for auto-restart'
      ]
    };
  }
}