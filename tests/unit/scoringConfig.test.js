/**
 * Tests for scoring configuration constants
 */

import { describe, it, expect } from 'vitest';
import {
  SCORING_WEIGHTS,
  GRADE_THRESHOLDS,
  MODULE_SIZE_THRESHOLDS,
  COMPLEXITY_THRESHOLDS
} from '../../src/config/scoringConfig.js';

describe('scoringConfig', () => {
  describe('SCORING_WEIGHTS', () => {
    it('should have all required weight categories', () => {
      expect(SCORING_WEIGHTS).toHaveProperty('structure');
      expect(SCORING_WEIGHTS).toHaveProperty('quality');
      expect(SCORING_WEIGHTS).toHaveProperty('performance');
      expect(SCORING_WEIGHTS).toHaveProperty('testing');
      expect(SCORING_WEIGHTS).toHaveProperty('security');
      expect(SCORING_WEIGHTS).toHaveProperty('developerExperience');
      expect(SCORING_WEIGHTS).toHaveProperty('completeness');
    });

    it('should have correct weight values', () => {
      expect(SCORING_WEIGHTS.structure).toBe(20);
      expect(SCORING_WEIGHTS.quality).toBe(20);
      expect(SCORING_WEIGHTS.performance).toBe(15);
      expect(SCORING_WEIGHTS.testing).toBe(15);
      expect(SCORING_WEIGHTS.security).toBe(15);
      expect(SCORING_WEIGHTS.developerExperience).toBe(10);
      expect(SCORING_WEIGHTS.completeness).toBe(5);
    });

    it('should total 100 points', () => {
      const total = Object.values(SCORING_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
      expect(total).toBe(100);
    });

    it('should have all positive weights', () => {
      Object.values(SCORING_WEIGHTS).forEach(weight => {
        expect(weight).toBeGreaterThan(0);
        expect(typeof weight).toBe('number');
      });
    });
  });

  describe('GRADE_THRESHOLDS', () => {
    it('should have all grade levels', () => {
      const expectedGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
      expectedGrades.forEach(grade => {
        expect(GRADE_THRESHOLDS).toHaveProperty(grade);
      });
    });

    it('should have correct threshold values', () => {
      expect(GRADE_THRESHOLDS['A+']).toBe(0.98);
      expect(GRADE_THRESHOLDS['A']).toBe(0.93);
      expect(GRADE_THRESHOLDS['A-']).toBe(0.90);
      expect(GRADE_THRESHOLDS['B+']).toBe(0.87);
      expect(GRADE_THRESHOLDS['B']).toBe(0.83);
      expect(GRADE_THRESHOLDS['B-']).toBe(0.80);
      expect(GRADE_THRESHOLDS['C+']).toBe(0.77);
      expect(GRADE_THRESHOLDS['C']).toBe(0.73);
      expect(GRADE_THRESHOLDS['C-']).toBe(0.70);
      expect(GRADE_THRESHOLDS['D+']).toBe(0.67);
      expect(GRADE_THRESHOLDS['D']).toBe(0.65);
      expect(GRADE_THRESHOLDS['D-']).toBe(0.60);
      expect(GRADE_THRESHOLDS['F']).toBe(0);
    });

    it('should have thresholds in descending order (except F)', () => {
      const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-'];
      for (let i = 1; i < grades.length; i++) {
        expect(GRADE_THRESHOLDS[grades[i-1]]).toBeGreaterThan(GRADE_THRESHOLDS[grades[i]]);
      }
    });

    it('should have all thresholds between 0 and 1', () => {
      Object.values(GRADE_THRESHOLDS).forEach(threshold => {
        expect(threshold).toBeGreaterThanOrEqual(0);
        expect(threshold).toBeLessThanOrEqual(1);
        expect(typeof threshold).toBe('number');
      });
    });
  });

  describe('MODULE_SIZE_THRESHOLDS', () => {
    it('should have all size categories', () => {
      expect(MODULE_SIZE_THRESHOLDS).toHaveProperty('small');
      expect(MODULE_SIZE_THRESHOLDS).toHaveProperty('medium');
      expect(MODULE_SIZE_THRESHOLDS).toHaveProperty('large');
      expect(MODULE_SIZE_THRESHOLDS).toHaveProperty('veryLarge');
    });

    it('should have correct threshold values', () => {
      expect(MODULE_SIZE_THRESHOLDS.small).toBe(200);
      expect(MODULE_SIZE_THRESHOLDS.medium).toBe(400);
      expect(MODULE_SIZE_THRESHOLDS.large).toBe(600);
      expect(MODULE_SIZE_THRESHOLDS.veryLarge).toBe(1000);
    });

    it('should have thresholds in ascending order', () => {
      expect(MODULE_SIZE_THRESHOLDS.small).toBeLessThan(MODULE_SIZE_THRESHOLDS.medium);
      expect(MODULE_SIZE_THRESHOLDS.medium).toBeLessThan(MODULE_SIZE_THRESHOLDS.large);
      expect(MODULE_SIZE_THRESHOLDS.large).toBeLessThan(MODULE_SIZE_THRESHOLDS.veryLarge);
    });

    it('should have all positive integer thresholds', () => {
      Object.values(MODULE_SIZE_THRESHOLDS).forEach(threshold => {
        expect(threshold).toBeGreaterThan(0);
        expect(Number.isInteger(threshold)).toBe(true);
      });
    });
  });

  describe('COMPLEXITY_THRESHOLDS', () => {
    it('should have all complexity levels', () => {
      expect(COMPLEXITY_THRESHOLDS).toHaveProperty('low');
      expect(COMPLEXITY_THRESHOLDS).toHaveProperty('medium');
      expect(COMPLEXITY_THRESHOLDS).toHaveProperty('high');
      expect(COMPLEXITY_THRESHOLDS).toHaveProperty('veryHigh');
    });

    it('should have correct threshold values', () => {
      expect(COMPLEXITY_THRESHOLDS.low).toBe(10);
      expect(COMPLEXITY_THRESHOLDS.medium).toBe(50);
      expect(COMPLEXITY_THRESHOLDS.high).toBe(100);
      expect(COMPLEXITY_THRESHOLDS.veryHigh).toBe(200);
    });

    it('should have thresholds in ascending order', () => {
      expect(COMPLEXITY_THRESHOLDS.low).toBeLessThan(COMPLEXITY_THRESHOLDS.medium);
      expect(COMPLEXITY_THRESHOLDS.medium).toBeLessThan(COMPLEXITY_THRESHOLDS.high);
      expect(COMPLEXITY_THRESHOLDS.high).toBeLessThan(COMPLEXITY_THRESHOLDS.veryHigh);
    });

    it('should have all positive integer thresholds', () => {
      Object.values(COMPLEXITY_THRESHOLDS).forEach(threshold => {
        expect(threshold).toBeGreaterThan(0);
        expect(Number.isInteger(threshold)).toBe(true);
      });
    });
  });

  describe('Configuration Integrity', () => {
    it('should export all configuration objects', () => {
      expect(SCORING_WEIGHTS).toBeDefined();
      expect(GRADE_THRESHOLDS).toBeDefined();
      expect(MODULE_SIZE_THRESHOLDS).toBeDefined();
      expect(COMPLEXITY_THRESHOLDS).toBeDefined();
    });

    it('should not have overlapping weight categories', () => {
      const categories = Object.keys(SCORING_WEIGHTS);
      const uniqueCategories = [...new Set(categories)];
      expect(categories.length).toBe(uniqueCategories.length);
    });

    it('should have reasonable scoring distribution', () => {
      // Structure and quality should be the highest weights
      expect(SCORING_WEIGHTS.structure).toBeGreaterThanOrEqual(20);
      expect(SCORING_WEIGHTS.quality).toBeGreaterThanOrEqual(20);

      // Completeness should be the smallest weight
      expect(SCORING_WEIGHTS.completeness).toBeLessThanOrEqual(10);
    });
  });
});