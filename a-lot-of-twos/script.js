let cellSize = 50,
    separatorSize = 10,
    font = "13px JetBrains Mono",  // hopefully
    interval = 200;  // ms

const sqrt6 = Math.sqrt(6);

function idkHowToNameTheVariables(n){
    const v = 1000n * n * n * 5n ** n / 4n ** n;
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

function mouseLocation(c, e) {
    const r = c.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
}

function color(n) {
    n = Number(n) - 1;
    const g = 0.618033988749895,
          h = (g * n * 120) % 360,
          o = 1.8,
          p = 0.7854,
          s = 65 + 25 * Math.sin(o * n),
          l = 45 + 15 * Math.sin(o * n + p);
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
        const s = Math.pow(10, m - 2);
        const t = Math.trunc(n / s) * s;
        const d = m > 2 ? 2 - m : 0;
        return parseFloat(t.toFixed(d));
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
    #rand() {
        const a = this.#rand1;
        this.#rand1 = (a * 6364136223846793005n + (this.#rand2 | 1n)) & 0xffffffffffffffffn;
        const b = Number(((a >> 18n) ^ a) >> 27n) >>> 0;
        const c = Number(a >> 59n);
        return ((b >>> c) | b << ((-c) & 31)) >>> 0;
    }
    constructor(a = 6, b = 5,
        c = window.quickRand(),
        d = window.quickRand(), ctx = window.ctx) {  // idk lmao
        this.#rows = a,
        this.#cols = b,
        this.rand1 = c,
        this.rand2 = d,
        this.#rand1 = c,
        this.#rand2 = d,
        this.#score = 0n,
        this.#lscore = 0n,
        this.#level = 1n,
        this.#cap = 1250n,
        this.#min = 1n,
        this.#max = 6n;
        this.#board = Array.from({length: this.#rows * 2}, () =>
            Array.from({length: this.#cols}, () => BigInt(1 + this.#rand() % 6))
        ),
        this.#dragging = !1;
        this.#seq = Array(0);
        this.#animS = 0;
        this.#animF = 0;
        this.gravity(ctx);
        this.gravity(ctx);
        this.#interactable = !0;
    }
    mouseDown(c, e) {
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
    mouseDrag(c, e) {
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
        if (!t) {
            this.drawSeq(c.getContext("2d"), c, e);
            return;
        }
        const [x, y] = t;
        const tv = this.#board[y + this.#rows][x];
        const I = this.#seq.findIndex(([vx, vy]) => vx === x && vy === y);
        if (I !== -1) {
            if (I === this.#seq.length - 2)
                this.#seq.pop();
        } else {
            const lt = this.#seq.at(-1);
            const lv = this.#board[lt[1] + this.#rows][lt[0]];
            const adjacent = Math.max(Math.abs(x - lt[0]), Math.abs(y - lt[1])) <= 1;
            if (adjacent && ((this.#seq.length === 1 && tv === lv) ||
                (this.#seq.length > 1 && (tv === lv || tv === lv + 1n))))
                this.#seq.push(t);
        }
        this.drawSeq(c.getContext("2d"), c, e);
    }
    mouseUp(ctx, e) {
        this.#dragging = !1;
        if (this.#seq.length < 2) {
            this.resetSeq(ctx);
            return;
        }
        if (this.#board[this.#seq[0][1] + this.#rows][this.#seq[0][0]] !==
            this.#board[this.#seq[1][1] + this.#rows][this.#seq[1][0]]) {
            this.resetSeq(ctx);
            return;
        }
        let t = 0n;
        const a = [];
        const d = this.#seq.at(-1);
        let l = this.#board[this.#seq[0][1] + this.#rows][this.#seq[0][0]];
        for (let v of this.#seq.entries()) {
            const q = this.#board[v[1][1] + this.#rows][v[1][0]] - l;
            if (q !== 1n && q !== 0n) {
                this.resetSeq(ctx);
                return;
            }
            l = this.#board[v[1][1] + this.#rows][v[1][0]];
            t += 1n << l;
            a.push(new AnimationF(v[1], d, l));
            this.#board[v[1][1] + this.#rows][v[1][0]] = 0n;
        }
        this.#interactable = !1;
        const i = BigInt((t - 1n).toString(2).length);
        const dest = this.#seq.at(-1);
        const animB = deepCopy2D(this.#board);
        this.#board[dest[1] + this.#rows][dest[0]] = i;
        t = 1n << i;
        this.#score += t;
        this.#lscore += t;
        while (this.#lscore >= this.#cap) {
            this.#level++;
            this.#lscore -= this.#cap;
            this.#cap = idkHowToNameTheVariables(this.#level);
        }
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
        this.draw(ctx, a, 1, animB, () => {
            this.gravity(ctx, () => {
                while (2n * this.#min + 10n < i) {
                    this.#min += 1n;
                    for (let [yi, yv] of this.#board.entries())
                        for (let [xi, xv] of yv.entries())
                            if (xv < this.#min)
                                this.#board[yi][xi] = 0n;
                }
                this.gravity(ctx, () => {
                    // fail condition check here
                    this.#interactable = !0;
                });
            });
        });
    }
    drawSeq(ctx, c, e) {
        cancelAnimationFrame(this.#animF);
        this.#animF = 0;
        this.#animS = 0;
        const p = c && e ? mouseLocation(c, e) : null;
        this.#animF = requestAnimationFrame(() => {
            this.drawBoard(ctx, this.#board, () => {
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
                const r2 = (cellSize / 2) ** 2;
                const s = p && this.#board.slice(this.#rows).some((row, y) =>
                    row.some((t, x) => {
                        if (t === 0n) return false;
                        const [tx, ty] = center([x, y]);
                        return (p[0] - tx) ** 2 + (p[1] - ty) ** 2 < r2;
                    })
                );
                if (p && !s) ctx.lineTo(p[0], p[1]);
                ctx.lineCap = "round";
                ctx.lineJoin = "miter";
                ctx.miterLimit = 1;
                ctx.stroke();
            });
            this.#animF = 0;
        });
    }
    drawBoard(ctx, board, drawU = null) {
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
    resetSeq(ctx) {
        this.#seq = [];
        this.drawSeq(ctx);
    }
    gravity(ctx, yay = () => {}) {
        const board = Array.from({length: this.#rows * 2}, () => Array(this.#cols).fill(0n));
        const anims = [];
        const dests = [];
        let moved = false;
        for (let x = 0; x < this.#cols; x++) {
            const tiles = [];
            for (let y = 0; y < this.#rows * 2; y++)
                if (this.#board[y][x] !== 0n)
                    tiles.push([y, this.#board[y][x]]);
            const firstY = this.#rows * 2 - tiles.length;
            for (let i = 0; i < tiles.length; i++) {
                const [fromY, tile] = tiles[i];
                const toY = firstY + i;
                board[toY][x] = tile;
                if (fromY !== toY) {
                    moved = true;
                    dests.push([toY, x]);
                    anims.push(new AnimationF([x, fromY - this.#rows], [x, toY - this.#rows], tile, t => t * t));
                }
            }
            for (let y = 0; y < firstY; y++)
                board[y][x] = this.#min + BigInt(this.#rand() % 6);
        }
        this.#board = board;
        if (!moved) {
            yay();
            return;
        }
        const animB = deepCopy2D(board);
        for (const [y, x] of dests) animB[y][x] = 0n;
        this.draw(ctx, anims, 2, animB, yay);
    }
    draw(ctx, A, m = 1, animB = this.#board, yay = () => {}) {
        cancelAnimationFrame(this.#animF);
        this.#animS = 0;
        const frame = timestamp => {
            if (!this.#animS) this.#animS = timestamp;
            const alpha = (timestamp - this.#animS) / interval * m;
            if (alpha >= 1) {
                this.drawBoard(ctx, this.#board);
                this.#animS = 0;
                this.#animF = 0;
                yay();
                return;
            }
            this.drawBoard(ctx, animB);
            for (const a of A) a.tileDraw(ctx, alpha);
            this.#animF = requestAnimationFrame(frame);
        };
        this.#animF = requestAnimationFrame(frame);
    }
}

window.onload = () => {
    const canvas = document.getElementById('field');
    const ctx = canvas.getContext("2d");

    ctx.strokeStyle = "#FF0";
    ctx.lineWidth = separatorSize;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    window.board = new Board();
    let board = window.board;
    canvas.addEventListener('mousedown', (e) => board.mouseDown(canvas, e));
    canvas.addEventListener('mousemove', (e) => board.mouseDrag(canvas, e));
    window.addEventListener('mouseup',   (e) => board.mouseUp  (ctx   , e));
    board.drawSeq(ctx);
}
