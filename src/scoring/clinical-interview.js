/**
 * Clinical Interview Scoring Functions
 * PHQ-4 and GAD-4 scoring utilities
 * 
 * PHQ-4: 4-item depression/anxiety screening (Q18-Q21)
 *   - Q18: Little interest or pleasure
 *   - Q19: Feeling down, depressed, or hopeless
 *   - Q20: Feeling nervous, anxious, or on edge
 *   - Q21: Not being able to stop or control worrying
 * 
 * GAD-4: 2-item anxiety screening (Q20 + Q21)
 *   - Uses same items as PHQ-4 but calculates separately
 */

/**
 * Calculate PHQ-4 total score from individual item responses
 * PHQ-4 = Q18 (interest) + Q19 (depressed) + Q20 (anxious) + Q21 (worry)
 * Each item scored 0-3
 * 
 * @param {Object} responses - { q18: 0-3, q19: 0-3, q20: 0-3, q21: 0-3 }
 * @returns {number} PHQ-4 total (0-12)
 */
export function calculatePHQ4Score(responses) {
    const { q18 = 0, q19 = 0, q20 = 0, q21 = 0 } = responses;
    
    // Validate each item is within range 0-3
    const items = [
        { name: 'q18', value: q18 },
        { name: 'q19', value: q19 },
        { name: 'q20', value: q20 },
        { name: 'q21', value: q21 }
    ];
    
    let total = 0;
    items.forEach(item => {
        const num = parseInt(item.value);
        if (!isNaN(num) && num >= 0 && num <= 3) {
            total += num;
        }
    });
    
    return total;
}

/**
 * Interpret PHQ-4 score into severity level
 * 
 * @param {number} score - PHQ-4 total (0-12)
 * @returns {string} Interpretation label
 */
export function interpretPHQ4(score) {
    const s = parseInt(score);
    if (s <= 2) return 'Minimal';
    if (s <= 5) return 'Mild';
    if (s <= 8) return 'Moderate';
    return 'Severe';
}

/**
 * Calculate GAD-4 score from anxiety items (Q20 + Q21)
 * GAD-4 = Q20 (anxious) + Q21 (worry)
 * Each item scored 0-3, so max is 6
 * 
 * @param {Object} responses - { q20: 0-3, q21: 0-3 }
 * @returns {number} GAD-4 total (0-6)
 */
export function calculateGAD4Score(responses) {
    const { q20 = 0, q21 = 0 } = responses;
    
    const q20Num = parseInt(q20);
    const q21Num = parseInt(q21);
    
    const valid20 = !isNaN(q20Num) && q20Num >= 0 && q20Num <= 3;
    const valid21 = !isNaN(q21Num) && q21Num >= 0 && q21Num <= 3;
    
    let total = 0;
    if (valid20) total += q20Num;
    if (valid21) total += q21Num;
    
    return total;
}

/**
 * Interpret GAD-4 score into severity level
 * 
 * @param {number} score - GAD-4 total (0-6)
 * @returns {string} Interpretation label
 */
export function interpretGAD4(score) {
    const s = parseInt(score);
    if (s <= 2) return 'Minimal';
    if (s <= 4) return 'Mild';
    if (s <= 6) return 'Moderate';
    return 'Severe';
}

/**
 * Calculate PHQ-4 and GAD-4 scores from raw question responses
 * 
 * @param {Object} phq4Responses - { q18, q19, q20, q21 } each 0-3
 * @returns {Object} { phq4_total, phq4_interpretation, gad4_total, gad4_interpretation }
 */
export function calculateClinicalScores(phq4Responses) {
    const phq4_total = calculatePHQ4Score(phq4Responses);
    const phq4_interpretation = interpretPHQ4(phq4_total);
    
    // GAD-4 only uses Q20 and Q21
    const gad4_total = calculateGAD4Score(phq4Responses);
    const gad4_interpretation = interpretGAD4(gad4_total);
    
    return {
        phq4_total,
        phq4_interpretation,
        gad4_total,
        gad4_interpretation
    };
}

/**
 * Validate PHQ-4 response item
 * 
 * @param {*} value - Response value
 * @returns {boolean} True if valid (0-3)
 */
export function isValidPHQ4Item(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 3;
}

/**
 * Get PHQ-4 severity color for UI display
 * 
 * @param {string} interpretation - 'Minimal', 'Mild', 'Moderate', 'Severe'
 * @returns {string} CSS color class
 */
export function getPHQ4ColorClass(interpretation) {
    const map = {
        'Minimal': 'score-minimal',
        'Mild': 'score-mild',
        'Moderate': 'score-moderate',
        'Severe': 'score-severe'
    };
    return map[interpretation] || 'score-minimal';
}

/**
 * Get GAD-4 severity color for UI display
 * 
 * @param {string} interpretation - 'Minimal', 'Mild', 'Moderate', 'Severe'
 * @returns {string} CSS color class
 */
export function getGAD4ColorClass(interpretation) {
    return getPHQ4ColorClass(interpretation); // Same severity levels
}