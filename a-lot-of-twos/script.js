let cellSize = 50,
    separatorSize = 10,
    font = "13px JetBrains Mono",  // hopefully
    interval = 200;  // ms

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
    #cap;
    #min;
    #level;
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
        this.#cap = 0n,
        this.#min = 1n;
        this.#level = 0n,
        // + a for visible board, otherwise it's hidden
        this.#board = Array.from({length: this.#rows * 2}, () => Array(this.#cols).fill(0n)),
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
        const p = mouseLocation(c, e);
        // start the drag logic here (TODO)
    }
    mouseDrag(c, e) {
        if (!this.#dragging) return;
        const p = mouseLocation(c, e);
        // select tile by dragging here (TODO)
    }
    mouseUp(ctx, e) {
        if (this.#sequence.length < 2) return;  // (TODO) remove sequence and reset board
        // the crux here (TODO)
    }
    gravity(ctx) {  // never tested
        let S = Array.from({length: this.#rows * 2}, () => Array(this.#cols).fill(0))
        for (let y of this.#board.entries())
            for (let x of y[1].entries())
                S[y[0]][x[0]] = (this.#board[y[0] + 1] !== undefined && this.#board[y[0] + 1][x[0]] === 0n) >> 0;
        if (!S.some(r => r.some(v => v))) return;
        let placeholder = deepCopy2D(this.#board);
        let anims = []
        for (let y of this.#board.entries())
            for (let x of y[1].entries())
                if (x[1]) {
                    anims.push(new AnimationF([x[0], y[0]], [x[0], y[0] + 1], x[1], t => t * t));
                    this.#board[y[0]][x[0]] = 0n;
                }
        requestAnimationFrame(T => this.draw(ctx, anims, 2, T));
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
                    if (S[y][x] === 2) anims.push(new AnimationF([x, y - this.#rows], [x, y - 1 - this.#rows], this.#board[y][x], t => t * (1 - t / 2)));
                }
            placeholder = deepCopy2D(this.#board);
            for (let y = this.#rows * 2 - 1; y >= 0; y--)
                for (let x = 0; x < this.#cols; x++) 
                    if (S[y][x]) this.#board[y][x] = 0n;
            requestAnimationFrame(T => this.draw(ctx, anims, 2, T))
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
        requestAnimationFrame(T => this.draw(ctx, A, m = 1, T));
    }
}

window.onload = () => {
    const canvas = document.getElementById('field'),
          ctx = canvas.getContext("2d");

    let board = new Board();
    canvas.addEventListener('mousedown', (e) => board.mouseDown(canvas, e));
    canvas.addEventListener('mousemove', (e) => board.mouseDrag(canvas, e));
    window.addEventListener('mouseup',   (e) => board.mouseUp  (ctx   , e));
}
