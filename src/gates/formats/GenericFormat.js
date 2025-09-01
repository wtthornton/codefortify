/**
 * GenericFormat - Generic CI/CD output formatter
 *
 * Generates JSON output suitable for any CI/CD system:
 * - Machine-readable JSON format
 * - Comprehensive evaluation data
 * - Easy integration with custom scripts
 */

export class GenericFormat {
  constructor() {
    this.formatName = 'generic';
  }

  /**
   * Format evaluation results as JSON
   *
   * @param {Object} results - Evaluation results
   * @param {Object} config - Quality gates configuration
   * @returns {Promise<string>} JSON formatted output
   */
  async format(results, config) {
    const output = {
      timestamp: results.timestamp,
      passed: results.passed,
      message: results.message,
      summary: results.summary,
      gates: results.gates.map(gate => ({
        name: gate.name,
        type: gate.type,
        passed: gate.passed,
        warning: gate.warning,
        score: gate.score,
        threshold: gate.threshold,
        message: gate.message,
        details: gate.details
      })),
      results: results.results,
      config: {
        thresholds: config.thresholds,
        ci: config.ci
      },
      recommendations: this.extractRecommendations(results)
    };

    return JSON.stringify(output, null, 2);
  }

  /**
   * Extract actionable recommendations from results
   *
   * @param {Object} results - Evaluation results
   * @returns {Array<Object>} Array of recommendation objects
   */
  extractRecommendations(results) {
    const recommendations = [];
    
    // Extract from failed gates
    results.gates
      .filter(gate => !gate.passed)
      .forEach(gate => {
        if (gate.details.suggestions && gate.details.suggestions.length > 0) {
          gate.details.suggestions.forEach(suggestion => {
            recommendations.push({
              type: 'fix',
              priority: 'high',
              gate: gate.name,
              suggestion: suggestion,
              category: gate.type
            });
          });
        }
      });
    
    // Extract from warning gates
    results.gates
      .filter(gate => gate.warning)
      .forEach(gate => {
        if (gate.details.suggestions && gate.details.suggestions.length > 0) {
          gate.details.suggestions.forEach(suggestion => {
            recommendations.push({
              type: 'improvement',
              priority: 'medium',
              gate: gate.name,
              suggestion: suggestion,
              category: gate.type
            });
          });
        }
      });
    
    return recommendations;
  }

  /**
   * Get example integration script
   *
   * @returns {string} Example shell script
   */
  getIntegrationExample() {
    return `#!/bin/bash

# Example integration script for generic CI/CD systems

echo "Running quality gates..."

# Run quality gates and capture output
QUALITY_OUTPUT=$(npx codefortify score --gates --format=generic --output=quality-gates.json)

# Check if command succeeded
if [ $? -ne 0 ]; then
    echo "❌ Quality gates command failed"
    exit 1
fi

# Parse JSON output (requires jq)
PASSED=$(jq -r '.passed' quality-gates.json)
SCORE=$(jq -r '.results.overall' quality-gates.json)
FAILED_COUNT=$(jq -r '.summary.failed' quality-gates.json)

echo "Quality Gates Results:"
echo "  Status: $([ "$PASSED" = "true" ] && echo "✅ PASSED" || echo "❌ FAILED")"
echo "  Score: $SCORE"
echo "  Failed Gates: $FAILED_COUNT"

# Print failed gates
if [ "$FAILED_COUNT" -gt 0 ]; then
    echo ""
    echo "Failed Gates:"
    jq -r '.gates[] | select(.passed == false) | "- " + .name + ": " + .message' quality-gates.json
fi

# Print recommendations
echo ""
echo "Recommendations:"
jq -r '.recommendations[] | "- " + .suggestion' quality-gates.json

# Exit with appropriate code
if [ "$PASSED" = "true" ]; then
    echo "✅ Quality gates passed"
    exit 0
else
    echo "❌ Quality gates failed"
    exit 1
fi`;
  }

  /**
   * Get example Python integration
   *
   * @returns {string} Example Python script
   */
  getPythonIntegrationExample() {
    return `#!/usr/bin/env python3
"""
Example Python integration for generic CI/CD systems
"""

import json
import subprocess
import sys
from pathlib import Path

def run_quality_gates():
    """Run quality gates and return results"""
    try:
        # Run quality gates command
        result = subprocess.run([
            'npx', 'codefortify', 'score', 
            '--gates', 
            '--format=generic', 
            '--output=quality-gates.json'
        ], capture_output=True, text=True, check=True)
        
        # Load results
        with open('quality-gates.json', 'r') as f:
            data = json.load(f)
        
        return data
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Quality gates command failed: {e}")
        print(f"Error output: {e.stderr}")
        sys.exit(1)
    except FileNotFoundError:
        print("❌ quality-gates.json not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse quality gates output: {e}")
        sys.exit(1)

def main():
    """Main integration logic"""
    print("Running quality gates...")
    
    # Run quality gates
    results = run_quality_gates()
    
    # Display results
    status = "✅ PASSED" if results['passed'] else "❌ FAILED"
    print(f"Quality Gates Results:")
    print(f"  Status: {status}")
    print(f"  Score: {results['results']['overall']}")
    print(f"  Failed Gates: {results['summary']['failed']}")
    
    # Display failed gates
    failed_gates = [gate for gate in results['gates'] if not gate['passed']]
    if failed_gates:
        print("\\nFailed Gates:")
        for gate in failed_gates:
            print(f"  - {gate['name']}: {gate['message']}")
    
    # Display recommendations
    if results['recommendations']:
        print("\\nRecommendations:")
        for rec in results['recommendations'][:5]:  # Show top 5
            print(f"  - {rec['suggestion']}")
    
    # Exit with appropriate code
    if results['passed']:
        print("\\n✅ Quality gates passed")
        sys.exit(0)
    else:
        print("\\n❌ Quality gates failed")
        sys.exit(1)

if __name__ == "__main__":
    main()`;
  }
}
