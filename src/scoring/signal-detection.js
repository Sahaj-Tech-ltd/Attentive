function zScore(p) {
    if (p <= 0) p = 0.0001;
    if (p >= 1) p = 0.9999;
    const a1 = -3.969683028665376e+01;
    const a2 = 2.209460984245205e+02;
    const a3 = -2.759285104469687e+02;
    const a4 = 1.383577518672690e+02;
    const a5 = -3.066479806614716e+01;
    const a6 = 2.506628277459239e+00;
    const b1 = -5.447609879822406e+01;
    const b2 = 1.615858368580409e+02;
    const b3 = -1.556989798598866e+02;
    const b4 = 6.680131188771972e+01;
    const b5 = -1.328068155288572e+01;
    const c1 = -7.784894002430293e-03;
    const c2 = -3.223964580411365e-01;
    const c3 = -2.400758277161838e+00;
    const c4 = -2.549732539343734e+00;
    const c5 = 4.374664141464968e+00;
    const c6 = 2.938163982698783e+00;
    const d1 = 7.784695709041462e-03;
    const d2 = 3.224671290700398e-01;
    const d3 = 2.445134137142996e+00;
    const d4 = 3.754408661907416e+00;

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    let q, r;

    if (p < pLow) {
        q = Math.sqrt(-2 * Math.log(p));
        return (((((c1*q+c2)*q+c3)*q+c4)*q+c5)*q+c6) /
               ((((d1*q+d2)*q+d3)*q+d4)*q+1);
    } else if (p <= pHigh) {
        q = p - 0.5;
        r = q * q;
        return (((((a1*r+a2)*r+a3)*r+a4)*r+a5)*r+a6)*q /
               (((((b1*r+b2)*r+b3)*r+b4)*r+b5)*r+1);
    } else {
        q = Math.sqrt(-2 * Math.log(1 - p));
        return -(((((c1*q+c2)*q+c3)*q+c4)*q+c5)*q+c6) /
                ((((d1*q+d2)*q+d3)*q+d4)*q+1);
    }
}

export function dPrime(hits, misses, falseAlarms, correctRejections) {
    const signalTrials = hits + misses;
    const noiseTrials = falseAlarms + correctRejections;

    const hitRate = (hits + 0.5) / (signalTrials + 1);
    const faRate = (falseAlarms + 0.5) / (noiseTrials + 1);

    return zScore(hitRate) - zScore(faRate);
}

export function criterionC(hits, misses, falseAlarms, correctRejections) {
    const signalTrials = hits + misses;
    const noiseTrials = falseAlarms + correctRejections;

    const hitRate = (hits + 0.5) / (signalTrials + 1);
    const faRate = (falseAlarms + 0.5) / (noiseTrials + 1);

    return -0.5 * (zScore(hitRate) + zScore(faRate));
}

export function coefficientOfVariation(meanRT, sdRT) {
    if (!meanRT || meanRT === 0) return 0;
    return (sdRT / meanRT) * 100;
}

export function exGaussianFit(rtArray) {
    if (!rtArray || rtArray.length < 3) return { mu: 0, sigma: 0, tau: 0 };

    const sorted = [...rtArray].sort((a, b) => a - b);
    const n = sorted.length;
    const mean = sorted.reduce((a, b) => a + b, 0) / n;
    const variance = sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
    const sd = Math.sqrt(variance);

    const skewness = sorted.reduce((a, b) => a + ((b - mean) / sd) ** 3, 0) * n / ((n - 1) * (n - 2));

    const sigma = sd / Math.sqrt(1 + (Math.PI / 2) * skewness ** 2 || 1);
    const mu = mean - sigma * skewness * Math.sqrt(2 / Math.PI);
    const tau = Math.max(0, (sd * skewness * Math.sqrt(Math.PI / 2)) || 0);

    return { mu: Math.round(mu), sigma: Math.round(sigma), tau: Math.round(tau) };
}
