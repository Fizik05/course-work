export class DifferentialEquation {
    constructor(m, b, k, F0, omega) {
        this.m = m;
        this.b = b;
        this.k = k;
        this.F0 = F0;
        this.omega = omega;
        
        // Нормированные коэффициенты
        this.bNorm = b / m;
        this.kNorm = k / m;
        this.F0Norm = F0 / m;
    }
    
    // Функция правой части системы ДУ первого порядка
    f(t, y) {
        const [y1, y2] = y; // y1 = x, y2 = x'
        const dy1 = y2;
        const dy2 = -this.bNorm * y2 - this.kNorm * y1 + this.F0Norm * Math.cos(this.omega * t);
        return [dy1, dy2];
    }
    
    // Получить строковое представление нормированного уравнения
    getNormalizedEquationString(precision = 5) {
        return `x'' + ${this.bNorm.toFixed(precision)}x' + ${this.kNorm.toFixed(precision)}x = ${this.F0Norm.toFixed(precision)}cos(${this.omega}t)`;
    }
}