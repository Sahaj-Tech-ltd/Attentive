export function tScore(raw, mean, sd) {
    if (!sd || sd === 0) return 50;
    return Math.round(50 + 10 * ((raw - mean) / sd));
}

export function interpretTScore(t) {
    if (t < 41) return 'Very Low';
    if (t <= 59) return 'Average';
    if (t <= 64) return 'Mildly Elevated';
    if (t <= 69) return 'Moderately Elevated';
    return 'Markedly Elevated';
}

export function interpretTScoreClinical(t) {
    if (t < 41) return { level: 'Very Low', color: '#3498db', concern: 'Low' };
    if (t <= 59) return { level: 'Average', color: '#27ae60', concern: 'Low' };
    if (t <= 64) return { level: 'Mildly Atypical', color: '#f39c12', concern: 'Moderate' };
    if (t <= 69) return { level: 'Moderately Atypical', color: '#e67e22', concern: 'High' };
    return { level: 'Markedly Atypical', color: '#e74c3c', concern: 'High' };
}
