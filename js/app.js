import { DifferentialEquation } from './differential-equation.js';
import { Solver } from './solver.js';

class Application {
    constructor() {
        this.chart = null;
        this.initializeEventListeners();
        this.updateCalculatedParams();
    }
    
    initializeEventListeners() {
        document.getElementById('solve-btn').addEventListener('click', () => {
            this.solve();
        });
        
        const inputs = ['mass', 'stiffness', 'damping-ratio', 'force-amplitude', 'frequency'];
        inputs.forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.updateCalculatedParams();
            });
        });
    }
    
    updateCalculatedParams() {
        const params = this.getParameters();
        const b = 2 * params.dampingRatio * Math.sqrt(params.k * params.m);
        
        document.getElementById('damping-coeff').textContent = b.toFixed(0);
        
        const equation = new DifferentialEquation(params.m, b, params.k, params.F0, params.omega);
        document.getElementById('normalized-eq').textContent = equation.getNormalizedEquationString();
    }
    
    getParameters() {
        return {
            m: parseFloat(document.getElementById('mass').value),
            k: parseFloat(document.getElementById('stiffness').value),
            dampingRatio: parseFloat(document.getElementById('damping-ratio').value),
            F0: parseFloat(document.getElementById('force-amplitude').value),
            omega: parseFloat(document.getElementById('frequency').value),
            t0: parseFloat(document.getElementById('t-start').value),
            t1: parseFloat(document.getElementById('t-end').value),
            h: parseFloat(document.getElementById('step').value),
            precision: parseInt(document.getElementById('precision').value)
        };
    }
    
    solve() {
        const params = this.getParameters();
        const solveBtn = document.getElementById('solve-btn');
        
        solveBtn.textContent = 'Вычисление...';
        solveBtn.disabled = true;
        
        try {
            const results = Solver.solve(params);
            
            const comparison = Solver.compareResults(
                results.rk5, 
                results.adamsMoulton, 
                params.precision
            );
            
            this.displayResults(results, comparison, params.precision);
            
        } catch (error) {
            alert('Ошибка при решении: ' + error.message);
        } finally {
            solveBtn.textContent = 'Решить задачу';
            solveBtn.disabled = false;
        }
    }
    
    displayResults(results, comparison, precision) {
        document.getElementById('results').style.display = 'block';
        
        const tbody = document.getElementById('comparison-tbody');
        tbody.innerHTML = `
            <tr>
                <td>Рунге-Кутты 5-го порядка</td>
                <td>${comparison.rk5Value.toFixed(precision)}</td>
                <td>0 (эталон)</td>
            </tr>
            <tr>
                <td>Адамса-Мултона 4-го порядка</td>
                <td>${comparison.amValue.toFixed(precision)}</td>
                <td>${comparison.deviation.toFixed(4)}</td>
            </tr>
        `;

        const xValueHeader = document.getElementById('x-value-header');
        if (xValueHeader) {
            xValueHeader.textContent = `Значение x(${parseFloat(comparison.tMid.toFixed(precision))}), м`;
        }
        
        this.plotResults(results.rk5, results.adamsMoulton);
        
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
            this.plotResults(results.rk5, results.adamsMoulton);
        }, 300);
    }
    
    plotResults(rk5Solution, amSolution) {
        const ctx = document.getElementById('solutionChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        const step = Math.max(1, Math.floor(rk5Solution.length / 1000));
        
        const rk5Data = rk5Solution
            .filter((_, index) => index % step === 0)
            .map(point => ({
                x: point[0],
                y: point[1][0]
            }));
        
        const amData = amSolution
            .filter((_, index) => index % step === 0)
            .map(point => ({
                x: point[0],
                y: point[1][0]
            }));
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Рунге-Кутты 5-го порядка',
                        data: rk5Data,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Адамса-Мултона 4-го порядка',
                        data: amData,
                        borderColor: '#764ba2',
                        backgroundColor: 'rgba(118, 75, 162, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Смещение мостовой конструкции x(t)',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(6)} м`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        display: true,
                        title: {
                            display: true,
                            text: 'Время t, с',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: true
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        title: {
                            display: true,
                            text: 'Смещение x, м',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: true
                        }
                    }
                }
            }
        });

        setTimeout(() => {
            if (this.chart) {
                this.chart.update('none');
            }
        }, 100);

        console.log('Chart initialized:', this.chart);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Application();
});