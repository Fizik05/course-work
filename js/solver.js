import { DifferentialEquation } from './differential-equation.js';
import { RungeKutta5 } from './runge-kutta.js';
import { AdamsMoulton4 } from './adams-moulton.js';

export class Solver {
    static solve(params) {
        // Вычисляем коэффициент демпфирования
        const b = 2 * params.dampingRatio * Math.sqrt(params.k * params.m);
        
        // Создаем уравнение
        const equation = new DifferentialEquation(
            params.m, b, params.k, params.F0, params.omega
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
            rk5: rk5Solution,
            adamsMoulton: amSolution,
            dampingCoeff: b
        };
    }
    
    static compareResults(rk5Solution, amSolution, precision) {
        // Находим значение в середине временного промежутка
        const midIndex = Math.floor(rk5Solution.length / 2);
        
        const rk5Value = rk5Solution[midIndex][1][0];
        const amValue = amSolution[midIndex][1][0];
        const tMid = rk5Solution[midIndex][0];
        
        // РК5 как эталон
        const deviation = Math.abs((amValue - rk5Value) / rk5Value * 100);
        
        return {
            tMid,
            rk5Value,
            amValue,
            deviation
        };
    }
}