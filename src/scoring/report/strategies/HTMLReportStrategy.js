/**
 * HTML Report Generation Strategy
 * Generates interactive HTML reports using template components
 */

import { ReportStrategy } from './ReportStrategy.js';
import { HTMLTemplateBuilder } from '../HTMLTemplateBuilder.js';
import { CSSStylesheetGenerator } from '../CSSStylesheetGenerator.js';
import { JavaScriptGenerator } from '../JavaScriptGenerator.js';

export class HTMLReportStrategy extends ReportStrategy {
  constructor() {
    super();
    this.format = 'html';
    this.templateBuilder = new HTMLTemplateBuilder();
    this.cssGenerator = new CSSStylesheetGenerator();
    this.jsGenerator = new JavaScriptGenerator();
  }

  async generate(results, options = {}) {
    this.validateResults(results);

    const metadata = this.extractMetadata(results, options);
    const categories = this.formatCategories(results.categories);
    
    const templateData = {
      projectName: metadata.projectName,
      overall: results.overall,
      categories,
      recommendations: results.recommendations || [],
      metadata
    };

    // Generate CSS and JavaScript content
    const cssContent = this.cssGenerator.generateStyles();
    const jsContent = this.jsGenerator.generateClientScript(templateData);

    // Generate complete HTML
    return this.templateBuilder.generateTemplate(templateData, cssContent, jsContent);
  }

  getFileExtension() {
    return '.html';
  }

  getMimeType() {
    return 'text/html';
  }

  /**
   * Generate HTML with custom styling
   */
  async generateWithCustomCSS(results, customCSS, options = {}) {
    this.validateResults(results);

    const metadata = this.extractMetadata(results, options);
    const categories = this.formatCategories(results.categories);
    
    const templateData = {
      projectName: metadata.projectName,
      overall: results.overall,
      categories,
      recommendations: results.recommendations || [],
      metadata
    };

    const jsContent = this.jsGenerator.generateClientScript(templateData);
    
    return this.templateBuilder.generateTemplate(templateData, customCSS, jsContent);
  }

  /**
   * Generate minimal HTML (without charts/JS)
   */
  async generateMinimal(results, options = {}) {
    this.validateResults(results);

    const metadata = this.extractMetadata(results, options);
    const categories = this.formatCategories(results.categories);
    
    const templateData = {
      projectName: metadata.projectName,
      overall: results.overall,
      categories,
      recommendations: results.recommendations || [],
      metadata
    };

    const cssContent = this.cssGenerator.generateStyles();
    const minimalJS = '// Minimal report - no interactive features';
    
    return this.templateBuilder.generateTemplate(templateData, cssContent, minimalJS);
  }
}