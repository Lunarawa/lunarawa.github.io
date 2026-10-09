// This script is MEANT to be within my personal project.
// Do not take this as a proof for anything.
// Seriously, why? It does not affect you anyways...
// Just leave it as is bro...


let cellSize = 50,
    separatorSize = 10,
    font = "13px JetBrains Mono",  // hopefully
    interval = 200,  // ms
    pendingInterval = null;

const K = "a-lot-of-twos";
const RK = `${K}-record`;
const MAXSEED = 0xffffffffffffffffn;
const DIRECTIONS = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1]
];

const sqrt6 = Math.sqrt(6);

function idkHowToNameTheVariables(n){
    const v = 1000n * n * n * 20n ** n / 19n ** n;  // to be fine-tuned
    const d = v.toString().length;
    const f = 10n ** BigInt(d - 3);
    return v / f * f;
}

function getLevelState(s) {
    let r = s;
    let l = 1n;
    let c = idkHowToNameTheVariables(l);
    while (r >= c) {
        r -= c;
        l++;
        c = idkHowToNameTheVariables(l);
    }
    return {l, levelScore: r};
}

function quickRand() {
    return (BigInt(Math.floor(Math.random() * 0x100000000)) << 32n) +
            BigInt(Math.floor(Math.random() * 0x100000000));
}

function deepCopy2D(a) {
    return a.map(r => r.slice());
}

class Writer {
    b = [];
    o = 0;
    write(v, l) {
        for (let i = l - 1; i >= 0; i--) {
            if (this.o % 8 === 0) this.b.push(0);
            this.b[this.b.length - 1] |= (v >> i & 1) << (7 - this.o % 8);
            this.o++;
        }
    }
    writeByte(v) {
        this.write(v, 8);
    }
    done() {
        return new Uint8Array(this.b);
    }
}

class Reader {
    constructor(b, o) {
        this.b = b;
        this.o = o * 8;
    }
    read(l) {
        if (this.o + l > this.b.length * 8)
            throw new TypeError("Playback file did not terminate properly.");
        let v = 0;
        for (let i = 0; i < l; i++) {
            v = (v << 1) | ((this.b[Math.floor(this.o / 8)] >> (7 - this.o % 8)) & 1);
            this.o++;
        }
        return v;
    }
    readByte() {
        return this.read(8);
    }
    _0() {
        while (this.o < this.b.length * 8)
            if (this.read(1) !== 0) return false;
        return true;
    }
}

function cacheStateLoad(v) {
    if (!v || typeof v !== "object" || Array.isArray(v))
        throw new TypeError("Invalid cache game type.");
    const parseBigInt = (v, N, m = null) => {
        if (typeof v !== "string" || !/^(0|[1-9]\d*)$/.test(v))
            throw new TypeError(`Cached ${N} is invalid.`);
        const n = BigInt(v);
        if (m !== null && n > m)
            throw new RangeError(`Cached ${N} is out of range.`);
        return n;
    };
    const r = v.rows;
    const c = v.cols;
    if (!Number.isSafeInteger(r) || r < 1 || !Number.isSafeInteger(c) || c < 1)
        throw new TypeError("Invalid cache game dimension.");
    if (!Array.isArray(v.board) || v.board.length !== r * 2 ||
        v.board.some(row => !Array.isArray(row) || row.length !== c))
        throw new TypeError("Mismatched cache game dimension.");
    const b = v.board.map(r => r.map(tile => parseBigInt(tile, "tile")));
    if (!Array.isArray(v.history))
        throw new TypeError("Cached history not found. If you are thinking about removing this, sorry!");
    const h = v.history.map(e => {
        if (!Array.isArray(e) || e.length !== 2 ||
            !Array.isArray(e[0]) || e[0].length !== 2 ||
            !e[0].every(Number.isSafeInteger) ||
            e[0][0] < 0 || e[0][0] >= c ||
            e[0][1] < 0 || e[0][1] >= r ||
            !Array.isArray(e[1]) ||
            !e[1].every(d => Number.isInteger(d) && d >= 0 && d < 8))
            throw new TypeError("Cached history is invalid. Sorry!");
        return [e[0].slice(), e[1].slice()];
    });
    const m = parseBigInt(v.min, "min");
    if (m < 1n)
        throw new RangeError("Cached game property \"minimum tile value\" is out of range.");
    const s = parseBigInt(v.score, "score");
    const {l, levelScore: ls} = getLevelState(s);
    return {
        r,
        c,
        l,
        m,
        b,
        h,
        r1: parseBigInt(v.rand1, "rand1", MAXSEED),
        r2: parseBigInt(v.rand2, "rand2", MAXSEED),
        pr1: parseBigInt(v.privateRand1, "privateRand1", MAXSEED),
        pr2: parseBigInt(v.privateRand2, "privateRand2", MAXSEED),
        s,
        ls
    };
}

function cacheSave(board) {
    try {
        localStorage.setItem(K, JSON.stringify(board.cacheState));
        const msg = document.getElementById("messages");
        if (msg.textContent === "I'm sorry to inform you that games cannot be stored on this browser.")
            msg.textContent = "";
    } catch (e) {
        console.error("Could not save the game cache:", e);
        document.getElementById("messages").textContent =
            "I'm sorry to inform you that games cannot be stored on this browser.";
    }
}

function cacheLoad() {
    const c = localStorage.getItem(K);
    return c === null ? null : cacheStateLoad(JSON.parse(c));
}

function recordSave(b) {
    const st = b.cacheState;
    try {
        const p = localStorage.getItem(RK);
        let sc = 0n;
        if (p !== null) {
            try {
                sc = cacheStateLoad(JSON.parse(p)).s;
            } catch (e) {
                console.error("An error occurred while loading the stored record board state:", e);
            }
        }
        if (BigInt(st.score) <= sc) return;
        localStorage.setItem(RK, JSON.stringify(st));
    } catch (e) {
        console.error("An error occurred while saving this record:", e);
        document.getElementById("messages").textContent =
            "Your play could not be saved in your browser. Please save it as a file if you wish to save.";
    }
}

function mouseLocation(c, e) {
    const r = c.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
}

function color(n) {
    n = Number(n) - 1;
    const g = 0.45,
          h = (g * n * 120) % 360,
          o1 = 0.25,
          o2 = 0.24,
          p1 = 0.00,
          p2 = 0.10,
          s = 60 + 20 * Math.sin(o1 * n + p1),
          l = 40 + 10 * Math.sin(o2 * n + p2);
    return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
}

// I'll put more representations soon rah
function number(n) {
    if (typeof n === 'string') 
        try {n = BigInt(n.split('.')[0]);}
        catch (_) {n = 0n}
    else if (typeof n !== 'bigint') n = BigInt(Math.trunc(Number(n)));
    const p = n < 0n ? (n = -n, '-') : '';
    if (n < 1000000n) return p + n.toString();
    // arbitrary
    const e2 = ["", "C", "Dc", "Tc", "Qg", "Qi", "Ss", "Si", "Ot", "Ng"];
    const e1 = ["", "De", "V", "Tr", "Qu", "Qn", "Sx", "St", "Oc", "Nn"];
    const e0 = ["", "U", "D", "T", "Qd", "Qt", "S", "Sp", "O", "N"];
    function d3(i) {
        const c = Math.floor(i / 100);
        const d = Math.floor((i % 100) / 10);
        const u = i % 10;
        return `${e0[u]}${e1[d]}${e2[c]}`;
    }
    function f3(n) {
        if (n === 0) return 0.;
        const m = Math.floor(Math.log10(Math.abs(n)));
        const d = Math.max(0, 2 - m);
        const [w, f = ""] = n.toString().split(".");
        const sf = f.slice(0, d).replace(/0+$/, "");
        return sf ? `${w}.${sf}` : w;
    }
    function e3(S, e) {
        if (S.length <= e) return Number(S) / Math.pow(10, e);
        const t = Math.min(S.length, e + 6);
        const L = S.slice(0, t);
        const d = t - e;
        return parseFloat(`${L.slice(0, d)}.${L.slice(d)}`);
    }
    const N = n.toString();
    let k = Math.floor((N.length - 1) / 3);
    if (k < 2) return N;
    let e = 3 * k;
    let c = e3(N, e);
    if (c >= 1000) {
        k += 1;
        e = 3 * k;
        c = e3(N, e);
    }
    const f = f3(c);
    const m = k - 1;
    if (m === 1) return `${f}M`;
    if (m === 2) return `${f}B`;
    const M = m.toString();
    const g = [];
    for (let i = M.length; i > 0; i -= 3) g.push(M.slice(Math.max(0, i - 3), i));
    const S = g.map(m => {
        const n = parseInt(m);
        return n === 0 ? "Ni" : d3(n);
    }).join("");
    return `${f}${S}`;
}

class AnimationF {
    pos1;
    pos2;
    tile;
    func;
    constructor(pos1, pos2, tileVal, rateFunc = a => a) {
        this.pos1 = pos1.map(v => v * (cellSize + separatorSize) + separatorSize),
        this.pos2 = pos2.map(v => v * (cellSize + separatorSize) + separatorSize),
        this.tile = tileVal,
        this.func = rateFunc;
    }
    tileDraw(ctx, a) {
        const alpha = this.func(a);
        ctx.fillStyle = color(this.tile);
        const x = this.pos1[0] + alpha * (this.pos2[0] - this.pos1[0]);
        const y = this.pos1[1] + alpha * (this.pos2[1] - this.pos1[1])
        ctx.beginPath();
        ctx.roundRect(
            x,
            y,
            cellSize,
            cellSize,
            5
        );
        ctx.fill();
        ctx.fillStyle = "#FFF";
        ctx.fillText(number(2n ** this.tile), x + cellSize / 2, y + cellSize / 2, cellSize);
    }
}

class Board {
    #rows;
    #cols;
    #rand1;
    #rand2;
    #score;
    #lscore;
    #level;
    #cap;
    #min;
    #max;
    #board;
    #interactable;
    #dragging;
    #seq;
    #animS;
    #animF;
    #hist;
    #gameOver;
    #playback;
    #rand() {
        const a = this.#rand1;
        this.#rand1 = (a * 6364136223846793005n + (this.#rand2 | 1n)) & 0xffffffffffffffffn;
        const b = Number(((a >> 18n) ^ a) >> 27n) >>> 0;
        const c = Number(a >> 59n);
        return ((b >>> c) | b << ((-c) & 31)) >>> 0;
    }
    constructor(a = 6, b = 5,
        c = window.quickRand(),
        d = window.quickRand(), ctx = window.ctx, state = null) {  // idk lmao
        if (!Number.isInteger(a) || a < 1 || a > 256 ||
            !Number.isInteger(b) || b < 1 || b > 256)
            throw new RangeError("Provided board dimension is out of allowed range (1 to 256).");
        if (state && (!Number.isInteger(state.r) || state.r < 1 || state.r > 256 ||
            !Number.isInteger(state.c) || state.c < 1 || state.c > 256))
            throw new RangeError("Provided board dimension is out of allowed range (1 to 256).");
        this.#rows = a,
        this.#cols = b,
        this.rand1 = c,
        this.rand2 = d,
        this.#max = 6n;
        if (state) {
            this.#rows = state.r;
            this.#cols = state.c;
            this.rand1 = state.r1;
            this.rand2 = state.r2;
            this.#rand1 = state.pr1;
            this.#rand2 = state.pr2;
            this.#score = state.s;
            this.#lscore = state.ls;
            this.#level = state.l;
            this.#cap = idkHowToNameTheVariables(this.#level);
            this.#min = state.m;
            this.#board = deepCopy2D(state.b);
            this.#hist = state.h;
            this.#gameOver = !this.#playOK();
            this.#interactable = !this.#gameOver;
            this.#dragging = false;
            this.#playback = null;
            this.#seq = [];
            this.#animS = 0;
            this.#animF = 0;
            this.#updateScore();
            return;
        }
        this.#rand1 = c,
        this.#rand2 = d,
        this.#score = 0n,
        this.#lscore = 0n,
        this.#level = 1n,
        this.#cap = idkHowToNameTheVariables(this.#level),
        this.#min = 1n;
        this.#board = Array.from({length: this.#rows * 2}, () =>
            Array.from({length: this.#cols}, () => BigInt(1 + this.#rand() % 6))
        ),
        this.#dragging = !1;
        this.#seq = Array(0);
        this.#animS = 0;
        this.#animF = 0;
        this.#interactable = !1;
        this.#gravity(ctx);
        this.#gravity(ctx);
        this.#interactable = !0;
        this.#hist = [];
        this.#gameOver = false;
        this.#playback = null;
        this.#updateScore();
    }
    pointerDown(c, e) {
        if (!this.#interactable) return;
        const p = mouseLocation(c, e);
        let t;
        for (let y = 0; y < this.#rows && !t; y++)
            for (let x = 0; x < this.#cols; x++) {
                const left = x * (cellSize + separatorSize) + separatorSize;
                const top = y * (cellSize + separatorSize) + separatorSize;
                if (p[0] >= left && p[0] < left + cellSize &&
                    p[1] >= top && p[1] < top + cellSize &&
                    this.#board[y + this.#rows][x] !== 0n) {
                    t = [x, y];
                    break;
                }
            }
        if (!t) return;
        this.#dragging = !0;
        this.#seq = [t];
        this.drawSeq(c.getContext("2d"), c, e);
    }
    pointerDrag(c, e) {
        if (!this.#dragging) return;
        const p = mouseLocation(c, e);
        const r2 = (cellSize / 2) ** 2;
        let t;
        for (let y = 0; y < this.#rows && !t; y++)
            for (let x = 0; x < this.#cols; x++) {
                if (this.#board[y + this.#rows][x] === 0n) continue;
                const tx = x * (cellSize + separatorSize) + separatorSize + cellSize / 2;
                const ty = y * (cellSize + separatorSize) + separatorSize + cellSize / 2;
                if ((p[0] - tx) ** 2 + (p[1] - ty) ** 2 < r2) {
                    t = [x, y];
                    break;
                }
            }
        if (t && this.#targetOK(t)) {
            const I = this.#seq.findIndex(([x, y]) => x === t[0] && y === t[1]);
            if (I !== -1 && I === this.#seq.length - 2)
                this.#seq.pop();
            else if (I === -1)
                this.#seq.push(t);
        }
        this.drawSeq(c.getContext("2d"), c, e);
    }
    pointerUp(ctx) {
        if (!this.#dragging) return;
        this.#dragging = !1;
        if (!this.#sequenceOK()) {
            this.#resetSeq(ctx);
            return;
        }
        const D = new Map([
            ["1,0", 0],
            ["1,1", 1],
            ["0,1", 2],
            ["-1,1", 3],
            ["-1,0", 4],
            ["-1,-1", 5],
            ["0,-1", 6],
            ["1,-1", 7]
        ]);
        const dir = this.#seq.slice(1).map(([x, y], index) => {
            const [previousX, previousY] = this.#seq[index];
            return D.get(`${x - previousX},${y - previousY}`);
        });
        this.#hist.push([this.#seq[0].slice(), dir]);
        const i = this.#getSequenceTile();
        const a = [];
        const d = this.#seq.at(-1);
        for (let v of this.#seq.entries()) {
            const l = this.#board[v[1][1] + this.#rows][v[1][0]];
            a.push(new AnimationF(v[1], d, l));
            this.#board[v[1][1] + this.#rows][v[1][0]] = 0n;
        }
        this.#interactable = !1;
        const dest = this.#seq.at(-1);
        this.#seq = [];
        const animB = deepCopy2D(this.#board);
        this.#board[dest[1] + this.#rows][dest[0]] = i;
        const t = 1n << i;
        this.#tileRepUpdate();
        this.#score += t;
        this.#lscore += t;
        while (this.#lscore >= this.#cap) {
            this.#level++;
            this.#lscore -= this.#cap;
            this.#cap = idkHowToNameTheVariables(this.#level);
        }
        this.#updateScore();
        this.#draw(ctx, a, 1, animB, () => {
            this.#gravity(ctx, () => {
                while (2n * this.#min + 8n < i) {  // remove small tiles
                    this.#min += 1n;
                    for (let [yi, yv] of this.#board.entries())
                        for (let [xi, xv] of yv.entries())
                            if (xv < this.#min)
                                this.#board[yi][xi] = 0n;
                }
                this.#gravity(ctx, () => {
                    this.#gravity(ctx, () => {
                        this.#drawBoard(ctx, this.#board);
                        this.#gameOver = !this.#playOK();
                        this.#interactable = !this.#gameOver;
                        this.#tileRepUpdate();
                        cacheSave(this);
                        this.#afterMove();
                    }, false);
                });
            });
        });
    }
    #updateScore() {
        let lscore;
        let cap;
        let score;
        if (this.#lscore >= 1000000n) lscore = `${this.#lscore} (${number(this.#lscore)})`;
        else lscore = `${this.#lscore}`;
        if (this.#cap >= 1000000n) cap = `${number(this.#cap)}`;
        else cap = `${this.#cap}`;
        if (this.#score >= 1000000n) score = `${this.#score} (${number(this.#score)})`;
        else score = `${this.#score}`;
        const e = document.getElementById("score");
        const p = Number(this.#lscore * 10000n / this.#cap) / 100;
        let gp = this.#lscore;
        if (this.#dragging && this.#sequenceOK()) {
            gp += 1n << this.#getSequenceTile();
            if (gp > this.#cap)
                gp = this.#cap;
        }
        const pp = Number(gp * 10000n / this.#cap) / 100;
        const c = color(this.#level);
        e.textContent = `${lscore} / ${cap} (${score} pts, level ${this.#level})`;
        e.style.backgroundImage = `linear-gradient(${c}, ${c})`;
        e.style.backgroundSize = `${p}% 100%`;
        e.style.setProperty("--score-progress", `${p}%`);
        e.style.setProperty("--score-ghost", `${pp - p}%`);
        e.style.setProperty("--score-color", c);
    }
    get rows() {
        return this.#rows;
    }
    get cols() {
        return this.#cols;
    }
    get gameOver() {
        return this.#gameOver;
    }
    get hasHistory() {
        return this.#hist.length > 0;
    }
    get playbackActive() {
        return this.#playback !== null;
    }
    get history() {
        return this.#hist.map(([s, d]) => [s.slice(), d.slice()]);
    }
    playbackStart(h, ctx) {
        if (!Array.isArray(h))
            throw new TypeError("Playback type is invalid.");
        this.#playback = {history: h, index: 0, ctx};
        this.#interactable = false;
        this.#playbackNext();
    }
    #playbackNext() {
        if (!this.#playback) return;
        if (this.#gameOver || this.#playback.index >= this.#playback.history.length) {
            this.#finishPlayback();
            return;
        }
        const [s, d] = this.#playback.history[this.#playback.index];
        this.#seq = [s.slice()];
        for (const dir of d) {
            const [dx, dy] = DIRECTIONS[dir];
            const [x, y] = this.#seq.at(-1);
            const n = [x + dx, y + dy];
            if (!this.#targetOK(n) || this.#seq.some(
                ([sx, sy]) => sx === n[0] && sy === n[1]
            )) {
                this.#seq = [];
                this.#stopPlayback("Playback stopped: invalid sequence encountered.");
                return;
            }
            this.#seq.push(n);
        }
        if (!this.#sequenceOK()) {
            this.#seq = [];
            this.#stopPlayback("Playback stopped: invalid sequence.");
            return;
        }
        this.#playback.index++;
        this.#dragging = true;
        this.pointerUp(this.#playback.ctx);
    }
    #afterMove() {
        if (this.#playback) {
            this.#interactable = false;
            if (pendingInterval !== null) {
                interval = pendingInterval;
                pendingInterval = null;
            }
            this.#playbackNext();
            return;
        }
        if (this.#gameOver) {
            if (!document.getElementById("safe-mode").checked)
                recordSave(this);
            alert("Game over!");
        }
    }
    #stopPlayback(m) {
        const ctx = this.#playback.ctx;
        this.#playback = null;
        this.#interactable = !this.#gameOver;
        this.#seq = [];
        this.#dragging = false;
        this.#tileRepUpdate();
        this.#drawBoard(ctx, this.#board);
        document.getElementById("messages").textContent = m;
        window.setPlaybackControlsLocked(false);
    }
    #finishPlayback() {
        this.#playback = null;
        this.#interactable = !this.#gameOver;
        if (this.#gameOver && !document.getElementById("safe-mode").checked)
            recordSave(this);
        this.#tileRepUpdate();
        document.getElementById("messages").textContent = "Playback ended.";
        window.setPlaybackControlsLocked(false, true);
    }
    pointerCancel(ctx) {
        if (!this.#dragging) return;
        this.#dragging = !1;
        this.#resetSeq(ctx);
    }
    pointerAdditionalDown(ctx) {
        if (!this.#dragging) return false;
        this.pointerCancel(ctx);
        return true;
    }
    #targetOK([x, y]) {
        if (!this.#seq.length) return false;
        const tile = this.#board[y + this.#rows][x];
        if (tile === 0n) return false;
        const I = this.#seq.findIndex(([vx, vy]) => vx === x && vy === y);
        if (I !== -1)
            return I === this.#seq.length - 1 || I === this.#seq.length - 2;
        return this.#transistionOK(
            this.#seq.at(-1),
            [x, y],
            this.#seq.length === 1
        );
    }
    #sequenceOK() {
        if (this.#seq.length < 2) return false;
        for (let i = 1; i < this.#seq.length; i++)
            if (!this.#transistionOK(this.#seq[i - 1], this.#seq[i], i === 1))
                return false;
        return true;
    }
    #getSequenceTile() {
        let sum = 0n;
        for (const [x, y] of this.#seq)
            sum += 1n << this.#board[y + this.#rows][x];
        return BigInt((sum - 1n).toString(2).length);
    }
    #tileRepUpdate() {
        const s = document.getElementById("tile-current-tile-stripe");
        const r = document.getElementById("tile-current-tile-representation");
        if (this.#gameOver) {
            r.textContent = "GAME OVER";
            r.style.color = "red";
            s.style.backgroundColor = "transparent";
            return;
        }
        r.style.color = "#fff";
        if (this.#seq.length < 2) {
            r.textContent = "";
            s.style.backgroundColor = "transparent";
            return;
        }
        const t = this.#getSequenceTile();
        r.textContent = number(2n ** t);
        s.style.backgroundColor = color(t);
    }
    #transistionOK([x1, y1], [x2, y2], mustMatch) {
        if (Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) > 1)
            return false;
        const previousTile = this.#board[y1 + this.#rows][x1];
        const tile = this.#board[y2 + this.#rows][x2];
        return tile === previousTile ||
            (!mustMatch && tile === previousTile + 1n);
    }
    drawSeq(ctx, c, e) {
        this.#tileRepUpdate();
        this.#updateScore();
        cancelAnimationFrame(this.#animF);
        this.#animF = 0;
        this.#animS = 0;
        const p = c && e ? mouseLocation(c, e) : null;
        this.#animF = requestAnimationFrame(() => {
            this.#drawBoard(ctx, this.#board, () => {
                if (!this.#seq.length) return;
                function center([x, y]) {
                    return [
                        x * (cellSize + separatorSize) + separatorSize + cellSize / 2,
                        y * (cellSize + separatorSize) + separatorSize + cellSize / 2
                    ];
                }
                ctx.beginPath();
                const [x1, y1] = center(this.#seq[0]);
                ctx.moveTo(x1, y1);
                for (const pos of this.#seq.slice(1)) {
                    const [x2, y2] = center(pos);
                    ctx.lineTo(x2, y2);
                }
                if (p) ctx.lineTo(p[0], p[1]);
                ctx.lineCap = "round";
                ctx.lineJoin = "miter";
                ctx.miterLimit = 1;
                ctx.stroke();
            });
            this.#animF = 0;
        });
    }
    #drawBoard(ctx, board, drawU = null) {
        const width = (cellSize + separatorSize) * this.#cols + separatorSize;
        const height = (cellSize + separatorSize) * this.#rows + separatorSize;
        ctx.fillStyle = "#a7692a";
        ctx.beginPath();
        ctx.roundRect(0, 0, width, height, 5);
        ctx.fill();
        if (drawU) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(0, 0, width, height, 5);
            ctx.clip();
            drawU();
            ctx.restore();
        }
        for (const [y, row] of board.slice(this.#rows).entries())
            for (const [x, tile] of row.entries()) {
                const tx = x * (cellSize + separatorSize) + separatorSize;
                const ty = y * (cellSize + separatorSize) + separatorSize;
                ctx.beginPath();
                if (tile === 0n) {
                    ctx.fillStyle = "#6e451c";
                    ctx.roundRect(tx, ty, cellSize, cellSize, 5);
                    ctx.fill();
                    continue;
                }
                ctx.fillStyle = color(tile);
                ctx.roundRect(tx, ty, cellSize, cellSize, 5);
                ctx.fill();
                ctx.fillStyle = "#FFF";
                ctx.fillText(number(2n ** tile), tx + cellSize / 2, ty + cellSize / 2, cellSize);
            }
    }
    #resetSeq(ctx) {
        this.#seq = [];
        this.drawSeq(ctx);
    }
    #playOK() {
        const b = this.#board.slice(this.#rows);
        for (let y = 0; y < this.#rows; y++)
            for (let x = 0; x < this.#cols; x++) {
                const t = b[y][x];
                if (t === 0n) continue;
                for (let dy = -1; dy <= 1; dy++)
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < this.#cols &&
                            ny >= 0 && ny < this.#rows &&
                            b[ny][nx] === t)
                            return true;
                    }
            }
        return false;
    }
    #gravity(ctx, yay = () => {}, a = true) {
        const board = Array.from({length: this.#rows * 2}, () => Array(this.#cols).fill(0n));
        const anims = [];
        const dests = [];
        let moved = false;
        for (let x = 0; x < this.#cols; x++) {
            const tiles = [];
            for (let y = 0; y < this.#rows * 2; y++)
                if (this.#board[y][x] !== 0n)
                    tiles.push([y, this.#board[y][x]]);
            const y1 = this.#rows * 2 - tiles.length;
            for (let i = 0; i < tiles.length; i++) {
                const [yf, tile] = tiles[i];
                const yt = y1 + i;
                board[yt][x] = tile;
                if (yf !== yt) {
                    moved = true;
                    dests.push([yt, x]);
                    anims.push(new AnimationF([x, yf - this.#rows], [x, yt - this.#rows], tile, t => t * t));
                }
            }
            for (let y = 0; y < y1; y++)
                board[y][x] = this.#min + BigInt(this.#rand() % 6);
        }
        this.#board = board;
        if (!moved || !a) {
            yay();
            return;
        }
        const animB = deepCopy2D(board);
        for (const [y, x] of dests) animB[y][x] = 0n;
        this.#draw(ctx, anims, 2, animB, yay);
    }
    #draw(ctx, A, m = 1, animB = this.#board, yay = () => {}) {
        cancelAnimationFrame(this.#animF);
        this.#animS = 0;
        const frame = timestamp => {
            if (!this.#animS) this.#animS = timestamp;
            const alpha = (timestamp - this.#animS) / interval * m;
            if (alpha >= 1) {
                this.#drawBoard(ctx, this.#board);
                this.#animS = 0;
                this.#animF = 0;
                yay();
                return;
            }
            this.#drawBoard(ctx, animB);
            for (const a of A) a.tileDraw(ctx, alpha);
            this.#animF = requestAnimationFrame(frame);
        };
        this.#animF = requestAnimationFrame(frame);
    }
    get cacheState() {
        return {
            rows: this.#rows,
            cols: this.#cols,
            rand1: this.rand1.toString(),
            rand2: this.rand2.toString(),
            privateRand1: this.#rand1.toString(),
            privateRand2: this.#rand2.toString(),
            score: this.#score.toString(),
            min: this.#min.toString(),
            board: this.#board.map(row => row.map(tile => tile.toString())),
            history: this.#hist
        };
    }
    createFile() {
        if (this.#rows > 256 || this.#cols > 256)
            throw new RangeError("Board dimensions cannot exceed 256.");
        if (this.rand1 > MAXSEED || this.rand2 > MAXSEED)
            throw new RangeError("The initial seeds do not fit in the playback file format.");
        const w = new Writer();
        for (const [x, y] of this.#hist) {
            w.write(1, 1);
            w.writeByte(x[0]);
            w.writeByte(x[1]);
            for (const d of y) {
                w.write(1, 1);
                w.write(d, 3);
            }
            w.write(0, 1);
        }
        w.write(0, 1);
        const bitstream = w.done();
        const b = new Uint8Array(21 + bitstream.length);
        b.set([0x67, 0x30, 0x3b, this.#cols - 1, this.#rows - 1]);
        const writeSeed = (seed, offset) => {
            for (let i = 7; i >= 0; i--)
                b[offset + 7 - i] = Number((seed >> BigInt(i * 8)) & 0xffn);
        };
        writeSeed(this.rand1, 5);
        writeSeed(this.rand2, 13);
        b.set(bitstream, 21);
        return new Blob([b], {type: "application/octet-stream"});
    }
    static loadFile(buffer) {
        const b = new Uint8Array(buffer);
        if (b.length < 22 ||
            b[0] !== 0x67 || b[1] !== 0x30 || b[2] !== 0x3b)
            throw new TypeError("This is not a valid playback file.");
        const c = b[3] + 1;
        const r = b[4] + 1;
        const read64At = offset => {
            let s = 0n;
            for (let i = 0; i < 8; i++)
                s = (s << 8n) | BigInt(b[offset + i]);
            return s;
        };
        const rr = new Reader(b, 21);
        const h = [];
        let e = false;
        while (rr.o < b.length * 8) {
            if (rr.read(1) === 0) {
                e = true;
                break;
            }
            const x = rr.readByte();
            const y = rr.readByte();
            if (x >= c || y >= r)
                throw new TypeError("Playback starting tile is outside the board.");
            const d = [];
            while (rr.read(1) === 1)
                d.push(rr.read(3));
            if (!d.length)
                throw new TypeError("Playback contains an empty move.");
            h.push([[x, y], d]);
        }
        if (!e || !rr._0())
            throw new TypeError("Playback file has an invalid or incomplete ending.");
        return {
            rows: r,
            cols: c,
            rand1: read64At(5),
            rand2: read64At(13),
            history: h
        };
    }
}

window.onload = () => {
    const canvas = document.getElementById('field');
    const ctx = canvas.getContext("2d");
    const safeMode = document.getElementById("safe-mode");
    try {
        safeMode.checked = localStorage.getItem(`${K}-safe-mode`) === "true";
    } catch (error) {
        console.error("Could not load Safe Mode setting:", error);
        document.getElementById("messages").textContent = "Safe Mode preference could not be loaded.";
    }
    const configureContext = () => {
        ctx.strokeStyle = "#FF0";
        ctx.lineWidth = separatorSize;
        ctx.font = font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
    };
    const setBoardSize = b => {
        canvas.width = (cellSize + separatorSize) * b.cols + separatorSize;
        canvas.height = (cellSize + separatorSize) * b.rows + separatorSize;
        configureContext();
    };

    let board;
    let cachedState;
    try {
        cachedState = cacheLoad();
        board = cachedState
            ? new Board(cachedState.rows, cachedState.cols, cachedState.rand1,
                cachedState.rand2, ctx, cachedState)
            : new Board(6, 5, quickRand(), quickRand(), ctx);
    } catch (error) {
        console.error("Could not load the cached game; starting a new board:", error);
        document.getElementById("messages").textContent =
            "The saved game could not be loaded; a new board was started.";
        board = new Board(6, 5, quickRand(), quickRand(), ctx);
    }
    window.board = board;
    setBoardSize(board);
    cacheSave(board);
    if (board.gameOver && !document.getElementById("safe-mode").checked)
        recordSave(board);
    canvas.addEventListener('pointerdown', (e) => {
        if (!e.isPrimary && board.pointerAdditionalDown(ctx)) {
            e.preventDefault();
            return;
        }
        if (!e.isPrimary || e.button !== 0) return;
        canvas.setPointerCapture(e.pointerId);
        board.pointerDown(canvas, e);
    });
    canvas.addEventListener('pointermove', (e) => {
        if (e.isPrimary) board.pointerDrag(canvas, e);
    });
    canvas.addEventListener('pointerup', (e) => {
        if (e.isPrimary) board.pointerUp(ctx);
    });
    canvas.addEventListener('pointercancel', (e) => {
        if (e.isPrimary) board.pointerCancel(ctx);
    });
    canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0 && board.pointerAdditionalDown(ctx))
            e.preventDefault();
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.getElementById("restart").addEventListener("click", () => {
        if (!confirm("Start a new game? Your current game will be replaced.")) return;
        const f = board;
        board = new Board(6, 5, quickRand(), quickRand(), ctx);
        window.board = board;
        window.importedPlayback = null;
        setBoardSize(board);
        window.setPlaybackControlsLocked(false);
        document.getElementById("messages").textContent = "";
        cacheSave(board);
        if (!safeMode.checked)
            recordSave(f);
        board.drawSeq(ctx);
    });
    document.getElementById("export").addEventListener("click", () => {
        try {
            const f = board.createFile();
            const url = URL.createObjectURL(f);
            const l = document.createElement("a");
            l.href = url;
            l.download = `${new Date().toISOString().replaceAll(":", "-")}.lwa`;
            const s = board.cacheState;
            console.info("Playback exported:", {
                fileName: l.download,
                fileSizeBytes: f.size,
                header: "g0;",
                dimensions: {rows: board.rows, cols: board.cols},
                seeds: {rand1: s.rand1, rand2: s.rand2},
                moveCount: board.history.length,
                history: board.history
            });
            l.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Could not export playback:", error);
            document.getElementById("messages").textContent = error.message;
        }
    });
    const fi = document.getElementById("import-file");
    document.getElementById("import").addEventListener("click", () => fi.click());
    fi.addEventListener("change", async () => {
        const f = fi.files[0];
        fi.value = "";
        if (!f) return;
        try {
            const i = Board.loadFile(await f.arrayBuffer());
            if (board.hasHistory &&
                !confirm("Importing this playback will overwrite the current game. Continue?"))
                return;
            board = new Board(
                i.rows, i.cols, i.rand1, i.rand2, ctx
            );
            window.board = board;
            setBoardSize(board);
            board.drawSeq(ctx);
            window.importedPlayback = i.history;
            document.getElementById("playback").disabled = false;
            document.getElementById("messages").textContent = "Playback loaded.";
            console.info("Playback loaded:", {
                fileName: f.name,
                fileSizeBytes: f.size,
                header: "g0;",
                dimensions: {rows: i.rows, cols: i.cols},
                seeds: {
                    rand1: i.rand1.toString(),
                    rand2: i.rand2.toString()
                },
                moveCount: i.history.length,
                history: i.history
            });
            cacheSave(board);
        } catch (e) {
            console.error("Could not import playback:", e);
            document.getElementById("messages").textContent = `Could not import playback: ${e.message}`;
        }
    });
    document.getElementById("playback").addEventListener("click", () => {
        if (!window.importedPlayback) return;
        document.getElementById("messages").textContent = "";
        document.getElementById("playback").disabled = true;
        window.setPlaybackControlsLocked(true);
        board.playbackStart(window.importedPlayback, ctx);
    });
    window.setPlaybackControlsLocked = (locked, playbackFinished = false) => {
        for (const id of ["restart", "export", "import", "import-file"])
            document.getElementById(id).disabled = locked;
        document.getElementById("playback").disabled =
            locked || playbackFinished || !window.importedPlayback;
    };
    const speed = document.getElementById("animation-speed");
    const speedValue = document.getElementById("animation-speed-value");
    const updateSpeed = () => {
        const requestedInterval = Math.max(1, Number(speed.value));
        if (board.playbackActive)
            pendingInterval = requestedInterval;
        else
            interval = requestedInterval;
        speedValue.textContent = `${speed.value} ms`;
    };
    speed.addEventListener("input", updateSpeed);
    safeMode.addEventListener("change", () => {
        try {
            localStorage.setItem(`${K}-safe-mode`, String(safeMode.checked));
        } catch (error) {
            console.error("Could not save Safe Mode setting:", error);
            document.getElementById("messages").textContent =
                "Safe Mode preference could not be saved.";
        }
    });
    updateSpeed();
    board.drawSeq(ctx);
}
