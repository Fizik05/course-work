export class AnalyticalSolution {
    static solve(equation, t0, t1, h) {
        const { m, b, k, F0, omega } = equation;
        
        // Проверяем условие для комплексных корней
        if ((b/m)**2 - (4*k/m) >= 0) {
            throw new Error("Аналитическое решение невозможно при D >= 0");
        }

        // Вычисление параметров общего однородного решения
        const alpha = -(b/(2*m));
        const beta = Math.sqrt(Math.abs(((b/m)**2)/4 - (k/m)));

        // Вычисление частного решения
        const A = (F0/m) / (-(omega**2) + (b**2*omega**2/(k*m - omega**2*m**2)) + k/m);
        const B = b*omega*A/(k - omega**2*m);
        
        const C1 = -A;
        const C2 = (-alpha*C1 - omega*B) / beta;

        // Генерируем точки решения
        const result = [];
        let t = t0;
        
        while (t <= t1) {
            const x = Math.exp(alpha*t)*(C1*Math.cos(beta*t) + C2*Math.sin(beta*t)) + 
                     A*Math.cos(omega*t) + B*Math.sin(omega*t);
            const x_dot = Math.exp(alpha*t)*(
                (alpha*C1 - beta*C2)*Math.cos(beta*t) + 
                (alpha*C2 + beta*C1)*Math.sin(beta*t)
            ) - A*omega*Math.sin(omega*t) + B*omega*Math.cos(omega*t);
            
            result.push([t, [x, x_dot]]);
            t += h;
        }

        return result;
    }
}