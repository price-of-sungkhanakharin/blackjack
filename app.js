/**
 * Blackjack Advisor - Bayesian Strategy Engine
 * Based on mathematical principles from probability.infarom.ro
 * 
 * Includes:
 * - Optimal Fixed Strategy
 * - High-Low Counting System (Edward Thorp)
 * - Bayesian Probability Calculations
 * - Multi-Player Support
 */

// ========================================
// Game State
// ========================================
const gameState = {
    numDecks: 1,
    numPlayers: 1,
    activePlayer: 1,
    players: {
        1: { hand: [] },
        2: { hand: [] },
        3: { hand: [] },
        4: { hand: [] },
        5: { hand: [] },
        6: { hand: [] },
        7: { hand: [] }
    },
    dealerCard: null,
    seenCards: {
        'A': 0, '2': 0, '3': 0, '4': 0, '5': 0,
        '6': 0, '7': 0, '8': 0, '9': 0, '10': 0
    },
    runningCount: 0,
    mode: 'player' // 'player' or 'dealer'
};

// ========================================
// Card Values
// ========================================
const cardValues = {
    'A': 11, '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, '8': 8, '9': 9,
    '10': 10, 'J': 10, 'Q': 10, 'K': 10
};

// High-Low Count weights
const countWeights = {
    'A': -1, '2': 1, '3': 1, '4': 1, '5': 1,
    '6': 1, '7': 0, '8': 0, '9': 0,
    '10': -1, 'J': -1, 'Q': -1, 'K': -1
};

// Player colors
const playerColors = {
    1: '#6366f1',
    2: '#10b981',
    3: '#f59e0b',
    4: '#ec4899',
    5: '#8b5cf6',
    6: '#14b8a6',
    7: '#f97316'
};

// ========================================
// Basic Strategy Tables
// ========================================

// Hard hands strategy: [player total][dealer card] -> action
// H = Hit, S = Stand, D = Double (hit if not allowed)
const hardStrategy = {
    5: { 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', A: 'H' },
    6: { 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', A: 'H' },
    7: { 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', A: 'H' },
    8: { 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', A: 'H' },
    9: { 2: 'H', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', A: 'H' },
    10: { 2: 'D', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'D', 8: 'D', 9: 'D', 10: 'H', A: 'H' },
    11: { 2: 'D', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'D', 8: 'D', 9: 'D', 10: 'D', A: 'D' },
    12: { 2: 'H', 3: 'H', 4: 'S', 5: 'S', 6: 'S', 7: 'H', 8: 'H', 9: 'H', 10: 'H', A: 'H' },
    13: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'H', 8: 'H', 9: 'H', 10: 'H', A: 'H' },
    14: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'H', 8: 'H', 9: 'H', 10: 'H', A: 'H' },
    15: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'H', 8: 'H', 9: 'H', 10: 'H', A: 'H' },
    16: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'H', 8: 'H', 9: 'H', 10: 'H', A: 'H' },
    17: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', A: 'S' },
    18: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', A: 'S' },
    19: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', A: 'S' },
    20: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', A: 'S' },
    21: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', A: 'S' }
};

// Soft hands strategy (hands with Ace counted as 11)
const softStrategy = {
    13: { 2: 'H', 3: 'H', 4: 'H', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', A: 'H' }, // A,2
    14: { 2: 'H', 3: 'H', 4: 'H', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', A: 'H' }, // A,3
    15: { 2: 'H', 3: 'H', 4: 'D', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', A: 'H' }, // A,4
    16: { 2: 'H', 3: 'H', 4: 'D', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', A: 'H' }, // A,5
    17: { 2: 'H', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'H', 8: 'H', 9: 'H', 10: 'H', A: 'H' }, // A,6
    18: { 2: 'S', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'S', 8: 'S', 9: 'H', 10: 'H', A: 'H' }, // A,7
    19: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', A: 'S' }, // A,8
    20: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', A: 'S' }, // A,9
    21: { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', A: 'S' }  // Blackjack
};

// Pair splitting strategy
// Y = Split, N = Don't split, Y/N = Split if double after split allowed
const pairStrategy = {
    'A': { 2: 'Y', 3: 'Y', 4: 'Y', 5: 'Y', 6: 'Y', 7: 'Y', 8: 'Y', 9: 'Y', 10: 'Y', A: 'Y' },
    '2': { 2: 'Y', 3: 'Y', 4: 'Y', 5: 'Y', 6: 'Y', 7: 'Y', 8: 'N', 9: 'N', 10: 'N', A: 'N' },
    '3': { 2: 'Y', 3: 'Y', 4: 'Y', 5: 'Y', 6: 'Y', 7: 'Y', 8: 'N', 9: 'N', 10: 'N', A: 'N' },
    '4': { 2: 'N', 3: 'N', 4: 'N', 5: 'Y', 6: 'Y', 7: 'N', 8: 'N', 9: 'N', 10: 'N', A: 'N' },
    '5': { 2: 'N', 3: 'N', 4: 'N', 5: 'N', 6: 'N', 7: 'N', 8: 'N', 9: 'N', 10: 'N', A: 'N' },
    '6': { 2: 'Y', 3: 'Y', 4: 'Y', 5: 'Y', 6: 'Y', 7: 'N', 8: 'N', 9: 'N', 10: 'N', A: 'N' },
    '7': { 2: 'Y', 3: 'Y', 4: 'Y', 5: 'Y', 6: 'Y', 7: 'Y', 8: 'N', 9: 'N', 10: 'N', A: 'N' },
    '8': { 2: 'Y', 3: 'Y', 4: 'Y', 5: 'Y', 6: 'Y', 7: 'Y', 8: 'Y', 9: 'Y', 10: 'Y', A: 'Y' },
    '9': { 2: 'Y', 3: 'Y', 4: 'Y', 5: 'Y', 6: 'Y', 7: 'N', 8: 'Y', 9: 'Y', 10: 'N', A: 'N' },
    '10': { 2: 'N', 3: 'N', 4: 'N', 5: 'N', 6: 'N', 7: 'N', 8: 'N', 9: 'N', 10: 'N', A: 'N' }
};

// Dealer probabilities based on up card (from the article)
const dealerProbabilities = {
    2: { 17: 0.140, 18: 0.134, 19: 0.130, 20: 0.123, 21: 0.120, bust: 0.353 },
    3: { 17: 0.131, 18: 0.130, 19: 0.123, 20: 0.122, 21: 0.118, bust: 0.376 },
    4: { 17: 0.130, 18: 0.114, 19: 0.120, 20: 0.116, 21: 0.115, bust: 0.405 },
    5: { 17: 0.119, 18: 0.123, 19: 0.117, 20: 0.106, 21: 0.107, bust: 0.428 },
    6: { 17: 0.166, 18: 0.106, 19: 0.107, 20: 0.101, 21: 0.098, bust: 0.422 },
    7: { 17: 0.369, 18: 0.138, 19: 0.078, 20: 0.079, 21: 0.074, bust: 0.262 },
    8: { 17: 0.130, 18: 0.361, 19: 0.129, 20: 0.068, 21: 0.069, bust: 0.243 },
    9: { 17: 0.120, 18: 0.105, 19: 0.357, 20: 0.122, 21: 0.061, bust: 0.235 },
    10: { 17: 0.112, 18: 0.112, 19: 0.112, 20: 0.340, 21: 0.035, bust: 0.214, bj: 0.075 },
    A: { 17: 0.131, 18: 0.131, 19: 0.131, 20: 0.131, 21: 0.051, bust: 0.117, bj: 0.308 }
};

// ========================================
// Probability Calculations
// ========================================

/**
 * Calculate probability of drawing a card with specific value
 * P(x) = [4m - n(x)] / [52m - N] for x != 10
 * P(x) = [16m - n(x)] / [52m - N] for x = 10
 */
function calculateCardProbability(cardValue) {
    const m = gameState.numDecks;
    const totalCards = 52 * m;
    const totalSeen = Object.values(gameState.seenCards).reduce((a, b) => a + b, 0);
    const remaining = totalCards - totalSeen;

    if (remaining <= 0) return 0;

    const normalizedValue = normalizeCardValue(cardValue);
    const seenOfValue = gameState.seenCards[normalizedValue] || 0;

    if (normalizedValue === '10') {
        // 10, J, Q, K are all value 10 (16 cards per deck)
        const cardsOfValue = 16 * m - seenOfValue;
        return Math.max(0, cardsOfValue / remaining);
    } else {
        // 4 cards per deck for other values
        const cardsOfValue = 4 * m - seenOfValue;
        return Math.max(0, cardsOfValue / remaining);
    }
}

/**
 * Normalize card value (J, Q, K -> 10)
 */
function normalizeCardValue(cardValue) {
    if (['J', 'Q', 'K'].includes(cardValue)) return '10';
    return cardValue;
}

/**
 * Calculate hand total and check for soft hand
 */
function calculateHandTotal(hand) {
    let total = 0;
    let aces = 0;

    for (const card of hand) {
        if (card === 'A') {
            aces++;
            total += 11;
        } else {
            total += cardValues[card];
        }
    }

    // Convert aces from 11 to 1 if needed
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }

    return {
        total,
        soft: aces > 0, // Hand has an ace counted as 11
        bust: total > 21,
        blackjack: hand.length === 2 && total === 21
    };
}

/**
 * Check if hand is a pair
 */
function isPair(hand) {
    if (hand.length !== 2) return false;
    const v1 = normalizeCardValue(hand[0]);
    const v2 = normalizeCardValue(hand[1]);
    return v1 === v2;
}

/**
 * Get running count
 */
function getRunningCount() {
    return gameState.runningCount;
}

/**
 * Get true count (running count / remaining decks)
 */
function getTrueCount() {
    const totalCards = 52 * gameState.numDecks;
    const totalSeen = Object.values(gameState.seenCards).reduce((a, b) => a + b, 0);
    const remaining = totalCards - totalSeen;
    const remainingDecks = remaining / 52;

    if (remainingDecks <= 0) return 0;
    return gameState.runningCount / remainingDecks;
}

/**
 * Get remaining cards count
 */
function getRemainingCards() {
    const totalCards = 52 * gameState.numDecks;
    const totalSeen = Object.values(gameState.seenCards).reduce((a, b) => a + b, 0);
    return totalCards - totalSeen;
}

// ========================================
// Strategy Engine
// ========================================

/**
 * Get optimal action based on basic strategy and count
 */
function getOptimalAction(playerHand, dealerCard) {
    if (playerHand.length === 0 || !dealerCard) {
        return null;
    }

    const handInfo = calculateHandTotal(playerHand);
    const dealerValue = normalizeCardValue(dealerCard);
    const trueCount = getTrueCount();
    const trueCountPercent = trueCount * 100;

    // Check for blackjack
    if (handInfo.blackjack) {
        return {
            action: 'BLACKJACK',
            reason: 'ได้ Blackjack! ชนะ 3:2 (ถ้าเจ้ามือไม่ได้ Blackjack)',
            icon: '🎰',
            className: 'blackjack'
        };
    }

    // Check for bust
    if (handInfo.bust) {
        return {
            action: 'BUST',
            reason: 'เกิน 21 แล้ว! แพ้ทันที',
            icon: '💥',
            className: 'bust'
        };
    }

    // Check for pair splitting
    if (isPair(playerHand)) {
        const pairValue = normalizeCardValue(playerHand[0]);
        const splitAction = pairStrategy[pairValue]?.[dealerValue];

        if (splitAction === 'Y') {
            // Check count-based adjustments for splitting
            const shouldSplit = shouldSplitWithCount(pairValue, dealerValue, trueCountPercent);
            if (shouldSplit) {
                return {
                    action: 'SPLIT',
                    reason: getSplitReason(pairValue, dealerValue, trueCount),
                    icon: '✂️',
                    className: 'split'
                };
            }
        }
    }

    // Check for soft hands
    if (handInfo.soft && softStrategy[handInfo.total]) {
        const action = softStrategy[handInfo.total][dealerValue];
        return formatAction(action, handInfo, dealerValue, trueCount, true, playerHand.length);
    }

    // Hard hands
    const total = Math.min(Math.max(handInfo.total, 5), 21);
    if (hardStrategy[total]) {
        const action = hardStrategy[total][dealerValue];
        return formatAction(action, handInfo, dealerValue, trueCount, false, playerHand.length);
    }

    // Default
    return {
        action: 'STAND',
        reason: 'มือสูงพอแล้ว ควรหยุด',
        icon: '🛑',
        className: 'stand'
    };
}

/**
 * Check if splitting is recommended with count
 */
function shouldSplitWithCount(pairValue, dealerValue, trueCountPercent) {
    // Basic split recommendations
    if (pairValue === 'A' || pairValue === '8') return true;
    if (pairValue === '10' || pairValue === '5') return false;

    // Count-adjusted decisions
    if (pairValue === '10' && trueCountPercent >= 5) return true;

    return pairStrategy[pairValue]?.[dealerValue] === 'Y';
}

/**
 * Get reason for split
 */
function getSplitReason(pairValue, dealerValue, trueCount) {
    const reasons = {
        'A': 'A คู่: แยกเสมอ! โอกาสได้ 21 ทั้งสองมือ',
        '8': '8 คู่: แยกเพื่อหนี 16 ซึ่งเป็นมือที่แย่ที่สุด',
        '2': '2 คู่: แยกเมื่อเจ้ามือมีไพ่อ่อน (2-7)',
        '3': '3 คู่: แยกเมื่อเจ้ามือมีไพ่อ่อน (2-7)',
        '6': '6 คู่: แยกเมื่อเจ้ามือมีไพ่อ่อน (2-6)',
        '7': '7 คู่: แยกเมื่อเจ้ามือมีไพ่อ่อน (2-7)',
        '9': '9 คู่: แยกยกเว้นเจ้ามือมี 7, 10, A',
        '4': '4 คู่: แยกเมื่อเจ้ามือมี 5 หรือ 6',
        '10': `10 คู่: True Count สูง (${trueCount.toFixed(2)}) แนะนำแยก`
    };
    return reasons[pairValue] || 'แนะนำแยกไพ่คู่';
}

/**
 * Format action result with reason
 */
function formatAction(action, handInfo, dealerValue, trueCount, isSoft, handLength) {
    const total = handInfo.total;
    const countNote = trueCount !== 0 ? ` (TC: ${trueCount.toFixed(2)})` : '';

    switch (action) {
        case 'H':
            return {
                action: 'HIT',
                reason: getHitReason(total, dealerValue, isSoft, trueCount),
                icon: '👆',
                className: 'hit'
            };
        case 'S':
            return {
                action: 'STAND',
                reason: getStandReason(total, dealerValue, isSoft, trueCount),
                icon: '🛑',
                className: 'stand'
            };
        case 'D':
            // Check if double is allowed (only on first two cards)
            if (handLength === 2) {
                return {
                    action: 'DOUBLE',
                    reason: getDoubleReason(total, dealerValue, isSoft, trueCount),
                    icon: '💰',
                    className: 'double'
                };
            } else {
                // Default to hit if double not allowed
                return {
                    action: 'HIT',
                    reason: `ควร Double แต่มีมากกว่า 2 ใบแล้ว ให้ Hit แทน${countNote}`,
                    icon: '👆',
                    className: 'hit'
                };
            }
        default:
            return {
                action: 'STAND',
                reason: 'ไม่แน่ใจ ควรหยุดเพื่อความปลอดภัย',
                icon: '🛑',
                className: 'stand'
            };
    }
}

/**
 * Get reason for Hit action
 */
function getHitReason(total, dealerValue, isSoft, trueCount) {
    const dealerNum = dealerValue === 'A' ? 11 : parseInt(dealerValue);

    if (isSoft) {
        if (total <= 17) {
            return `Soft ${total}: ไม่มีความเสี่ยง Bust จั่วเพื่อเพิ่มค่า`;
        }
        if (total === 18 && dealerNum >= 9) {
            return `Soft 18 vs ${dealerValue}: เจ้ามือมีไพ่แข็ง ควรจั่วเพิ่ม`;
        }
    }

    if (total <= 11) {
        return `${total} แต้ม: ไม่มีทาง Bust จั่วได้อย่างปลอดภัย`;
    }

    if (dealerNum >= 7 && total < 17) {
        return `${total} vs ${dealerValue}: เจ้ามือมีโอกาสได้สูง ต้องจั่วเพิ่ม`;
    }

    if (total === 12 && (dealerNum === 2 || dealerNum === 3)) {
        return `12 vs ${dealerValue}: เจ้ามือยังไม่อ่อนมาก จั่วเพื่อเพิ่มค่า`;
    }

    return `${total} แต้ม: ยังมีโอกาสได้ค่าที่ดีขึ้น`;
}

/**
 * Get reason for Stand action
 */
function getStandReason(total, dealerValue, isSoft, trueCount) {
    const dealerNum = dealerValue === 'A' ? 11 : parseInt(dealerValue);

    if (total >= 17) {
        return `${total} แต้ม: สูงพอแล้ว รอดูว่าเจ้ามือ Bust หรือไม่`;
    }

    if (dealerNum >= 2 && dealerNum <= 6) {
        const bustProb = dealerProbabilities[dealerNum]?.bust || 0;
        return `${total} vs ${dealerValue}: เจ้ามือมีโอกาส Bust ${(bustProb * 100).toFixed(1)}% รอให้เจ้ามือ Bust`;
    }

    if (isSoft && total >= 19) {
        return `Soft ${total}: สูงพอแล้ว ไม่ควรเสี่ยง`;
    }

    return `${total} แต้ม: หยุดเพื่อหลีกเลี่ยงการ Bust`;
}

/**
 * Get reason for Double action
 */
function getDoubleReason(total, dealerValue, isSoft, trueCount) {
    const dealerNum = dealerValue === 'A' ? 11 : parseInt(dealerValue);

    if (total === 11) {
        return `11 แต้ม: โอกาสได้ 21 สูงมาก Double เพื่อเพิ่มเงินเดิมพัน!`;
    }

    if (total === 10) {
        if (dealerNum <= 9) {
            return `10 vs ${dealerValue}: Expected Value เป็นบวก Double!`;
        }
    }

    if (total === 9 && dealerNum >= 3 && dealerNum <= 6) {
        return `9 vs ${dealerValue}: เจ้ามือมีไพ่อ่อน Double มีกำไร`;
    }

    if (isSoft) {
        if (dealerNum >= 4 && dealerNum <= 6) {
            return `Soft ${total} vs ${dealerValue}: เจ้ามือไพ่อ่อนมาก Double!`;
        }
    }

    return `${total} แต้ม: สถานการณ์เหมาะสม Double!`;
}

/**
 * Get betting advice based on true count
 */
function getBetAdvice(trueCount) {
    if (trueCount >= 3.6) {
        return { text: 'เพิ่มเป็น 4x', className: 'raise' };
    } else if (trueCount >= 2) {
        return { text: 'เพิ่มเป็น 2x', className: 'raise' };
    } else if (trueCount >= 1) {
        return { text: 'เพิ่มเล็กน้อย', className: 'positive' };
    } else if (trueCount <= -2) {
        return { text: 'เดิมพันต่ำ', className: 'negative' };
    }
    return { text: 'ปกติ', className: '' };
}

// ========================================
// Card Tracking
// ========================================

/**
 * Add card to seen cards and update count
 */
function trackCard(cardValue) {
    const normalized = normalizeCardValue(cardValue);
    gameState.seenCards[normalized]++;
    gameState.runningCount += countWeights[cardValue] || 0;
}

/**
 * Remove card from seen cards and update count
 */
function untrackCard(cardValue) {
    const normalized = normalizeCardValue(cardValue);
    if (gameState.seenCards[normalized] > 0) {
        gameState.seenCards[normalized]--;
        gameState.runningCount -= countWeights[cardValue] || 0;
    }
}

/**
 * Reset deck
 */
function resetDeck() {
    gameState.seenCards = {
        'A': 0, '2': 0, '3': 0, '4': 0, '5': 0,
        '6': 0, '7': 0, '8': 0, '9': 0, '10': 0
    };
    gameState.runningCount = 0;

    // Clear all player hands
    for (let i = 1; i <= 7; i++) {
        gameState.players[i].hand = [];
    }
    gameState.dealerCard = null;
    gameState.activePlayer = 1;
}

// ========================================
// Multi-Player Functions
// ========================================

/**
 * Update player count
 */
function updatePlayerCount(delta) {
    const newCount = gameState.numPlayers + delta;
    if (newCount >= 1 && newCount <= 7) {
        gameState.numPlayers = newCount;

        // Ensure active player is valid
        if (gameState.activePlayer > newCount) {
            gameState.activePlayer = newCount;
        }

        updateUI();
    }
}

/**
 * Set active player
 */
function setActivePlayer(playerNum) {
    if (playerNum >= 1 && playerNum <= gameState.numPlayers) {
        gameState.activePlayer = playerNum;
        gameState.mode = 'player';
        updateUI();
    }
}

/**
 * Get current player's hand
 */
function getCurrentPlayerHand() {
    return gameState.players[gameState.activePlayer].hand;
}

/**
 * Add card to current player
 */
function addCardToCurrentPlayer(cardValue) {
    gameState.players[gameState.activePlayer].hand.push(cardValue);
    trackCard(cardValue);
}

/**
 * Remove card from player
 */
function removePlayerCard(playerNum, cardIndex) {
    const hand = gameState.players[playerNum].hand;
    if (cardIndex >= 0 && cardIndex < hand.length) {
        const card = hand[cardIndex];
        untrackCard(card);
        hand.splice(cardIndex, 1);
        updateUI();
    }
}

/**
 * Clear player hand
 */
function clearPlayerHand(playerNum) {
    const hand = gameState.players[playerNum].hand;
    hand.forEach(card => untrackCard(card));
    gameState.players[playerNum].hand = [];
    updateUI();
}

// ========================================
// UI Functions
// ========================================

/**
 * Update UI display
 */
function updateUI() {
    updatePlayerCountDisplay();
    updatePlayersTabs();
    updatePlayersHands();
    updateDealerHandDisplay();
    updateModeToggle();
    updateStats();
    updateRecommendation();
    updateCardTracking();
    updateStrategyTableHighlight();
}

/**
 * Update player count display
 */
function updatePlayerCountDisplay() {
    document.getElementById('playerCount').textContent = gameState.numPlayers;

    // Update button states
    document.getElementById('decreasePlayer').disabled = gameState.numPlayers <= 1;
    document.getElementById('increasePlayer').disabled = gameState.numPlayers >= 7;
}

/**
 * Update players tabs
 */
function updatePlayersTabs() {
    const tabsContainer = document.getElementById('playersTabs');
    let tabsHTML = '';

    for (let i = 1; i <= gameState.numPlayers; i++) {
        const isActive = i === gameState.activePlayer;
        const hand = gameState.players[i].hand;
        const handInfo = calculateHandTotal(hand);
        const recommendation = getOptimalAction(hand, gameState.dealerCard);

        let badges = '';
        if (hand.length > 0) {
            badges += `<span class="player-total-badge">${handInfo.total}</span>`;
        }
        if (recommendation && gameState.dealerCard) {
            badges += `<span class="recommendation-badge ${recommendation.className}">${recommendation.action}</span>`;
        }

        tabsHTML += `
            <button class="player-tab ${isActive ? 'active' : ''}" data-player="${i}" onclick="setActivePlayer(${i})">
                ผู้เล่น ${i}
                ${badges}
            </button>
        `;
    }

    tabsContainer.innerHTML = tabsHTML;
}

/**
 * Update players hands display
 */
function updatePlayersHands() {
    const handsContainer = document.getElementById('playersHands');
    let handsHTML = '';

    for (let i = 1; i <= gameState.numPlayers; i++) {
        const isActive = i === gameState.activePlayer;
        const hand = gameState.players[i].hand;
        const handInfo = calculateHandTotal(hand);
        const recommendation = getOptimalAction(hand, gameState.dealerCard);

        let cardsHTML = '';
        if (hand.length === 0) {
            cardsHTML = '<div class="empty-hand">คลิกไพ่ด้านบนเพื่อเพิ่ม</div>';
        } else {
            cardsHTML = hand.map((card, index) => `
                <div class="hand-card" onclick="removePlayerCard(${i}, ${index})">
                    ${card}
                    <span class="remove-hint">×</span>
                </div>
            `).join('');
        }

        let recommendationHTML = '';
        if (recommendation && gameState.dealerCard) {
            recommendationHTML = `
                <div class="player-recommendation ${recommendation.className}">
                    ${recommendation.icon} ${recommendation.action}
                </div>
            `;
        }

        let handTypeHTML = '';
        if (handInfo.blackjack) {
            handTypeHTML = '<span style="color: var(--accent-gold)">🎰 Blackjack!</span>';
        } else if (handInfo.soft && hand.length > 0) {
            handTypeHTML = '<span style="color: var(--accent-secondary)">(Soft)</span>';
        } else if (handInfo.bust) {
            handTypeHTML = '<span style="color: var(--accent-rose)">💥 Bust!</span>';
        }

        handsHTML += `
            <div class="player-hand-section player-${i} ${isActive ? 'active' : ''}" data-player="${i}">
                <div class="player-hand-header">
                    <div class="player-hand-title">
                        <span class="player-number" style="background: ${playerColors[i]}">${i}</span>
                        ผู้เล่น ${i}
                    </div>
                    <button class="clear-btn" onclick="clearPlayerHand(${i})">ล้าง</button>
                </div>
                <div class="player-hand-cards">
                    ${cardsHTML}
                </div>
                <div class="player-hand-info">
                    <span class="player-hand-total">
                        รวม: <strong>${hand.length > 0 ? handInfo.total : 0}</strong>
                        ${handTypeHTML}
                    </span>
                    ${recommendationHTML}
                </div>
            </div>
        `;
    }

    handsContainer.innerHTML = handsHTML;
}

/**
 * Update dealer hand display
 */
function updateDealerHandDisplay() {
    const container = document.getElementById('dealerHand');

    if (!gameState.dealerCard) {
        container.innerHTML = '<div class="empty-hand">คลิกไพ่ด้านบนเพื่อเลือก</div>';
        return;
    }

    container.innerHTML = `
        <div class="hand-card" onclick="removeDealerCard()">
            ${gameState.dealerCard}
            <span class="remove-hint">×</span>
        </div>
        <div class="hand-card" style="background: linear-gradient(145deg, #374151, #1f2937); color: #9ca3af;">
            ?
        </div>
    `;
}

/**
 * Update mode toggle buttons
 */
function updateModeToggle() {
    const container = document.getElementById('modeToggle');
    let buttonsHTML = '';

    // Player buttons
    for (let i = 1; i <= gameState.numPlayers; i++) {
        const isActive = gameState.mode === 'player' && gameState.activePlayer === i;
        buttonsHTML += `
            <button class="mode-btn ${isActive ? 'active' : ''}" data-mode="player" data-player="${i}" onclick="setActivePlayer(${i})">
                👤 ผู้เล่น ${i}
            </button>
        `;
    }

    // Dealer button
    const isDealerActive = gameState.mode === 'dealer';
    buttonsHTML += `
        <button class="mode-btn ${isDealerActive ? 'active' : ''}" data-mode="dealer" onclick="setModeDealer()">
            🎩 เจ้ามือ
        </button>
    `;

    container.innerHTML = buttonsHTML;
}

/**
 * Set mode to dealer
 */
function setModeDealer() {
    gameState.mode = 'dealer';
    updateUI();
}

/**
 * Update statistics display
 */
function updateStats() {
    const runningCount = getRunningCount();
    const trueCount = getTrueCount();
    const remainingCards = getRemainingCards();
    const betAdvice = getBetAdvice(trueCount);

    document.getElementById('runningCount').textContent = runningCount >= 0 ? `+${runningCount}` : runningCount;
    document.getElementById('runningCount').className = 'stat-value ' +
        (runningCount > 0 ? 'positive' : runningCount < 0 ? 'negative' : '');

    document.getElementById('trueCount').textContent = trueCount >= 0 ? `+${trueCount.toFixed(2)}` : trueCount.toFixed(2);
    document.getElementById('trueCount').className = 'stat-value ' +
        (trueCount > 1 ? 'positive' : trueCount < -1 ? 'negative' : '');

    document.getElementById('remainingCards').textContent = remainingCards;

    document.getElementById('betAdvice').textContent = betAdvice.text;
    document.getElementById('betAdvice').className = 'stat-value ' + betAdvice.className;
}

/**
 * Update recommendation display
 */
function updateRecommendation() {
    const currentHand = getCurrentPlayerHand();
    const recommendation = getOptimalAction(currentHand, gameState.dealerCard);
    const mainDisplay = document.getElementById('mainRecommendation');
    const reasonDisplay = document.getElementById('recommendationReason');

    if (!recommendation) {
        mainDisplay.innerHTML = `
            <span class="recommendation-icon">🤔</span>
            <span class="recommendation-text">เลือกไพ่เพื่อรับคำแนะนำ</span>
        `;
        reasonDisplay.textContent = 'เพิ่มไพ่ในมือผู้เล่นและเลือกไพ่เจ้ามือเพื่อดูคำแนะนำที่เหมาะสม';
        return;
    }

    mainDisplay.innerHTML = `
        <span class="recommendation-icon">${recommendation.icon}</span>
        <span class="recommendation-text ${recommendation.className}">${recommendation.action}</span>
    `;
    reasonDisplay.innerHTML = `
        <strong>ผู้เล่น ${gameState.activePlayer}:</strong> ${recommendation.reason}
    `;
}

/**
 * Update card tracking display
 */
function updateCardTracking() {
    for (const [value, count] of Object.entries(gameState.seenCards)) {
        const element = document.getElementById(`track${value}`);
        if (element) {
            element.textContent = count;
            const maxCards = value === '10' ? 16 * gameState.numDecks : 4 * gameState.numDecks;
            element.parentElement.classList.toggle('depleted', count >= maxCards);
        }
    }
}

/**
 * Update strategy table highlight
 */
function updateStrategyTableHighlight() {
    // Remove existing highlights
    document.querySelectorAll('.strategy-table td.highlight').forEach(td => {
        td.classList.remove('highlight');
    });
}

/**
 * Remove dealer card
 */
function removeDealerCard() {
    if (gameState.dealerCard) {
        untrackCard(gameState.dealerCard);
        gameState.dealerCard = null;
        updateUI();
    }
}

/**
 * Generate strategy tables HTML
 */
function generateStrategyTables() {
    const container = document.getElementById('strategyTableContainer');

    // Hard hands table
    const hardTableHTML = generateHardTable();
    const softTableHTML = generateSoftTable();
    const pairTableHTML = generatePairTable();

    container.innerHTML = `
        <div id="hardTable" class="strategy-table-wrapper">${hardTableHTML}</div>
        <div id="softTable" class="strategy-table-wrapper" style="display:none">${softTableHTML}</div>
        <div id="splitTable" class="strategy-table-wrapper" style="display:none">${pairTableHTML}</div>
    `;
}

function generateHardTable() {
    const dealerCards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
    const playerTotals = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

    let html = '<table class="strategy-table"><thead><tr><th>มือผู้เล่น</th>';
    dealerCards.forEach(d => html += `<th>${d}</th>`);
    html += '</tr></thead><tbody>';

    playerTotals.forEach(total => {
        html += `<tr><th>${total}</th>`;
        dealerCards.forEach(dealer => {
            const action = hardStrategy[total]?.[dealer] || 'H';
            const className = action === 'H' ? 'hit' : action === 'S' ? 'stand' : 'double';
            html += `<td class="${className}">${action}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

function generateSoftTable() {
    const dealerCards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
    const playerHands = ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8', 'A,9'];
    const totals = [13, 14, 15, 16, 17, 18, 19, 20];

    let html = '<table class="strategy-table"><thead><tr><th>มือผู้เล่น</th>';
    dealerCards.forEach(d => html += `<th>${d}</th>`);
    html += '</tr></thead><tbody>';

    playerHands.forEach((hand, i) => {
        const total = totals[i];
        html += `<tr><th>${hand}</th>`;
        dealerCards.forEach(dealer => {
            const action = softStrategy[total]?.[dealer] || 'S';
            const className = action === 'H' ? 'hit' : action === 'S' ? 'stand' : 'double';
            html += `<td class="${className}">${action}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

function generatePairTable() {
    const dealerCards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
    const pairs = ['A,A', '2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10'];
    const pairValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

    let html = '<table class="strategy-table"><thead><tr><th>มือผู้เล่น</th>';
    dealerCards.forEach(d => html += `<th>${d}</th>`);
    html += '</tr></thead><tbody>';

    pairs.forEach((pair, i) => {
        const pairValue = pairValues[i];
        html += `<tr><th>${pair}</th>`;
        dealerCards.forEach(dealer => {
            const action = pairStrategy[pairValue]?.[dealer] || 'N';
            const display = action === 'Y' ? 'P' : action === 'N' ? '-' : 'P*';
            const className = action === 'Y' ? 'split' : '';
            html += `<td class="${className}">${display}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

// ========================================
// Event Listeners
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    generateStrategyTables();
    updateUI();

    // Card picker
    document.querySelectorAll('.card-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const value = btn.dataset.value;

            if (gameState.mode === 'player') {
                addCardToCurrentPlayer(value);
            } else {
                // Replace dealer card
                if (gameState.dealerCard) {
                    untrackCard(gameState.dealerCard);
                }
                gameState.dealerCard = value;
                trackCard(value);
            }

            updateUI();
        });
    });

    // Deck selection
    document.querySelectorAll('input[name="decks"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            gameState.numDecks = parseInt(e.target.value);
            resetDeck();
            updateUI();
        });
    });

    // Reset button
    document.getElementById('resetDeck').addEventListener('click', () => {
        resetDeck();
        updateUI();
    });

    // Player count buttons
    document.getElementById('increasePlayer').addEventListener('click', () => {
        updatePlayerCount(1);
    });

    document.getElementById('decreasePlayer').addEventListener('click', () => {
        updatePlayerCount(-1);
    });

    // Clear dealer button
    document.getElementById('clearDealer').addEventListener('click', () => {
        removeDealerCard();
    });

    // Strategy tabs
    document.querySelectorAll('.strategy-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.strategy-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const tabName = tab.dataset.tab;
            document.getElementById('hardTable').style.display = tabName === 'hard' ? 'block' : 'none';
            document.getElementById('softTable').style.display = tabName === 'soft' ? 'block' : 'none';
            document.getElementById('splitTable').style.display = tabName === 'split' ? 'block' : 'none';
        });
    });
});

// Make functions globally available for inline handlers
window.removePlayerCard = removePlayerCard;
window.removeDealerCard = removeDealerCard;
window.setActivePlayer = setActivePlayer;
window.setModeDealer = setModeDealer;
window.clearPlayerHand = clearPlayerHand;
