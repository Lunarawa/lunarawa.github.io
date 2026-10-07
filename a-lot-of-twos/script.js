let cellSize = 50,
    separatorSize = 10,
    font = "13px JetBrains Mono",  // hopefully
    interval = 200;  // ms

const cacheKey = "a-lot-of-twos";
const maxSeed = 0xffffffffffffffffn;

const sqrt6 = Math.sqrt(6);

function idkHowToNameTheVariables(n){
    const v = 1000n * n * n * 10n ** n / 9n ** n;
    const d = v.toString().length;
    const f = 10n ** BigInt(d - 3);
    return v / f * f;
}

function quickRand() {
    return (BigInt(Math.floor(Math.random() * 0x100000000)) << 32n) + 
            BigInt(Math.floor(Math.random() * 0x100000000));
}

function deepCopy2D(a) {
    return a.map(r => r.slice());
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
    const l = parseBigInt(v.level, "level");
    const m = parseBigInt(v.min, "min");
    if (l < 1n || m < 1n)
        throw new RangeError("Cached game level and/or tile limit is out of range.");
    return {
        r,
        c,
        l,
        m,
        b,
        h,
        r1: parseBigInt(v.rand1, "rand1", maxSeed),
        r2: parseBigInt(v.rand2, "rand2", maxSeed),
        pr1: parseBigInt(v.privateRand1, "privateRand1", maxSeed),
        pr2: parseBigInt(v.privateRand2, "privateRand2", maxSeed),
        s: parseBigInt(v.score, "score"),
        ls: parseBigInt(v.lscore, "lscore")
    };
}

function cacheSave(board) {
    try {
        localStorage.setItem(cacheKey, JSON.stringify(board.cacheState));
        const msg = document.getElementById("messages");
        if (msg.textContent === "I'm sorry to inform you that games cannot be stored on this browser.")
            msg.textContent = "";
    } catch (e) {
        console.error("Could not save the game cache.", e);
        document.getElementById("messages").textContent =
            "I'm sorry to inform you that games cannot be stored on this browser.";
    }
}

function cacheLoad() {
    const c = localStorage.getItem(cacheKey);
    return c === null ? null : cacheStateLoad(JSON.parse(c));
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
          p2 = 0.10
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
        const validTarget = t && this.#targetOK(t);
        if (validTarget) {
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
                        cacheSave(this);
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
        document.getElementById("score").textContent = `${lscore} / ${cap} (${score} pts, level ${this.#level})`;
    }
    get rows() {
        return this.#rows;
    }
    get cols() {
        return this.#cols;
    }
    pointerCancel(ctx) {
        if (!this.#dragging) return;
        this.#dragging = !1;
        this.#resetSeq(ctx);
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
            lscore: this.#lscore.toString(),
            level: this.#level.toString(),
            min: this.#min.toString(),
            board: this.#board.map(row => row.map(tile => tile.toString())),
            history: this.#hist
        };
    }
    createFile() {
        // TODO
    }
    static loadFile() {
        // TODO
    }
}

window.onload = () => {
    const canvas = document.getElementById('field');
    const ctx = canvas.getContext("2d");
    const configureContext = () => {
        ctx.strokeStyle = "#FF0";
        ctx.lineWidth = separatorSize;
        ctx.font = font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
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
        console.error("Could not load the cached game; starting a new board.", error);
        document.getElementById("messages").textContent =
            "The saved game could not be loaded; a new board was started.";
        board = new Board(6, 5, quickRand(), quickRand(), ctx);
    }
    window.board = board;
    canvas.width = (cellSize + separatorSize) * board.cols + separatorSize;
    canvas.height = (cellSize + separatorSize) * board.rows + separatorSize;
    configureContext();
    cacheSave(board);
    canvas.addEventListener('pointerdown', (e) => {
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
    document.getElementById("restart").addEventListener("click", () => {
        if (!confirm("Start a new game? Your current game will be replaced.")) return;
        board = new Board(6, 5, quickRand(), quickRand(), ctx);
        window.board = board;
        canvas.width = (cellSize + separatorSize) * board.cols + separatorSize;
        canvas.height = (cellSize + separatorSize) * board.rows + separatorSize;
        configureContext();
        cacheSave(board);
        board.drawSeq(ctx);
    });
    board.drawSeq(ctx);
}
