import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandCoordinator } from '../../../src/cli/CommandCoordinator.js';
import { ProjectTypeDetector } from '../../../src/scoring/core/ProjectTypeDetector.js';

// Mock all command dependencies
vi.mock('../../../src/cli/commands/InitCommand.js', () => ({
  InitCommand: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({ success: true, message: 'Init completed' })
  }))
}));

vi.mock('../../../src/cli/commands/ScoreCommand.js', () => ({
  ScoreCommand: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({ score: 85, grade: 'B' })
  }))
}));

vi.mock('../../../src/cli/commands/EnhanceCommand.js', () => ({
  EnhanceCommand: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({ enhanced: true, improvements: 5 })
  }))
}));

vi.mock('../../../src/cli/commands/TemplateCommand.js', () => ({
  TemplateCommand: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({ success: true, templates: [] })
  }))
}));

vi.mock('../../../src/cli/commands/PromptCommand.js', () => ({
  PromptCommand: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({ success: true, prompt: 'Generated prompt' })
  }))
}));

vi.mock('../../../src/cli/commands/AgentInitCommand.js', () => ({
  AgentInitCommand: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({ success: true, agents: ['QualityAgent'] })
  }))
}));

vi.mock('../../../src/scoring/core/ProjectTypeDetector.js', () => ({
  ProjectTypeDetector: vi.fn().mockImplementation(() => ({
    detectProjectType: vi.fn().mockResolvedValue('javascript')
  }))
}));

describe('CommandCoordinator', () => {
  let coordinator;
  let mockGlobalConfig;
  let mockPackageRoot;

  beforeEach(() => {
    mockGlobalConfig = {
      projectRoot: '/test/project',
      verbose: false,
      format: 'json'
    };
    mockPackageRoot = '/test/package';
    coordinator = new CommandCoordinator(mockGlobalConfig, mockPackageRoot);

    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with config and package root', () => {
      expect(coordinator.globalConfig).toBe(mockGlobalConfig);
      expect(coordinator.packageRoot).toBe(mockPackageRoot);
    });

    it('should initialize command instances', () => {
      expect(coordinator.initCommand).toBeDefined();
      expect(coordinator.scoreCommand).toBeDefined();
      expect(coordinator.enhanceCommand).toBeDefined();
      expect(coordinator.templateCommand).toBeDefined();
      expect(coordinator.promptCommand).toBeDefined();
      expect(coordinator.agentInitCommand).toBeDefined();
    });

    it('should initialize project type detector', () => {
      expect(coordinator.projectTypeDetector).toBeDefined();
    });
  });

  describe('executeInit', () => {
    it('should execute init command with options', async () => {
      const options = { projectType: 'react-webapp' };

      const result = await coordinator.executeInit(options);

      expect(coordinator.initCommand.execute).toHaveBeenCalledWith(options);
      expect(result).toEqual({ success: true, message: 'Init completed' });
    });

    it('should handle init command errors', async () => {
      coordinator.initCommand.execute.mockRejectedValue(new Error('Init failed'));

      await expect(coordinator.executeInit({})).rejects.toThrow('Init failed');
    });
  });

  describe('executeScore', () => {
    it('should execute score command with options', async () => {
      const options = { detailed: true, format: 'html' };

      const result = await coordinator.executeScore(options);

      expect(coordinator.scoreCommand.execute).toHaveBeenCalledWith(options);
      expect(result).toEqual({ score: 85, grade: 'B' });
    });

    it('should handle score command errors', async () => {
      coordinator.scoreCommand.execute.mockRejectedValue(new Error('Score failed'));

      await expect(coordinator.executeScore({})).rejects.toThrow('Score failed');
    });
  });

  describe('executeEnhance', () => {
    it('should execute enhance command with input and options', async () => {
      const input = 'src/test.js';
      const options = { target: 95, iterations: 3 };

      const result = await coordinator.executeEnhance(input, options);

      expect(coordinator.enhanceCommand.execute).toHaveBeenCalledWith(input, options);
      expect(result).toEqual({ enhanced: true, improvements: 5 });
    });

    it('should handle enhance command errors', async () => {
      coordinator.enhanceCommand.execute.mockRejectedValue(new Error('Enhance failed'));

      await expect(coordinator.executeEnhance('test.js', {})).rejects.toThrow('Enhance failed');
    });
  });

  describe('executeTemplate', () => {
    it('should execute template command with action and options', async () => {
      const action = 'list';
      const options = { category: 'components' };

      const result = await coordinator.executeTemplate(action, options);

      expect(coordinator.templateCommand.execute).toHaveBeenCalledWith(action, options);
      expect(result).toEqual({ success: true, templates: [] });
    });

    it('should handle template command errors', async () => {
      coordinator.templateCommand.execute.mockRejectedValue(new Error('Template failed'));

      await expect(coordinator.executeTemplate('list', {})).rejects.toThrow('Template failed');
    });
  });

  describe('executePrompt', () => {
    it('should execute prompt command with options', async () => {
      const options = { type: 'enhancement', context: 'quality' };

      const result = await coordinator.executePrompt(options);

      expect(coordinator.promptCommand.execute).toHaveBeenCalledWith(options);
      expect(result).toEqual({ success: true, prompt: 'Generated prompt' });
    });

    it('should handle prompt command errors', async () => {
      coordinator.promptCommand.execute.mockRejectedValue(new Error('Prompt failed'));

      await expect(coordinator.executePrompt({})).rejects.toThrow('Prompt failed');
    });
  });

  describe('executeAgentInit', () => {
    it('should execute agent init command with options', async () => {
      const options = { agents: ['QualityAgent', 'SecurityAgent'] };

      const result = await coordinator.executeAgentInit(options);

      expect(coordinator.agentInitCommand.execute).toHaveBeenCalledWith(options);
      expect(result).toEqual({ success: true, agents: ['QualityAgent'] });
    });

    it('should handle agent init command errors', async () => {
      coordinator.agentInitCommand.execute.mockRejectedValue(new Error('Agent init failed'));

      await expect(coordinator.executeAgentInit({})).rejects.toThrow('Agent init failed');
    });
  });

  describe('detectProjectType', () => {
    it('should detect project type using detector', async () => {
      const result = await coordinator.detectProjectType();

      expect(coordinator.projectTypeDetector.detectProjectType).toHaveBeenCalled();
      expect(result).toBe('javascript');
    });

    it('should handle project type detection errors', async () => {
      coordinator.projectTypeDetector.detectProjectType.mockRejectedValue(new Error('Detection failed'));

      await expect(coordinator.detectProjectType()).rejects.toThrow('Detection failed');
    });
  });

  describe('executeAdd', () => {
    it('should execute add command with options', async () => {
      const options = { component: 'Button', type: 'react' };

      const result = await coordinator.executeAdd(options);

      // Should delegate to template command with 'add' action
      expect(coordinator.templateCommand.execute).toHaveBeenCalledWith('add', options);
      expect(result).toEqual({ success: true, templates: [] });
    });

    it('should handle add command errors', async () => {
      coordinator.templateCommand.execute.mockRejectedValue(new Error('Add failed'));

      await expect(coordinator.executeAdd({})).rejects.toThrow('Add failed');
    });
  });

  describe('executeValidate', () => {
    it('should execute validate command with options', async () => {
      const options = { strict: true };

      const result = await coordinator.executeValidate(options);

      // Should delegate to score command with validation options
      expect(coordinator.scoreCommand.execute).toHaveBeenCalledWith({
        ...options,
        validate: true
      });
      expect(result).toEqual({ score: 85, grade: 'B' });
    });

    it('should handle validate command errors', async () => {
      coordinator.scoreCommand.execute.mockRejectedValue(new Error('Validate failed'));

      await expect(coordinator.executeValidate({})).rejects.toThrow('Validate failed');
    });
  });

  describe('error handling', () => {
    it('should propagate command execution errors', async () => {
      const error = new Error('Command execution failed');
      coordinator.initCommand.execute.mockRejectedValue(error);

      await expect(coordinator.executeInit({})).rejects.toThrow('Command execution failed');
    });

    it('should handle undefined commands gracefully', () => {
      // Test that commands are properly initialized
      expect(coordinator.initCommand).toBeDefined();
      expect(coordinator.scoreCommand).toBeDefined();
      expect(coordinator.enhanceCommand).toBeDefined();
      expect(coordinator.templateCommand).toBeDefined();
      expect(coordinator.promptCommand).toBeDefined();
      expect(coordinator.agentInitCommand).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should coordinate multiple commands in sequence', async () => {
      // Execute init then score
      await coordinator.executeInit({ projectType: 'react-webapp' });
      await coordinator.executeScore({ detailed: true });

      expect(coordinator.initCommand.execute).toHaveBeenCalled();
      expect(coordinator.scoreCommand.execute).toHaveBeenCalled();
    });

    it('should handle mixed command success/failure scenarios', async () => {
      // First command succeeds
      const initResult = await coordinator.executeInit({});
      expect(initResult.success).toBe(true);

      // Second command fails
      coordinator.scoreCommand.execute.mockRejectedValue(new Error('Score failed'));
      await expect(coordinator.executeScore({})).rejects.toThrow('Score failed');
    });
  });
});