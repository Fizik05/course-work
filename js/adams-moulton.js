import { RungeKutta5 } from './runge-kutta.js';

export class AdamsMoulton4 {
    static solve(equation, t0, tEnd, h) {
        // Получаем первые 4 точки с помощью РК5
        const initialSolution = RungeKutta5.solve(equation, [0, 0], t0, t0 + 3*h, h);
        
        const tValues = initialSolution.map(point => point[0]);
        const yValues = initialSolution.map(point => point[1]);
        const results = [...initialSolution];

        const nSteps = Math.floor((tEnd - tValues[tValues.length - 1]) / h);

        for (let i = 0; i < nSteps; i++) {
            const tN3 = tValues[tValues.length - 4];
            const yN3 = yValues[yValues.length - 4];
            const tN2 = tValues[tValues.length - 3];
            const yN2 = yValues[yValues.length - 3];
            const tN1 = tValues[tValues.length - 2];
            const yN1 = yValues[yValues.length - 2];
            const tN = tValues[tValues.length - 1];
            const yN = yValues[yValues.length - 1];
            const tNp1 = tN + h;

            const fN3 = equation.f(tN3, yN3);
            const fN2 = equation.f(tN2, yN2);
            const fN1 = equation.f(tN1, yN1);
            const fN = equation.f(tN, yN);

            // Предиктор
            const yPred = yN.map((yNj, j) => 
                yNj + h / 24 * (
                    55 * fN[j] - 59 * fN1[j] + 37 * fN2[j] - 9 * fN3[j]
                )
            );

            const fNp1Pred = equation.f(tNp1, yPred);

            // Корректор
            const yRes = yN.map((yNj, j) => 
                yNj + h / 24 * (
                    9 * fNp1Pred[j] + 19 * fN[j] - 5 * fN1[j] + fN2[j]
                )
            );

            tValues.push(tNp1);
            yValues.push([...yRes]);
            results.push([tNp1, [...yRes]]);
        }

        return results;
    }
}