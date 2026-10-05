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
    n = Number(n);
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
        alpha = this.func(a);
        ctx.fillStyle = color(this.tile);
        const x = this.pos1[0] + alpha * (this.pos2[0] - this.pos1[0]);
        const y = this.pos1[1] + alpha * (this.pos2[1] - this.pos1[1])
        ctx.roundRect(
            x,
            y,
            cellSize,
            cellSize,
            5
        );
        ctx.fill();
        ctx.fillStyle = "#FFF";
        ctx.fillText(number(2n**this.tile, x, y + cellSize / 2, cellSize));
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
    #sequence;
    #animStart;
    constructor(a = 6, b = 5,
        c = window.quickRand(),
        d = window.quickRand()) {
        this.#rows = a,
        this.#cols = b,
        this.#rand1 = c,
        this.#rand2 = d,
        this.#score = 0n,
        this.#lscore = 0n,
        this.#level = 1n,
        this.#cap = 1250n,
        this.#min = 1n,
        this.#max = 6n;
        // + a for visible board, otherwise it's hidden
        this.#board = Array.from({length: this.#rows * 2}, () => Array(this.#cols).fill(BigInt(1 + this.#rand() % 6))),
        this.#interactable = !1,
        this.#dragging = !1;
        this.#sequence = Array(0);
    }
    #rand() {
        const a = this.#rand1;
        this.#rand1 = (a * 6364136223846793005n + (this.#rand2 | 1n)) & 0xffffffffffffffffn;
        const b = Number(((a >> 18n) ^ a) >> 27n) >>> 0;
        const c = Number(a >> 59n);
        return ((b >>> c) | b << ((-c) & 31)) >>> 0;
    }
    mouseDown(c, e) {
        if (!this.#interactable) return;
        // mouse location validation here (TODO)
        this.#dragging = !0;
        this.drawSeq(c.getContext("2d"), c, e);
        // start the drag logic here (TODO)
    }
    mouseDrag(c, e) {
        if (!this.#dragging) return;
        // drag logic goes here (TODO)
        this.drawSeq(c.getContext("2d"), c, e);
    }
    mouseUp(ctx, e) {
        if (this.#sequence.length < 2) {
            this.resetSeq(ctx);
            return;
        }
        if (this.#sequence[0] !== this.#sequence[1]) {
            this.resetSeq(ctx);
            return;
        }
        let t = 0n;
        const a = [];
        const d = this.#sequence.at(-1);
        let l = this.#board[this.#sequence[0][1]][this.#sequence[0][0]];
        for (let v of this.#sequence.entries()) {
            const q = this.#board[v[1][1]][v[1][0]] - l;
            if (q !== 1n && q !== 0n) {
                this.resetSeq(ctx);
                return;
            }
            t += 1n << this.#board[v[1][1]][v[1][0]];
            a.push(new AnimationF(v[1], d, this.#board[v[1][1]][v[1][0]]));
            this.#board[v[1][1]][v[1][0]] = 0n;
        }
        this.draw(ctx, a, 1);
        const i = BigInt((t - 1n).toString(2).length);
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
        this.gravity(ctx);
        while (2n * this.#min + 10n < i) {
            this.#min += 1n;
            for (let [yi, yv] of this.#board.entries())
                for (let [xi, xv] of yv.entries())
                    if (xv < this.#min)
                        this.#board[yi][xi] = 0n;
        }
        this.gravity(ctx);
    }
    drawSeq(ctx, c, e) {
        const p = mouseLocation(c, e);
        requestAnimationFrame(() => {
            ctx.fillStyle = "#a7692a";
            ctx.fillRect(
                0, 0,
                (cellSize + separatorSize) * this.#cols + separatorSize,
                (cellSize + separatorSize) * this.#rows + separatorSize
            );
            if (this.#sequence.length) {
                function center ([x, y]) { 
                    return [
                        x * (cellSize + separatorSize) + separatorSize + cellSize / 2,
                        y * (cellSize + separatorSize) + separatorSize + cellSize / 2
                    ];
                }
                ctx.beginPath();
                const [x1, y1] = center(this.#sequence[0]);
                ctx.moveTo(x1, y1);
                for (const pos of this.#sequence.slice(1)) {
                    const [x2, y2] = center(pos);
                    ctx.lineTo(x2, y2);
                }
                const r2 = (cellSize / 2) ** 2;
                const s = this.#board.slice(this.#cols).some((row, y) =>
                    row.some((t, x) => {
                        if (t === 0n) return false;
                        const [tx, ty] = center([x, y]);
                        return (p[0] - tx) ** 2 + (p[1] - ty) ** 2 < r2;
                    })
                );
                if (!s) ctx.lineTo(p[0], p[1]);
                ctx.stroke();
            }
            // refactoring later
            for (const [y, r] of this.#board.slice(this.#cols).entries())
                for (const [x, t] of r.entries()) {
                    if (t === 0n) continue;
                    const tx = x * (cellSize + separatorSize) + separatorSize;
                    const ty = y * (cellSize + separatorSize) + separatorSize;
                    ctx.fillStyle = color(t);
                    ctx.roundRect(tx, ty, cellSize, cellSize, 5);
                    ctx.fill();
                    ctx.fillStyle = "#FFF";
                    ctx.fillText(number(2n ** t), tx + cellSize / 2, ty + cellSize / 2, cellSize);
                }
            ctx.restore();
        });
    }
    resetSeq(ctx) {
        this.#sequence = [];
        this.drawSeq(ctx);
    }
    gravity(ctx) {  // never tested
        let S = Array.from({length: this.#rows * 2}, () => Array(this.#cols).fill(0))
        for (let y of this.#board.entries())
            for (let x of y[1].entries())
                S[y[0]][x[0]] = (y[0] < this.#rows * 2 - 1 && this.#board[y[0] + 1][x[0]] === 0n) >> 0;
        if (!S.some(r => r.some(v => v))) return;
        let placeholder = deepCopy2D(this.#board);
        let anims = []
        for (let y of this.#board.entries())
            for (let x of y[1].entries())
                if (x[1]) {
                    anims.push(new AnimationF([x[0], y[0]], [x[0], y[0] + 1], x[1], t => t * t));
                    this.#board[y[0]][x[0]] = 0n;
                }
        requestAnimationFrame(timestamp => this.draw(ctx, anims, 2, timestamp));
        while (S.some(r => r.some(v => v))) {
            this.#board = placeholder;
            anims.length = [];
            for (let y = this.#rows * 2 - 1; y >= 0; y--)
                for (let x = 0; x < this.#cols; x++) {
                    if (this.#board[y][x] !== 0n) {
                        if (y > 0) {
                            this.#board[y][x] = this.#board[y - 1][x];
                            S[y][x] = S[y - 1][x];
                            this.#board[y - 1][x] = 0n;
                            S[y - 1][x] = 0;
                        }
                    }
                    if (S[y][x] === 2) S[y][x] = 0;
                    if (S[y][x] === 1 && (y < this.#rows * 2 - 1 || this.#board[y + 1][x] !== 0n))
                        S[y][x] = 2;
                    if (S[y][x] === 1) anims.push(new AnimationF([x, y - this.#rows], [x, y + 1 - this.#rows], this.#board[y][x]));
                    if (S[y][x] === 2) anims.push(new AnimationF([x, y - this.#rows], [x, y - 1 - this.#rows], this.#board[y][x], x => x < (6 - sqrt6) / 5 ? 
                        -(7 + 2 * sqrt6) *  x      * (5 * x + sqrt6 - 6) / 45
                        :
                        -(7 + 2 * sqrt6) * (x - 1) * (5 * x + sqrt6 - 6) / 45
                    ));
                }
            placeholder = deepCopy2D(this.#board);
            for (let y = this.#rows * 2 - 1; y >= 0; y--)
                for (let x = 0; x < this.#cols; x++) 
                    if (S[y][x]) this.#board[y][x] = 0n;
            requestAnimationFrame(timestamp => this.draw(ctx, anims, 2, timestamp))
        }
        for (let x = 0; x < this.#cols; x++)
            for (let y = this.#rows - 1; y >= 0; y--)
                if (!this.#board[y][x]) this.#board[y][x] = this.#min + BigInt(this.#rand() % 6);
    }
    draw(ctx, A, m = 1, T) {
        if (!this.#animStart) this.#animStart = T;
        const t = T - this.#animStart;
        const alpha = t / interval * m
        if (alpha >= 1) return;
        ctx.fillStyle = "#a7692a"
        ctx.fillRect(0, 0,
            (cellSize + separatorSize) * this.#cols + separatorSize,
            (cellSize + separatorSize) * this.#rows + separatorSize
        )
        for (let y of this.#board.slice(this.#cols).entries())
            for (let x of y[1].entries())
                if (x[1] !== 0n) (new AnimationF([x[0], y[0]], [x[0], y[0]], x[1])).tileDraw(ctx, 0);
                else {
                    ctx.fillStyle = "#6e451c";
                    ctx.roundRect(
                        x * (cellSize + separatorSize) + separatorSize,
                        y * (cellSize + separatorSize) + separatorSize,
                        cellSize,
                        cellSize,
                        5
                    );
                    ctx.fill();
                }
        for (let a of A) a.tileDraw(ctx, alpha);
        requestAnimationFrame(timestamp => this.draw(ctx, A, m, timestamp));
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

    let board = new Board();
    canvas.addEventListener('mousedown', (e) => board.mouseDown(canvas, e));
    canvas.addEventListener('mousemove', (e) => board.mouseDrag(canvas, e));
    window.addEventListener('mouseup',   (e) => board.mouseUp  (ctx   , e));
}
