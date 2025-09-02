/* eslint-env browser */
// CodeFortify User Guide Interactive Features
class UserGuide {
  constructor() {
    this.currentSection = null;
    this.progress = 0;
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupProgressTracking();
    this.setupInteractiveDemos();
    this.setupCodeHighlighting();
    this.setupSearch();
    this.setupMobileMenu();
  }

  setupNavigation() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Highlight current section in sidebar
    const sections = document.querySelectorAll('h2[id]');
    const sidebarLinks = document.querySelectorAll('.sidebar a[href^="#"]');

    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.pageYOffset >= sectionTop) {
          current = section.getAttribute('id');
        }
      });

      sidebarLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    });
  }

  setupProgressTracking() {
    // Track reading progress
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
      });
    }
  }

  setupInteractiveDemos() {
    // Command line simulator
    const commandSimulator = document.querySelector('.command-simulator');
    if (commandSimulator) {
      this.setupCommandSimulator(commandSimulator);
    }

    // Code quality score demo
    const scoreDemo = document.querySelector('.score-demo');
    if (scoreDemo) {
      this.setupScoreDemo(scoreDemo);
    }

    // Interactive tutorials
    const tutorials = document.querySelectorAll('.interactive-tutorial');
    tutorials.forEach(tutorial => {
      this.setupInteractiveTutorial(tutorial);
    });
  }

  setupCommandSimulator(container) {
    const terminal = container.querySelector('.terminal');
    const input = container.querySelector('.terminal-input');
    const output = container.querySelector('.terminal-output');

    if (!terminal || !input || !output) {return;}

    const commands = {
      'codefortify --help': {
        output: `CodeFortify - Revolutionary AI-Powered Code Enhancement

USAGE:
  codefortify [COMMAND] [OPTIONS]

COMMANDS:
  enhance     Continuously improve your codebase
  score       Analyze code quality and get detailed scores
  validate    Check project compliance with standards
  template    Manage project templates and standards
  analyze     Deep code analysis with AI insights

OPTIONS:
  --help, -h     Show this help message
  --version, -v  Show version information
  --verbose      Enable verbose output
  --config       Specify configuration file

EXAMPLES:
  codefortify enhance --watch
  codefortify score --detailed
  codefortify validate --fix`,
        type: 'success'
      },
      'codefortify score': {
        output: `Code Quality Analysis Complete

Overall Score: 74/100 (C Grade)
┌─────────────────┬─────────┬──────────┐
│ Category        │ Score   │ Grade    │
├─────────────────┼─────────┼──────────┤
│ Code Quality    │ 63/100  │ D-       │
│ Test Coverage   │ 60/100  │ D-       │
│ Security        │ 81/100  │ B-       │
│ Performance     │ 63/100  │ D-       │
│ Documentation   │ 45/100  │ F        │
└─────────────────┴─────────┴──────────┘

Recommendations:
• Fix ESLint issues (23 warnings, 5 errors)
• Increase test coverage to 80%+
• Add comprehensive documentation
• Optimize bundle size (2.3MB → target: <1MB)`,
        type: 'info'
      },
      'codefortify enhance': {
        output: `🚀 Starting Continuous Enhancement Mode

Initializing AI agents...
✓ ReviewAgent ready
✓ EnhancementAgent ready  
✓ LearningAgent ready
✓ QualityMonitor ready

Analyzing codebase...
Found 47 files to analyze
Detected patterns: React, TypeScript, Node.js

Starting enhancement cycle 1...
✓ Fixed 3 syntax errors
✓ Improved 2 component patterns
✓ Added 5 missing tests
✓ Updated documentation

Quality Score: 74 → 82 (+8 points)
Enhancement complete! Starting next cycle...`,
        type: 'success'
      }
    };

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const command = input.value.trim();
        input.value = '';

        // Add command to output
        const commandLine = document.createElement('div');
        commandLine.className = 'command-line';
        commandLine.innerHTML = `<span class="prompt">$</span> <span class="command">${command}</span>`;
        output.appendChild(commandLine);

        // Add response
        setTimeout(() => {
          const response = commands[command] || {
            output: `Command not found: ${command}\nType 'codefortify --help' for available commands.`,
            type: 'error'
          };

          const responseLine = document.createElement('div');
          responseLine.className = `response ${response.type}`;
          responseLine.textContent = response.output;
          output.appendChild(responseLine);

          // Scroll to bottom
          terminal.scrollTop = terminal.scrollHeight;
        }, 500);
      }
    });
  }

  setupScoreDemo(container) {
    const scoreDisplay = container.querySelector('.score-display');
    const improveBtn = container.querySelector('.improve-btn');

    if (!scoreDisplay || !improveBtn) {return;}

    let currentScore = 74;
    const targetScore = 90;

    improveBtn.addEventListener('click', () => {
      const improvement = Math.min(5, targetScore - currentScore);
      currentScore += improvement;

      scoreDisplay.innerHTML = `
        <div class="score-number">${currentScore}/100</div>
        <div class="score-grade">${this.getGrade(currentScore)}</div>
        <div class="score-progress">
          <div class="progress-bar" style="width: ${currentScore}%"></div>
        </div>
      `;

      if (currentScore >= targetScore) {
        improveBtn.textContent = '🎉 Target Reached!';
        improveBtn.disabled = true;
        improveBtn.classList.add('success');
      }
    });
  }

  setupInteractiveTutorial(tutorial) {
    const steps = tutorial.querySelectorAll('.tutorial-step');
    const nextBtn = tutorial.querySelector('.next-step');
    const prevBtn = tutorial.querySelector('.prev-step');
    const progress = tutorial.querySelector('.tutorial-progress');

    let currentStep = 0;

    const updateStep = () => {
      steps.forEach((step, index) => {
        step.classList.toggle('active', index === currentStep);
        step.classList.toggle('completed', index < currentStep);
      });

      if (progress) {
        progress.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
      }

      if (nextBtn) {
        nextBtn.disabled = currentStep >= steps.length - 1;
      }
      if (prevBtn) {
        prevBtn.disabled = currentStep <= 0;
      }
    };

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentStep < steps.length - 1) {
          currentStep++;
          updateStep();
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
          currentStep--;
          updateStep();
        }
      });
    }

    updateStep();
  }

  setupCodeHighlighting() {
    // Simple syntax highlighting for code blocks
    document.querySelectorAll('pre code').forEach(block => {
      const code = block.textContent;
      const highlighted = this.highlightCode(code);
      block.innerHTML = highlighted;
    });
  }

  highlightCode(code) {
    // Simple keyword highlighting
    const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export'];
    const strings = /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g;
    const comments = /\/\/.*$/gm;
    const numbers = /\b\d+\b/g;

    let highlighted = code;

    // Highlight strings
    highlighted = highlighted.replace(strings, '<span class="string">$&</span>');

    // Highlight comments
    highlighted = highlighted.replace(comments, '<span class="comment">$&</span>');

    // Highlight numbers
    highlighted = highlighted.replace(numbers, '<span class="number">$&</span>');

    // Highlight keywords
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
    });

    return highlighted;
  }

  setupSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');

    if (!searchInput || !searchResults) {return;}

    const searchableContent = Array.from(document.querySelectorAll('h2, h3, p')).map(el => ({
      element: el,
      text: el.textContent.toLowerCase(),
      id: el.id || el.textContent.replace(/\s+/g, '-').toLowerCase()
    }));

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();

      if (query.length < 2) {
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        return;
      }

      const matches = searchableContent.filter(item =>
        item.text.includes(query)
      );

      if (matches.length > 0) {
        searchResults.innerHTML = matches.map(match => `
          <div class="search-result" onclick="document.getElementById('${match.id}').scrollIntoView()">
            <strong>${match.element.tagName === 'H2' || match.element.tagName === 'H3' ? match.element.textContent : 'Content'}</strong>
            <p>${match.text.substring(0, 100)}...</p>
          </div>
        `).join('');
        searchResults.style.display = 'block';
      } else {
        searchResults.innerHTML = '<div class="no-results">No results found</div>';
        searchResults.style.display = 'block';
      }
    });
  }

  setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');

    if (mobileMenuBtn && nav) {
      mobileMenuBtn.addEventListener('click', () => {
        nav.classList.toggle('mobile-open');
      });
    }
  }

  getGrade(score) {
    if (score >= 90) {return 'A+';}
    if (score >= 80) {return 'A';}
    if (score >= 70) {return 'B';}
    if (score >= 60) {return 'C';}
    if (score >= 50) {return 'D';}
    return 'F';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new UserGuide();
});

// Add CSS for interactive elements
const style = document.createElement('style');
style.textContent = `
  .command-simulator {
    background: #1e293b;
    border-radius: 0.5rem;
    padding: 1rem;
    margin: 1rem 0;
  }
  
  .terminal {
    background: #0f172a;
    color: #e2e8f0;
    padding: 1rem;
    border-radius: 0.25rem;
    height: 300px;
    overflow-y: auto;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9rem;
  }
  
  .terminal-input {
    background: transparent;
    border: none;
    color: #e2e8f0;
    font-family: inherit;
    font-size: inherit;
    width: 100%;
    outline: none;
  }
  
  .command-line {
    margin-bottom: 0.5rem;
  }
  
  .prompt {
    color: #10b981;
  }
  
  .command {
    color: #fbbf24;
  }
  
  .response {
    margin: 0.5rem 0;
    padding: 0.5rem;
    border-radius: 0.25rem;
  }
  
  .response.success {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }
  
  .response.error {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
  
  .response.info {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }
  
  .score-demo {
    text-align: center;
    padding: 2rem;
    background: var(--surface-color);
    border-radius: 0.5rem;
    margin: 1rem 0;
  }
  
  .score-number {
    font-size: 3rem;
    font-weight: bold;
    color: var(--primary-color);
  }
  
  .score-grade {
    font-size: 1.5rem;
    margin: 0.5rem 0;
  }
  
  .tutorial-step {
    display: none;
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    margin: 1rem 0;
  }
  
  .tutorial-step.active {
    display: block;
    border-color: var(--primary-color);
  }
  
  .tutorial-step.completed {
    background: rgba(16, 185, 129, 0.05);
    border-color: var(--success-color);
  }
  
  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    box-shadow: var(--shadow-lg);
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
  }
  
  .search-result {
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
  }
  
  .search-result:hover {
    background: var(--surface-color);
  }
  
  .no-results {
    padding: 1rem;
    text-align: center;
    color: var(--text-secondary);
  }
  
  .keyword { color: #c792ea; }
  .string { color: #c3e88d; }
  .comment { color: #676e95; font-style: italic; }
  .number { color: #f78c6c; }
  
  @media (max-width: 768px) {
    .nav.mobile-open ul {
      display: flex;
      flex-direction: column;
    }
  }
`;
document.head.appendChild(style);
