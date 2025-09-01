/**
 * File utility functions for the scoring system
 */

import { existsSync, lstatSync, readdirSync, statSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';

/**
 * Check if a path exists and is a directory
 * @param {string} dirPath - Directory path to check
 * @returns {boolean} True if directory exists
 */
export function isDirectory(dirPath) {
  try {
    return existsSync(dirPath) && lstatSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Safe file read with error handling
 * @param {string} filePath - File path to read
 * @returns {Promise<string|null>} File contents or null if error
 */
export async function safeReadFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Get file extension without the dot
 * @param {string} filePath - File path
 * @returns {string} Extension without dot
 */
export function getExtension(filePath) {
  return path.extname(filePath).slice(1);
}

/**
 * Count lines in a file
 * @param {string} filePath - File path
 * @returns {Promise<number>} Line count
 */
export async function countLines(filePath) {
  const content = await safeReadFile(filePath);
  if (!content) {return 0;}
  return content.split('\n').length;
}

/**
 * Check if a file exists
 * @param {string} filePath - File path to check
 * @returns {boolean} True if file exists
 */
export function fileExists(filePath) {
  try {
    return existsSync(filePath) && lstatSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Check if a directory exists
 * @param {string} dirPath - Directory path to check
 * @returns {boolean} True if directory exists
 */
export function directoryExists(dirPath) {
  try {
    return existsSync(dirPath) && lstatSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Read file content
 * @param {string} filePath - File path to read
 * @returns {Promise<string>} File contents
 */
export async function readFile(filePath) {
  return await fs.readFile(filePath, 'utf8');
}

/**
 * Get file extension
 * @param {string} filePath - File path
 * @returns {string} File extension with dot
 */
export function getFileExtension(filePath) {
  return path.extname(filePath);
}

/**
 * Get all files in directory recursively
 * @param {string} dirPath - Directory path
 * @returns {Promise<Array>} Array of file paths
 */
export async function getAllFiles(dirPath) {
  const files = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}: ${error.message}`);
  }

  return files;
}

/**
 * Get files by extension
 * @param {string} dirPath - Directory path
 * @param {Array} extensions - Array of extensions to filter by
 * @returns {Promise<Array>} Array of matching file paths
 */
export async function getFilesByExtension(dirPath, extensions) {
  const allFiles = await getAllFiles(dirPath);
  return allFiles.filter(file =>
    extensions.some(ext => file.endsWith(ext))
  );
}

/**
 * Get directory tree structure
 * @param {string} dirPath - Directory path
 * @returns {Promise<Object>} Directory tree structure
 */
export async function getDirectoryTree(dirPath) {
  try {
    const stats = await fs.stat(dirPath);

    if (!stats.isDirectory()) {
      return {
        name: path.basename(dirPath),
        type: 'file',
        path: dirPath
      };
    }

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const children = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const child = await getDirectoryTree(fullPath);
      children.push(child);
    }

    return {
      name: path.basename(dirPath),
      type: 'directory',
      path: dirPath,
      children
    };
  } catch (error) {
    console.error(`Error reading directory tree ${dirPath}: ${error.message}`);
    return {
      name: path.basename(dirPath),
      type: 'error',
      path: dirPath,
      error: error.message
    };
  }
}

/**
 * Get file statistics
 * @param {string} filePath - File path
 * @returns {Promise<Object>} File statistics
 */
export async function getFileStats(filePath) {
  return await fs.stat(filePath);
}

/**
 * Create directory recursively
 * @param {string} dirPath - Directory path to create
 * @returns {Promise<void>}
 */
export async function createDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Write file content
 * @param {string} filePath - File path to write
 * @param {string} content - Content to write
 * @returns {Promise<void>}
 */
export async function writeFile(filePath, content) {
  await fs.writeFile(filePath, content, 'utf8');
}

// Export all functions as a single object for easier importing
export const fileUtils = {
  isDirectory,
  safeReadFile,
  getExtension,
  countLines,
  fileExists,
  directoryExists,
  readFile,
  getFileExtension,
  getAllFiles,
  getFilesByExtension,
  getDirectoryTree,
  getFileStats,
  createDirectory,
  writeFile
};