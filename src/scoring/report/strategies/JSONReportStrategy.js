/**
 * JSON Report Generation Strategy
 */

import { ReportStrategy } from './ReportStrategy.js';

export class JSONReportStrategy extends ReportStrategy {
  constructor() {
    super();
    this.format = 'json';
  }

  async generate(results, options = {}) {
    this.validateResults(results);

    const metadata = this.extractMetadata(results, options);
    const categories = this.formatCategories(results.categories);

    const jsonReport = {
      metadata,
      overall: results.overall,
      categories,
      recommendations: results.recommendations || [],
      generatedAt: new Date().toISOString(),
      format: 'json',
      version: metadata.version
    };

    return JSON.stringify(jsonReport, null, options.pretty ? 2 : 0);
  }

  getFileExtension() {
    return '.json';
  }

  getMimeType() {
    return 'application/json';
  }
}