function quickRand() {
    return (BigInt(Math.floor(Math.random() * 0x100000000)) << 32n) + 
            BigInt(Math.floor(Math.random() * 0x100000000));
}

function mouseLocation(e) {
    const r = window.canvas.getBoundingClientRect();
    return {
        x: e.clientX - r.left,
        y: e.clientY - r.top
    };
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
    mouseDown(e) {
        if (!this.#interactable) return;
        // mouse location validation here (TODO)
        this.#dragging = !0;
        const p = mouseLocation(e);
        // start the drag logic here (TODO)
    }
    mouseDrag(e) {
        if (!this.#dragging) return;
        const p = mouseLocation(e);
        // select tile by dragging here (TODO)
    }
    mouseUp(e) {
        if (this.#sequence.length < 2) return;  // (TODO) remove sequence and reset board
        // the crux here (TODO)
    }
}

window.onload = () => {
    const cellSize = 50,
          separatorSize = 10,
          canvas = document.getElementById('field'),
          ctx = canvas.getContext("2d");

    let board = new Board();
    canvas.addEventListener('mousedown', (e) => board.mouseDown(e));
    canvas.addEventListener('mousemove', (e) => board.mouseDrag(e));
    window.addEventListener('mouseup',   (e) => board.mouseUp  (e));
}
