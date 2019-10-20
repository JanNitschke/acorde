"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Addr {
    constructor(plain) {
        this.actor = undefined;
        this.plain = plain.trim();
        const parts = plain.split('.');
        this.reactor = parts[0].trim();
        this.actor = parts[1];
        if (this.actor)
            this.actor.trim();
        Object.freeze(this);
    }
}
exports.Addr = Addr;
Addr.NONE = new Addr("");
