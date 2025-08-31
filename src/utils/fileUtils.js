/**
 * File utility functions for the scoring system
 */

import { existsSync, lstatSync } from 'fs';
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