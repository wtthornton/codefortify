/**
 * JavaScript Generator
 * Generates client-side JavaScript for interactive charts and functionality
 */

export class JavaScriptGenerator {
  generateClientScript(data) {
    const { categories } = data;

    return `
      // Initialize charts when DOM is loaded
      document.addEventListener('DOMContentLoaded', function() {
        initializeCharts(${JSON.stringify(categories)});
      });

      function initializeCharts(categories) {
        // Category scores chart
        const categoryCtx = document.getElementById('categoryChart');
        if (categoryCtx) {
          new Chart(categoryCtx, {
            type: 'radar',
            data: {
              labels: Object.keys(categories).map(key => categories[key].name),
              datasets: [{
                label: 'Current Score',
                data: Object.values(categories).map(cat => (cat.score / cat.maxScore) * 100),
                backgroundColor: 'rgba(79, 172, 254, 0.2)',
                borderColor: 'rgba(79, 172, 254, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(79, 172, 254, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                r: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    stepSize: 20
                  }
                }
              },
              plugins: {
                title: {
                  display: true,
                  text: 'Category Performance Radar'
                },
                legend: {
                  display: false
                }
              }
            }
          });
        }

        // Trend chart (placeholder for future implementation)
        const trendCtx = document.getElementById('trendChart');
        if (trendCtx) {
          new Chart(trendCtx, {
            type: 'line',
            data: {
              labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
              datasets: [{
                label: 'Quality Score',
                data: [60, 65, 70, ${Math.round(Object.values(categories).reduce((sum, cat) => sum + (cat.score / cat.maxScore), 0) / Object.keys(categories).length * 100)}],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100
                }
              },
              plugins: {
                title: {
                  display: true,
                  text: 'Quality Trend Over Time'
                }
              }
            }
          });
        }
      }

      // Add smooth scrolling for anchor links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      });

      // Add category card click handlers for future detailed views
      document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
          // Future: Open detailed category view
          console.log('Category clicked:', this.querySelector('h3').textContent);
        });
      });
    `;
  }
}