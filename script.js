/**
 * 明星三缺一 - 台灣十六張麻將核心演算法
 * (Taiwan 16-Tile Mahjong Engine)
 */

// 1. 牌型定義 (Tiles Definition)
// 萬 (1m-9m), 筒 (1p-9p), 索 (1s-9s), 風 (東南西北 1z-4z), 三元 (中發白 5z-7z), 花牌 (8z1-8z8)
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
        this.players = [[], [], [], []]; // 4位玩家的手牌 (0:玩家, 1:下家, 2:對家, 3:上家)
        this.discards = [[], [], [], []]; // 廢牌區
        this.currentTurn = 0; // 當前輪到的玩家
    }

    // -------------------------------------------------------------
    // 二、 洗牌與發牌系統 (Shuffle & Deal)
    // -------------------------------------------------------------
    
    /**
     * 洗牌 (Fisher-Yates 隨機洗牌演算法)
     */
    shuffle() {
        this.deck = [...ALL_TILES];
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    /**
     * 初始化發牌 (台灣十六張：每人16張)
     */
    deal() {
        this.shuffle();
        this.players = [[], [], [], []];
        this.discards = [[], [], [], []];

        // 每人發 16 張牌
        for (let i = 0; i < 16; i++) {
            for (let p = 0; p < 4; p++) {
                this.players[p].push(this.deck.pop());
            }
        }

        // 整理手牌 (排序)
        for (let p = 0; p < 4; p++) {
            this.sortHand(this.players[p]);
        }
    }

    /**
     * 摸牌 (Draw Tile)
     */
    drawTile(playerIndex) {
        if (this.deck.length === 0) {
            return null; // 流局 (Draw Game)
        }
        const tile = this.deck.pop();
        this.players[playerIndex].push(tile);
        return tile;
    }

    /**
     * 理牌排序 (Sort Tiles)
     */
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

    // -------------------------------------------------------------
    // 三、 吃、碰、槓 判定演算法 (Actions Detection)
    // -------------------------------------------------------------

    /**
     * 檢查是否能「碰」
     */
    canPeng(hand, targetTile) {
        const count = hand.filter(tile => tile === targetTile).length;
        return count >= 2;
    }

    /**
     * 檢查是否能「槓」(明槓/暗槓)
     */
    canGang(hand, targetTile) {
        const count = hand.filter(tile => tile === targetTile).length;
        return count === 3; // 他人打出且手上已有3張
    }

    /**
     * 檢查是否能「吃」(僅上家打出的牌可吃)
     */
    canChi(hand, targetTile) {
        const type = targetTile.slice(-1);
        const num = parseInt(targetTile[0]);

        // 字牌 (z) 不能吃
        if (type === 'z') return [];

        const validCombos = [];
        const has = (n) => hand.includes(`${n}${type}`);

        // 情況 1: [x-2, x-1, X] (例如: 打 3萬，手上有 1萬、2萬)
        if (num >= 3 && has(num - 2) && has(num - 1)) {
            validCombos.push([`${num - 2}${type}`, `${num - 1}${type}`, targetTile]);
        }
        // 情況 2: [x-1, X, x+1] (例如: 打 3萬，手上有 2萬、4萬)
        if (num >= 2 && num <= 8 && has(num - 1) && has(num + 1)) {
            validCombos.push([`${num - 1}${type}`, targetTile, `${num + 1}${type}`]);
        }
        // 情況 3: [X, x+1, x+2] (例如: 打 3萬，手上有 4萬、5萬)
        if (num <= 7 && has(num + 1) && has(num + 2)) {
            validCombos.push([targetTile, `${num + 1}${type}`, `${num + 2}${type}`]);
        }

        return validCombos; // 回傳所有可吃的組合
    }

    // -------------------------------------------------------------
    // 四、 台灣十六張麻將「胡牌」判定演算法 (Mahjong Win Check)
    // -------------------------------------------------------------

    /**
     * 檢查是否胡牌 (台灣十六張基本胡牌：5面子 + 1將牌 = 17張牌)
     */
    canWin(hand, extraTile = null) {
        const fullHand = extraTile ? [...hand, extraTile] : [...hand];
        if (fullHand.length % 3 !== 2) return false; // 十六張麻將胡牌張數必須是 17 (3n + 2)

        // 轉換牌組為統計字典，方便迴圈檢測
        const tileCounts = {};
        fullHand.forEach(tile => {
            tileCounts[tile] = (tileCounts[tile] || 0) + 1;
        });

        // 嘗試將每一種「數量 >= 2」的牌作為「將牌 (眼睛/眼牌)」，剩餘牌嘗試拆成面子
        for (const tile in tileCounts) {
            if (tileCounts[tile] >= 2) {
                // 複製一份計數器
                const tempCounts = { ...tileCounts };
                tempCounts[tile] -= 2; // 扣除眼睛/將牌

                // 檢測剩餘牌是否全由面子 (順子或刻子) 組成
                if (this.checkMelds(tempCounts)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 遞迴驗證剩餘牌是否可全數拆解為「刻子 (AAA)」或「順子 (ABC)」
     */
    checkMelds(counts) {
        // 找到第一張還有剩餘數量的牌
        const firstTile = Object.keys(counts).find(k => counts[k] > 0);
        if (!firstTile) return true; // 所有牌均已完美匹配成面子，胡牌成立！

        const count = counts[firstTile];
        const num = parseInt(firstTile[0]);
        const type = firstTile.slice(-1);

        // 嘗試 1: 拆解為「刻子 (AAA)」
        if (count >= 3) {
            counts[firstTile] -= 3;
            if (this.checkMelds(counts)) return true;
            counts[firstTile] += 3; // 回溯 (Backtrack)
        }

        // 嘗試 2: 拆解為「順子 (ABC)」 (僅數牌萬/筒/索可組成順子)
        if (type !== 'z' && num <= 7) {
            const tile2 = `${num + 1}${type}`;
            const tile3 = `${num + 2}${type}`;

            if (counts[tile2] > 0 && counts[tile3] > 0) {
                counts[firstTile]--;
                counts[tile2]--;
                counts[tile3]--;

                if (this.checkMelds(counts)) return true;

                // 回溯 (Backtrack)
                counts[firstTile]++;
                counts[tile2]++;
                counts[tile3]++;
            }
        }

        return false; // 無法完全拆解，胡牌無效
    }

    // -------------------------------------------------------------
    // 五、 基本台數計算器 (Tai Calculator Prototype)
    // -------------------------------------------------------------

    /**
     * 計算基本胡牌台數
     */
    calculateTai(hand, winningTile, isSelfDraw = false) {
        let totalTai = 0;
        const resultNotes = [];

        // 1. 莊家加台 (假設預設1台)
        // 2. 自摸加 1 台
        if (isSelfDraw) {
            totalTai += 1;
            resultNotes.push('自摸 (1台)');
        }

        // 3. 門清 (未吃/碰/槓) 加 1 台
        // 4. 平胡 / 大三元 / 四暗刻 等高階役種可在此進一步擴充...

        if (totalTai === 0) {
            totalTai = 1; // 底台算起
            resultNotes.push('底胡 (1台)');
        }

        return { totalTai, resultNotes };
    }
}

// 導出模組供前端頁面調用
export default MahjongEngine;