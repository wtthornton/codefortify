/**
 * Configuration constants for the scoring system
 */

export const SCORING_WEIGHTS = {
  structure: 20,
  quality: 20,
  performance: 15,
  testing: 15,
  security: 15,
  developerExperience: 10,
  completeness: 5
};

export const GRADE_THRESHOLDS = {
  'A+': 0.98,
  'A': 0.93,
  'A-': 0.90,
  'B+': 0.87,
  'B': 0.83,
  'B-': 0.80,
  'C+': 0.77,
  'C': 0.73,
  'C-': 0.70,
  'D+': 0.67,
  'D': 0.65,
  'D-': 0.60,
  'F': 0
};

export const MODULE_SIZE_THRESHOLDS = {
  small: 200,
  medium: 400,
  large: 600,
  veryLarge: 1000
};

export const COMPLEXITY_THRESHOLDS = {
  low: 10,
  medium: 50,
  high: 100,
  veryHigh: 200
};