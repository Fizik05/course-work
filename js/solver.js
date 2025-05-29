import { DifferentialEquation } from './differential-equation.js';
import { RungeKutta5 } from './runge-kutta.js';
import { AdamsMoulton4 } from './adams-moulton.js';
import { AnalyticalSolution } from './analytical-solution.js';

export class Solver {
    static solve(params) {
        // Фиксированный коэффициент затухания
        const zeta = 0.01;
        
        // Вычисляем коэффициент демпфирования
        const b = 2 * zeta * Math.sqrt(params.k * params.m);
        
        // Создаем уравнение
        const equation = new DifferentialEquation(
            params.m, b, params.k, params.F0, params.omega
        );
        
        // Решаем аналитически
        const analyticalSolution = AnalyticalSolution.solve(
            equation,
            params.t0,
            params.t1,
            params.h
        );
        
        // Решаем РК5
        const rk5Solution = RungeKutta5.solve(
            equation, 
            [0, 0], 
            params.t0, 
            params.t1, 
            params.h
        );
        
        // Решаем Адамса-Мултона
        const amSolution = AdamsMoulton4.solve(
            equation,
            params.t0,
            params.t1,
            params.h
        );
        
        return {
            equation,
            analytical: analyticalSolution,
            rk5: rk5Solution,
            adamsMoulton: amSolution,
            dampingCoeff: b
        };
    }
    
    static compareResults(analyticalSolution, rk5Solution, amSolution, precision) {
        // Находим значение в середине временного промежутка
        const midIndex = Math.min(600, Math.floor(analyticalSolution.length / 2));
        
        const analyticalValue = analyticalSolution[midIndex][1][0];
        const rk5Value = rk5Solution[midIndex][1][0];
        const amValue = amSolution[midIndex][1][0];
        const tMid = analyticalSolution[midIndex][0];
        
        // Аналитическое решение как эталон
        const rk5Deviation = Math.abs((rk5Value - analyticalValue) / analyticalValue * 100);
        const amDeviation = Math.abs((amValue - analyticalValue) / analyticalValue * 100);
        
        return {
            tMid,
            analyticalValue,
            rk5Value,
            amValue,
            rk5Deviation,
            amDeviation
        };
    }
}