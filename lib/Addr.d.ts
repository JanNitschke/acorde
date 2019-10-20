export declare class Addr {
    readonly plain: string;
    readonly actor: string | undefined;
    readonly reactor: string;
    static NONE: Addr;
    constructor(plain: string);
}
