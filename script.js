/**
 * 明星三缺一 - 台灣十六張麻將核心演算法
 * (Taiwan 16-Tile Mahjong Engine) - 修正胡牌張數與判定
 */

const ALL_TILES = [
    // 萬子 (1-9萬 各4張)
    '1m','1m','1m','1m', '2m','2m','2m','2m', '3m','3m','3m','3m',
    '4m','4m','4m','4m', '5m','5m','5m','5m', '6m','6m','6m','6m',
    '7m','7m','7m','7m', '8m','8m','8m','8m', '9m','9m','9m','9m',
    // 筒子 (1-9筒 各4張)
    '1p','1p','1p','1p', '2p','2p','2p','2p', '3p','3p','3p','3p',
    '4p','4p','4p','4p', '5p','5p','5p','5p', '6p','6p','6p','6p',
    '7p','7p','7p','7p', '8p','8p','8p','8p', '9p','9p','9p','9p',
    // 索子 (1-9條 各4張)
    '1s','1s','1s','1s', '2s','2s','2s','2s', '3s','3s','3s','3s',
    '4s','4s','4s','4s', '5s','5s','5s','5s', '6s','6s','6s','6s',
    '7s','7s','7s','7s', '8s','8s','8s','8s', '9s','9s','9s','9s',
    // 字牌: 東 南 西 北 中 發 白 (各4張)
    '1z','1z','1z','1z', '2z','2z','2z','2z', '3z','3z','3z','3z', '4z','4z','4z','4z',
    '5z','5z','5z','5z', '6z','6z','6z','6z', '7z','7z','7z','7z'
];

class MahjongEngine {
    constructor() {
        this.deck = [];
        this.players = [[], [], [], []]; 
        this.discards = [[], [], [], []]; 
        this.currentTurn = 0; 
    }

    shuffle() {
        this.deck = [...ALL_TILES];
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    deal() {
        this.shuffle();
        this.players = [[], [], [], []];
        this.discards = [[], [], [], []];

        for (let i = 0; i < 16; i++) {
            for (let p = 0; p < 4; p++) {
                this.players[p].push(this.deck.pop());
            }
        }

        for (let p = 0; p < 4; p++) {
            this.sortHand(this.players[p]);
        }
    }

    drawTile(playerIndex) {
        if (this.deck.length === 0) {
            return null; 
        }
        const tile = this.deck.pop();
        this.players[playerIndex].push(tile);
        return tile;
    }

    sortHand(hand) {
        return hand.sort((a, b) => {
            const order = ['m', 'p', 's', 'z'];
            const typeA = a.slice(-1);
            const typeB = b.slice(-1);
            const numA = parseInt(a[0]);
            const numB = parseInt(b[0]);

            if (typeA !== typeB) {
                return order.indexOf(typeA) - order.indexOf(typeB);
            }
            return numA - numB;
        });
    }

    canPeng(hand, targetTile) {
        const count = hand.filter(tile => tile === targetTile).length;
        return count >= 2;
    }

    canGang(hand, targetTile) {
        const count = hand.filter(tile => tile === targetTile).length;
        return count === 3; 
    }

    canChi(hand, targetTile) {
        const type = targetTile.slice(-1);
        const num = parseInt(targetTile[0]);

        if (type === 'z') return [];

        const validCombos = [];
        const has = (n) => hand.includes(`${n}${type}`);

        if (num >= 3 && has(num - 2) && has(num - 1)) {
            validCombos.push([`${num - 2}${type}`, `${num - 1}${type}`, targetTile]);
        }
        if (num >= 2 && num <= 8 && has(num - 1) && has(num + 1)) {
            validCombos.push([`${num - 1}${type}`, targetTile, `${num + 1}${type}`]);
        }
        if (num <= 7 && has(num + 1) && has(num + 2)) {
            validCombos.push([targetTile, `${num + 1}${type}`, `${num + 2}${type}`]);
        }

        return validCombos; 
    }

    /**
     * 修正後的台灣十六張麻將胡牌判定
     * 台灣十六張含胡的那張牌總共應為 17 張 (若傳入 hand 為 16 張 + extraTile 1張 = 17張)
     */
    canWin(hand, extraTile = null) {
        const fullHand = extraTile ? [...hand, extraTile] : [...hand];
        
        // 台灣十六張標準胡牌張數為 17 張 (17 % 3 = 2)
        if (fullHand.length !== 17 && fullHand.length % 3 !== 2) {
            return false; 
        }

        const tileCounts = {};
        fullHand.forEach(tile => {
            tileCounts[tile] = (tileCounts[tile] || 0) + 1;
        });

        for (const tile in tileCounts) {
            if (tileCounts[tile] >= 2) {
                const tempCounts = { ...tileCounts };
                tempCounts[tile] -= 2; 

                if (this.checkMelds(tempCounts)) {
                    return true;
                }
            }
        }
        return false;
    }

    checkMelds(counts) {
        const firstTile = Object.keys(counts).find(k => counts[k] > 0);
        if (!firstTile) return true; 

        const count = counts[firstTile];
        const num = parseInt(firstTile[0]);
        const type = firstTile.slice(-1);

        if (count >= 3) {
            counts[firstTile] -= 3;
            if (this.checkMelds(counts)) return true;
            counts[firstTile] += 3; 
        }

        if (type !== 'z' && num <= 7) {
            const tile2 = `${num + 1}${type}`;
            const tile3 = `${num + 2}${type}`;

            if (counts[tile2] > 0 && counts[tile3] > 0) {
                counts[firstTile]--;
                counts[tile2]--;
                counts[tile3]--;

                if (this.checkMelds(counts)) return true;

                counts[firstTile]++;
                counts[tile2]++;
                counts[tile3]++;
            }
        }

        return false; 
    }

    calculateTai(hand, winningTile, isSelfDraw = false) {
        let totalTai = 0;
        const resultNotes = [];

        if (isSelfDraw) {
            totalTai += 1;
            resultNotes.push('自摸 (1台)');
        }

        if (totalTai === 0) {
            totalTai = 1; 
            resultNotes.push('底胡 (1台)');
        }

        return { totalTai, resultNotes };
    }
}

export default MahjongEngine;
