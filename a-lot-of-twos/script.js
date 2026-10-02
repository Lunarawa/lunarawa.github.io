let cellSize = 50,
    separatorSize = 10;

function quickRand() {
    return (BigInt(Math.floor(Math.random() * 0x100000000)) << 32n) + 
            BigInt(Math.floor(Math.random() * 0x100000000));
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

class Animation {
    #pos1;
    #pos2;
    #tile;
    #func;
    constructor(pos1, pos2, tileVal, rateFunc = a => a) {
        this.#pos1 = pos1,
        this.#pos2 = pos2,
        this.#tile = tileVal,
        this.#func = rateFunc;
    }
    draw(ctx, a) {
        alpha = this.#func(a);
        
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
    #level;
    #board;
    #interactable;
    #dragging;
    #sequence;
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
    mouseUp(e) {
        if (this.#sequence.length < 2) return;  // (TODO) remove sequence and reset board
        // the crux here (TODO)
    }
}

window.onload = () => {
    const canvas = document.getElementById('field'),
          ctx = canvas.getContext("2d");

    let board = new Board();
    canvas.addEventListener('mousedown', (e) => board.mouseDown(canvas, e));
    canvas.addEventListener('mousemove', (e) => board.mouseDrag(canvas, e));
    window.addEventListener('mouseup',   (e) => board.mouseUp  (canvas, e));
}
