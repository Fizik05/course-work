export class RungeKutta5 {
    static solve(equation, y0, t0, t1, h) {
        let t = t0;
        let y = [...y0];
        const result = [[t, [...y]]];

        while (t < t1) {
            const actualH = Math.min(h, t1 - t);
            
            const k1 = equation.f(t, y);

            const k2 = equation.f(
                t + actualH/4,
                y.map((yi, i) => yi + actualH/4 * k1[i])
            );

            const k3 = equation.f(
                t + actualH/4,
                y.map((yi, i) => yi + actualH/8 * k1[i] + actualH/8 * k2[i])
            );

            const k4 = equation.f(
                t + actualH/2,
                y.map((yi, i) => yi - actualH/2 * k2[i] + actualH * k3[i])
            );

            const k5 = equation.f(
                t + 3*actualH/4,
                y.map((yi, i) => yi + 3*actualH/16 * k1[i] + 9*actualH/16 * k4[i])
            );

            const k6 = equation.f(
                t + actualH,
                y.map((yi, i) => 
                    yi - 3*actualH/7 * k1[i] + 2*actualH/7 * k2[i] +
                    12*actualH/7 * k3[i] - 12*actualH/7 * k4[i] + 8*actualH/7 * k5[i]
                )
            );

            y = y.map((yi, i) => 
                yi + actualH * (
                    7/90 * k1[i] +
                    32/90 * k3[i] +
                    12/90 * k4[i] +
                    32/90 * k5[i] +
                    7/90 * k6[i]
                )
            );
            
            t += actualH;
            result.push([t, [...y]]);
        }

        return result;
    }
}