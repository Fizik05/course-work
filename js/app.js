import { DifferentialEquation } from './differential-equation.js';
import { Solver } from './solver.js';

class Application {
    constructor() {
        this.chart = null;
        this.maxIterations = 100000;
        this.initializeEventListeners();
        this.updateCalculatedParams();
    }
    
    initializeEventListeners() {
        document.getElementById('solve-btn').addEventListener('click', () => {
            if (this.validateInputs()) {
                this.solve();
            }
        });
        
        const inputs = ['mass', 'bridge-type', 'force-amplitude', 't-end', 'step', 'precision'];
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    this.validateInputs();
                    this.updateCalculatedParams();
                });
                element.addEventListener('change', () => {
                    this.validateInputs();
                    this.updateCalculatedParams();
                });
            }
        });
    }
    
    validateInputs() {
        let isValid = true;
        
        // Валидация массы
        const mass = parseFloat(document.getElementById('mass').value);
        const massValidation = document.getElementById('mass-validation');
        if (isNaN(mass) || mass < 2000 || mass > 200000) {
            massValidation.textContent = 'Масса должна быть от 2,000 до 200,000 кг';
            isValid = false;
        } else {
            massValidation.textContent = '';
        }
        
        // Валидация амплитуды силы
        const force = parseFloat(document.getElementById('force-amplitude').value);
        const forceValidation = document.getElementById('force-validation');
        if (isNaN(force) || force < 0) {
            forceValidation.textContent = 'Амплитуда силы не может быть отрицательной';
            isValid = false;
        } else {
            forceValidation.textContent = '';
        }
        
        // Валидация конечного времени
        const tEnd = parseFloat(document.getElementById('t-end').value);
        const tEndValidation = document.getElementById('t-end-validation');
        if (isNaN(tEnd) || tEnd <= 0) {
            tEndValidation.textContent = 'Конечное время должно быть положительным';
            isValid = false;
        } else if (tEnd > 1000) {
            tEndValidation.textContent = 'Конечное время не должно превышать 1000 секунд';
            isValid = false;
        } else {
            tEndValidation.textContent = '';
        }
        
        // Валидация шага времени
        const step = parseFloat(document.getElementById('step').value);
        const stepValidation = document.getElementById('step-validation');
        const maxStep = (tEnd - 0) / 10;
        const minStep = (tEnd - 0) / this.maxIterations;
        
        if (isNaN(step) || step <= 0) {
            stepValidation.textContent = 'Шаг времени должен быть положительным';
            isValid = false;
        } else if (step >= maxStep) {
            stepValidation.textContent = `Шаг должен быть меньше ${maxStep.toFixed(4)}`;
            isValid = false;
        } else if (step < minStep) {
            stepValidation.textContent = `Шаг слишком мал. Минимальный шаг: ${minStep.toFixed(6)}`;
            isValid = false;
        } else {
            const totalIterations = Math.ceil((tEnd - 0) / step);
            if (totalIterations > this.maxIterations) {
                stepValidation.textContent = `Слишком много итераций (${totalIterations.toLocaleString()}). Увеличьте шаг или уменьшите время.`;
                isValid = false;
            } else if (totalIterations > this.maxIterations * 0.8) {
                stepValidation.textContent = `Предупреждение: большое количество итераций (${totalIterations.toLocaleString()}). Вычисления могут занять время.`;
                stepValidation.style.color = '#ff9800';
            } else {
                stepValidation.textContent = '';
                stepValidation.style.color = '#dc3545';
            }
        }
        
        // Валидация точности
        const precision = parseInt(document.getElementById('precision').value);
        const precisionValidation = document.getElementById('precision-validation');
        if (isNaN(precision) || precision < 0 || precision > 10) {
            precisionValidation.textContent = 'Точность должна быть от 0 до 10';
            isValid = false;
        } else {
            precisionValidation.textContent = '';
        }
        
        return isValid;
    }
    
    updateCalculatedParams() {
        const params = this.getParameters();
        const zeta = 0.01; // Фиксированный коэффициент затухания
        const b = 2 * zeta * Math.sqrt(params.k * params.m);
        
        document.getElementById('damping-coeff').textContent = b.toFixed(0);
        
        const equation = new DifferentialEquation(params.m, b, params.k, params.F0, params.omega);
        document.getElementById('normalized-eq').textContent = equation.getNormalizedEquationString();
    }
    
    getParameters() {
        return {
            m: parseFloat(document.getElementById('mass').value),
            k: parseFloat(document.getElementById('bridge-type').value),
            F0: parseFloat(document.getElementById('force-amplitude').value),
            omega: 6.1, // Фиксированная частота
            t0: 0, // Фиксированное начальное время
            t1: parseFloat(document.getElementById('t-end').value),
            h: parseFloat(document.getElementById('step').value),
            precision: parseInt(document.getElementById('precision').value)
        };
    }
    
    solve() {
        const params = this.getParameters();
        const solveBtn = document.getElementById('solve-btn');
        
        // Дополнительная проверка перед вычислениями
        const totalIterations = Math.ceil((params.t1 - params.t0) / params.h);
        if (totalIterations > this.maxIterations) {
            alert(`Слишком много итераций (${totalIterations.toLocaleString()}). Пожалуйста, увеличьте шаг времени или уменьшите конечное время.`);
            return;
        }
        
        // Предупреждение для больших вычислений
        if (totalIterations > 50000) {
            const proceed = confirm(
                `Вычисления займут ${totalIterations.toLocaleString()} итераций и могут занять некоторое время. Продолжить?`
            );
            if (!proceed) {
                return;
            }
        }
        
        solveBtn.textContent = 'Вычисление...';
        solveBtn.disabled = true;
        
        // Используем setTimeout для неблокирующих вычислений
        setTimeout(() => {
            try {
                const startTime = performance.now();
                const results = Solver.solve(params);
                const endTime = performance.now();
                
                console.log(`Вычисления заняли ${(endTime - startTime).toFixed(2)} мс`);
                
                const comparison = Solver.compareResults(
                    results.analytical,
                    results.rk5, 
                    results.adamsMoulton, 
                    params.precision
                );
                
                this.displayResults(results, comparison, params.precision);
                
            } catch (error) {
                console.error('Ошибка при решении:', error);
                alert('Ошибка при решении: ' + error.message);
            } finally {
                solveBtn.textContent = 'Решить задачу';
                solveBtn.disabled = false;
            }
        }, 100);
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
        this.checkNormativeCompliance(results);
        
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
            this.plotResults(results.analytical, results.rk5, results.adamsMoulton);
        }, 300);
    }
    
    checkNormativeCompliance(results) {
        // Проверяем превышение норматива ±0.04 м
        const maxAmplitude = Math.max(...results.rk5.map(point => Math.abs(point[1][0])));
        const recommendationsDiv = document.getElementById('recommendations');
        
        if (maxAmplitude > 0.04) {
            recommendationsDiv.style.display = 'block';
        } else {
            recommendationsDiv.style.display = 'none';
        }
    }
    
    plotResults(analyticalSolution, rk5Solution, amSolution) {
        const ctx = document.getElementById('solutionChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        // Адаптивное прореживание данных для больших наборов
        const maxPoints = 2000;
        const totalPoints = analyticalSolution.length;
        const step = Math.max(1, Math.floor(totalPoints / maxPoints));
        
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
            }));

        const downBorder = rk5Solution
            .filter((_, index) => index % step === 0)
            .map(point => ({
                x: point[0],
                y: -0.04
            }));
        
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
                        backgroundColor: 'rgba(201, 0, 0, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1,
                        borderDash: [5, 5]
                    },
                    {
                        data: downBorder,
                        borderColor: '#c90000',
                        backgroundColor: 'rgba(201, 0, 0, 0.1)',
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
                                const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                                const newLabels = [];

                                for (let i = 0; i < 3 && i < originalLabels.length; i++) {
                                    newLabels.push(originalLabels[i]);
                                }

                                const upBorderDataset = chart.data.datasets[3];
                                if (upBorderDataset) {
                                    newLabels.push({
                                        text: 'Норматив',
                                        fillStyle: upBorderDataset.backgroundColor,
                                        strokeStyle: upBorderDataset.borderColor,
                                        lineWidth: upBorderDataset.borderWidth,
                                        lineDash: upBorderDataset.borderDash,
                                        hidden: false
                                    });
                                }
                                return newLabels;
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
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