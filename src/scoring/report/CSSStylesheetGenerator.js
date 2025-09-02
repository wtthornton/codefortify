/**
 * CSS Stylesheet Generator
 * Generates CSS styles for scoring report HTML
 */

export class CSSStylesheetGenerator {
  generateStyles() {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        padding: 20px;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.1);
        overflow: hidden;
        animation: slideUp 0.6s ease-out;
      }

      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      header {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
        padding: 40px;
        text-align: center;
      }

      header h1 {
        font-size: 2.5rem;
        margin-bottom: 20px;
        font-weight: 700;
      }

      .icon { font-size: 1.2em; margin-right: 10px; }

      .metadata {
        display: flex;
        justify-content: center;
        gap: 30px;
        flex-wrap: wrap;
        margin-top: 20px;
        opacity: 0.9;
      }

      .score-overview {
        padding: 60px 40px;
        text-align: center;
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
      }

      .overall-score {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 40px;
        flex-wrap: wrap;
      }

      .score-circle {
        width: 200px;
        height: 200px;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        font-weight: bold;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      }

      .score-circle.a, .score-circle.a- { background: linear-gradient(135deg, #a8e6cf, #88d8a3); }
      .score-circle.b, .score-circle.b- { background: linear-gradient(135deg, #ffd93d, #ff6b6b); }
      .score-circle.c, .score-circle.c- { background: linear-gradient(135deg, #ffc947, #ff9068); }
      .score-circle.d, .score-circle.d- { background: linear-gradient(135deg, #ff9a9e, #fecfef); }
      .score-circle.f { background: linear-gradient(135deg, #ff6b6b, #ee5a52); }

      .score { font-size: 3rem; color: white; }
      .max-score { font-size: 1.2rem; color: rgba(255,255,255,0.8); }
      .grade { font-size: 1.5rem; color: white; margin-top: 10px; }

      .score-details h2 { font-size: 2rem; margin-bottom: 10px; color: #333; }
      .percentage { font-size: 3rem; color: #4facfe; font-weight: bold; }

      .categories { padding: 40px; }
      .categories h2 { text-align: center; margin-bottom: 40px; font-size: 2rem; color: #333; }

      .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
      }

      .category-card {
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        border-left: 5px solid #ddd;
      }

      .category-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      }

      .category-card.a { border-left-color: #a8e6cf; background: linear-gradient(135deg, #f8fff8, #e8f5e8); }
      .category-card.b { border-left-color: #ffd93d; background: linear-gradient(135deg, #fffdf7, #fff7e6); }
      .category-card.c { border-left-color: #ffc947; background: linear-gradient(135deg, #fff9f0, #ffeedc); }
      .category-card.d { border-left-color: #ff9a9e; background: linear-gradient(135deg, #fff5f5, #ffe6e6); }
      .category-card.f { border-left-color: #ff6b6b; background: linear-gradient(135deg, #fff0f0, #ffeaea); }

      .category-card h3 { margin-bottom: 15px; color: #333; font-size: 1.3rem; }

      .category-score {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 15px;
      }

      .progress-bar {
        flex-grow: 1;
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        margin: 0 15px;
        overflow: hidden;
      }

      .progress {
        height: 100%;
        background: linear-gradient(90deg, #4facfe, #00f2fe);
        border-radius: 4px;
        transition: width 0.8s ease;
      }

      .category-issues {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .issue, .more {
        font-size: 0.9rem;
        color: #666;
        padding: 2px 0;
      }

      .recommendations { padding: 40px; background: #f8f9fa; }
      .recommendations h2 { text-align: center; margin-bottom: 30px; font-size: 2rem; color: #333; }

      .recommendation-list { display: grid; gap: 15px; }

      .recommendation {
        padding: 20px;
        border-radius: 10px;
        border-left: 4px solid #ddd;
        background: white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.05);
      }

      .recommendation.high { border-left-color: #ff6b6b; }
      .recommendation.medium { border-left-color: #ffc947; }
      .recommendation.low { border-left-color: #a8e6cf; }

      .recommendation h4 { margin-bottom: 10px; color: #333; }
      .recommendation p { color: #666; margin-bottom: 15px; }

      .recommendation-meta {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
      }

      .recommendation-meta span {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 500;
      }

      .priority { background: #e3f2fd; color: #1976d2; }
      .impact { background: #f3e5f5; color: #7b1fa2; }
      .effort { background: #e8f5e8; color: #388e3c; }

      .charts { padding: 40px; }
      .charts h2 { text-align: center; margin-bottom: 30px; font-size: 2rem; color: #333; }

      .chart-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 30px;
      }

      .chart-container {
        background: white;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.08);
      }

      footer {
        text-align: center;
        padding: 30px;
        background: #2c3e50;
        color: white;
      }

      footer a { color: #4facfe; text-decoration: none; }
      footer a:hover { text-decoration: underline; }

      @media (max-width: 768px) {
        body { padding: 10px; }
        .container { border-radius: 10px; }
        header { padding: 20px; }
        header h1 { font-size: 2rem; }
        .metadata { flex-direction: column; gap: 10px; }
        .score-circle { width: 150px; height: 150px; }
        .score { font-size: 2.5rem; }
        .overall-score { flex-direction: column; gap: 20px; }
        .category-grid { grid-template-columns: 1fr; }
        .chart-grid { grid-template-columns: 1fr; }
      }
    `;
  }
}