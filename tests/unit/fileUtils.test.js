/**
 * Tests for file utility functions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  isDirectory,
  safeReadFile,
  getExtension,
  countLines
} from '../../src/utils/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('fileUtils', () => {
  const testDir = path.join(__dirname, 'fixtures', 'fileUtils-test');
  const testFile = path.join(testDir, 'test.txt');
  const multilineFile = path.join(testDir, 'multiline.txt');
  const nonExistentFile = path.join(testDir, 'does-not-exist.txt');

  beforeEach(async () => {
    // Create test directory and files
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testFile, 'Hello, World!');
    await fs.writeFile(multilineFile, 'Line 1\nLine 2\nLine 3\n');
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('isDirectory', () => {
    it('should return true for existing directories', () => {
      expect(isDirectory(__dirname)).toBe(true);
      expect(isDirectory(testDir)).toBe(true);
    });

    it('should return false for files', () => {
      expect(isDirectory(testFile)).toBe(false);
    });

    it('should return false for non-existent paths', () => {
      expect(isDirectory('/non/existent/path')).toBe(false);
    });

    it('should handle invalid paths gracefully', () => {
      expect(isDirectory('')).toBe(false);
      expect(isDirectory(null)).toBe(false);
      expect(isDirectory(undefined)).toBe(false);
    });
  });

  describe('safeReadFile', () => {
    it('should read file contents successfully', async () => {
      const content = await safeReadFile(testFile);
      expect(content).toBe('Hello, World!');
    });

    it('should return null for non-existent files', async () => {
      const content = await safeReadFile(nonExistentFile);
      expect(content).toBe(null);
    });

    it('should return null for directories', async () => {
      const content = await safeReadFile(testDir);
      expect(content).toBe(null);
    });

    it('should handle invalid paths gracefully', async () => {
      expect(await safeReadFile('')).toBe(null);
      expect(await safeReadFile(null)).toBe(null);
      expect(await safeReadFile(undefined)).toBe(null);
    });
  });

  describe('getExtension', () => {
    it('should return file extension without dot', () => {
      expect(getExtension('file.txt')).toBe('txt');
      expect(getExtension('script.js')).toBe('js');
      expect(getExtension('data.json')).toBe('json');
      expect(getExtension('style.css')).toBe('css');
    });

    it('should handle files with multiple dots', () => {
      expect(getExtension('file.test.js')).toBe('js');
      expect(getExtension('archive.tar.gz')).toBe('gz');
    });

    it('should return empty string for files without extension', () => {
      expect(getExtension('README')).toBe('');
      expect(getExtension('Makefile')).toBe('');
    });

    it('should handle edge cases', () => {
      expect(getExtension('')).toBe('');
      expect(getExtension('.')).toBe('');
      expect(getExtension('..')).toBe('');
      expect(getExtension('.hidden')).toBe(''); // .hidden has no extension, it's a hidden file
    });

    it('should handle paths with directories', () => {
      expect(getExtension('/path/to/file.txt')).toBe('txt');
      expect(getExtension('./relative/file.js')).toBe('js');
    });
  });

  describe('countLines', () => {
    it('should count lines in a file', async () => {
      const count = await countLines(multilineFile);
      expect(count).toBe(4); // 3 lines + 1 for final newline
    });

    it('should handle single line files', async () => {
      const count = await countLines(testFile);
      expect(count).toBe(1);
    });

    it('should return 0 for non-existent files', async () => {
      const count = await countLines(nonExistentFile);
      expect(count).toBe(0);
    });

    it('should handle empty files', async () => {
      const emptyFile = path.join(testDir, 'empty.txt');
      await fs.writeFile(emptyFile, '');

      const count = await countLines(emptyFile);
      expect(count).toBe(0); // Empty file has 0 lines when split by newline
    });

    it('should handle files with only newlines', async () => {
      const newlineFile = path.join(testDir, 'newlines.txt');
      await fs.writeFile(newlineFile, '\n\n\n');

      const count = await countLines(newlineFile);
      expect(count).toBe(4); // 3 newlines = 4 lines
    });
  });
});