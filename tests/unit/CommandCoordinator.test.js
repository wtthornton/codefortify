/**
 * Unit tests for CommandCoordinator class
 * Tests all CLI command functionality with mocked dependencies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CommandCoordinator } from '../../src/cli/CommandCoordinator.js';
import fs from 'fs-extra';
// import path from 'path'; // Unused import

// Mock external dependencies
vi.mock('fs-extra');
vi.mock('chalk', () => ({
  default: {
    cyan: vi.fn(text => text),
    green: vi.fn(text => text),
    red: vi.fn(text => text),
    yellow: vi.fn(text => text),
    gray: vi.fn(text => text),
    bold: vi.fn(text => text)
  }
}));

describe('CommandCoordinator', () => {
  let coordinator;
  let globalConfig;
  let packageRoot;
  let mockConsole;

  beforeEach(() => {
    globalConfig = {
      verbose: false,
      projectRoot: '/test/project'
    };
    packageRoot = '/test/package';

    coordinator = new CommandCoordinator(globalConfig, packageRoot);

    // Mock console methods
    mockConsole = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {})
    };

    // Setup fs-extra mocks
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue('{"sessionId": "test"}');
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('executeStatus', () => {
    it('should display basic status when status file exists', async () => {
      const mockStatusData = {
        globalStatus: {
          phase: 'analyzing',
          progress: 60,
          message: 'Test message',
          operation: 'enhancement'
        },
        sessionId: 'test-session'
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStatusData));

      await coordinator.executeStatus({});

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('CodeFortify Background Activity Status')
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Phase: analyzing (60%)')
      );
    });

    it('should show no session message when status file does not exist', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);

      await coordinator.executeStatus({});

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('No active CodeFortify session found')
      );
    });

    it('should output JSON format when requested', async () => {
      const mockStatusData = { sessionId: 'test', globalStatus: {} };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStatusData));

      await coordinator.executeStatus({ format: 'json' });

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('"sessionId"')
      );
    });
  });

  describe('executeStop', () => {
    it('should stop agents and update status file', async () => {
      const mockStatusData = {
        globalStatus: {
          phase: 'analyzing',
          message: 'Running'
        }
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStatusData));

      await coordinator.executeStop({ force: true });

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Stopping CodeFortify background agents')
      );
      expect(vi.mocked(fs.writeFile)).toHaveBeenCalled();
    });

    it('should handle missing status file gracefully', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);

      await coordinator.executeStop({});

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('stopped successfully')
      );
    });
  });

  describe('executePause', () => {
    it('should pause agents and update status', async () => {
      const mockStatusData = {
        globalStatus: {
          phase: 'analyzing',
          message: 'Running'
        }
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStatusData));

      await coordinator.executePause({});

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Pausing CodeFortify background agents')
      );
      expect(vi.mocked(fs.writeFile)).toHaveBeenCalled();
    });
  });

  describe('executeResume', () => {
    it('should resume paused agents', async () => {
      const mockStatusData = {
        globalStatus: {
          phase: 'paused',
          message: 'Paused'
        }
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStatusData));

      await coordinator.executeResume({});

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Resuming CodeFortify background agents')
      );
      expect(vi.mocked(fs.writeFile)).toHaveBeenCalled();
    });

    it('should handle non-paused agents gracefully', async () => {
      const mockStatusData = {
        globalStatus: {
          phase: 'analyzing',
          message: 'Running'
        }
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStatusData));

      await coordinator.executeResume({});

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('No paused agents found')
      );
    });
  });

  describe('executeDashboard', () => {
    it('should start dashboard when status file exists', async () => {
      const mockStatusData = {
        globalStatus: {
          phase: 'analyzing',
          progress: 60,
          message: 'Test message'
        },
        score: {
          currentScore: 85
        }
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStatusData));

      // Mock setInterval to avoid infinite loop in tests
      const mockInterval = vi.spyOn(global, 'setInterval').mockImplementation(() => 123);

      // Start dashboard and immediately clear interval
      coordinator.executeDashboard({ compact: true });
      setTimeout(() => {
        clearInterval(123);
      }, 100);

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('CodeFortify Real-Time Dashboard')
      );

      mockInterval.mockRestore();
    });

    it('should show no session message when status file does not exist', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);

      await coordinator.executeDashboard({});

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('No active CodeFortify session found')
      );
    });
  });

  describe('executeTestMcp', () => {
    it('should test MCP server functionality', async () => {
      await coordinator.executeTestMcp({});

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Testing MCP server functionality')
      );
    });
  });

  describe('executeServe', () => {
    it('should attempt to start MCP server', async () => {
      await coordinator.executeServe({});

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('not implemented')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      await coordinator.executeStatus({});

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get status')
      );
    });

    it('should handle JSON parsing errors', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json');

      await coordinator.executeStatus({});

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get status')
      );
    });
  });

  describe('Configuration', () => {
    it('should use correct project root path', () => {
      expect(coordinator.globalConfig.projectRoot).toBe('/test/project');
    });

    it('should initialize with provided package root', () => {
      expect(coordinator.packageRoot).toBe('/test/package');
    });
  });
});