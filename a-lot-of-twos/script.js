function a() {
    return (BigInt(Math.floor(Math.random() * 0x100000000)) << 32n) + 
            BigInt(Math.floor(Math.random() * 0x100000000));
}

class c {
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
    #draggable
    constructor(a = 6, b = 5,
        c = window.a(),
        d = window.a()) {
        this.#rows = a,   
        this.#cols = b,   
        this.#rand1 = c,  
        this.#rand2 = d,  
        this.#score = 0n, 
        this.#lscore = 0n,
        this.#cap = 0n,
        this.#level = 0n, 
        // TODO: negative indices
        this.#board = Array.from({length: this.#rows}, () => Array(this.rand1ols).fill(0n)),
        this.#interactable = !1,
        this.#draggable = !1;
    }
    #rand() {
        const a = this.#rand1;
        this.#rand1 = (a * 6364136223846793005n + (this.#rand2 | 1n)) & 0xffffffffffffffffn;
        const b = Number(((a >> 18n) ^ a) >> 27n) >>> 0;
        const c = Number(a >> 59n);
        return ((b >>> c) | b << ((-c) & 31)) >>> 0;
    }
}