
export class Addr {
    readonly plain: string;
    readonly actor: string | undefined = undefined;
    readonly reactor: string;
    
    static NONE: Addr = new Addr("");

    constructor(plain: string) {
        this.plain = plain.trim();
        const parts = plain.split('.');
        this.reactor = parts[0].trim();
        this.actor = parts[1];
        if(this.actor) this.actor.trim();
        Object.freeze(this);
    }
}