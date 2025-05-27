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
                results.analytical,
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
                <td>Аналитическое решение</td>
                <td>${comparison.analyticalValue.toFixed(precision)}</td>
                <td>0 (эталон)</td>
            </tr>
            <tr>
                <td>Рунге-Кутты 5-го порядка</td>
                <td>${comparison.rk5Value.toFixed(precision)}</td>
                <td>${comparison.rk5Deviation.toFixed(4)}</td>
            </tr>
            <tr>
                <td>Адамса-Мултона 4-го порядка</td>
                <td>${comparison.amValue.toFixed(precision)}</td>
                <td>${comparison.amDeviation.toFixed(4)}</td>
            </tr>
        `;

        const xValueHeader = document.getElementById('x-value-header');
        if (xValueHeader) {
            xValueHeader.textContent = `Значение x(${parseFloat(comparison.tMid.toFixed(precision))}), м`;
        }
        
        this.plotResults(results.analytical, results.rk5, results.adamsMoulton);
        
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
            this.plotResults(results.analytical, results.rk5, results.adamsMoulton);
        }, 300);
    }
    
    plotResults(analyticalSolution, rk5Solution, amSolution) {
        const ctx = document.getElementById('solutionChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        const step = Math.max(1, Math.floor(analyticalSolution.length / 1000));
        
        const analyticalData = analyticalSolution
            .filter((_, index) => index % step === 0)
            .map(point => ({
                x: point[0],
                y: point[1][0]
            }));
        
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

        const upBorder = rk5Solution
            .filter((_, index) => index % step === 0)
            .map(point => ({
                x: point[0],
                y: 0.04
            }))

        const downBorder = rk5Solution
            .filter((_, index) => index % step === 0)
            .map(point => ({
                x: point[0],
                y: -0.04
            }))
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Аналитическое решение',
                        data: analyticalData,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        borderWidth: 3,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Рунге-Кутты 5-го порядка',
                        data: rk5Data,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1,
                        borderDash: [3, 3]
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
                    },
                    {
                        data: upBorder,
                        borderColor: '#c90000',
                        backgroundColor: 'rgba(118, 75, 162, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1,
                        borderDash: [5, 5]
                    },
                    {
                        data: downBorder,
                        borderColor: '#c90000',
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
                        position: 'top',
                        labels: {
                            generateLabels: function(chart) {
                                // Получаем стандартные метки легенды, которые Chart.js сгенерировал бы
                                const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                                const newLabels = [];

                                // Добавляем метки для аналитического решения, Рунге-Кутты и Адамса-Мултона
                                // Предполагается, что это первые три датасета (индексы 0, 1, 2)
                                for (let i = 0; i < 3 && i < originalLabels.length; i++) {
                                    newLabels.push(originalLabels[i]);
                                }

                                // Добавляем кастомную метку "Норматив"
                                // Используем стили первой линии норматива (upBorder) для внешнего вида в легенде
                                const upBorderDataset = chart.data.datasets[3]; // upBorder находится по индексу 3
                                if (upBorderDataset) {
                                    newLabels.push({
                                        text: 'Норматив', // Текст метки в легенде
                                        fillStyle: upBorderDataset.backgroundColor, // Цвет заливки (для квадратика)
                                        strokeStyle: upBorderDataset.borderColor, // Цвет линии (для линии)
                                        lineWidth: upBorderDataset.borderWidth, // Толщина линии
                                        lineDash: upBorderDataset.borderDash, // Стиль пунктирной линии
                                        hidden: false, // Метка не скрыта
                                        // datasetIndex: -1 // Указываем, что эта метка не привязана к конкретному датасету
                                                              // (чтобы клик по ней не скрывал конкретную линию)
                                    });
                                }
                                return newLabels;
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                // Модифицируем подсказку, чтобы для линий норматива было понятное название
                                if (context.datasetIndex === 3) {
                                    return `Верхний норматив: ${context.parsed.y.toFixed(6)} м`;
                                } else if (context.datasetIndex === 4) {
                                    return `Нижний норматив: ${context.parsed.y.toFixed(6)} м`;
                                }
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
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Application();
});