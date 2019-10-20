import { Addr } from "./Addr";
import { Reactor } from "./reactor";
export declare class Actor {
    mod: ActorModule;
    reactor: Reactor;
    addr: Addr;
    isDestroyed: boolean;
    constructor(addr: Addr, reactor: Reactor, mod: ActorModule);
    start(props: any): Promise<void>;
    destroy(): Promise<void>;
    sendMessage(addr: Addr, msg: any): Promise<any>;
    sendMessage(addr: Addr, msg: any, raw: true): Promise<ActorMessage<any>>;
    onMessage(msg: ActorMessage<any>): Promise<ActorMessage<any>>;
}
export declare class ActorMessage<T> {
    readonly source: Addr;
    destination: Addr;
    readonly content: T;
    readonly returnValue?: boolean;
    readonly error?: string;
    constructor(clone: ActorMessage<any>);
    constructor(source: Addr, destination: Addr, content: T, returnValue?: boolean, error?: string);
}
export declare type SendMessageFunction<T> = (addr: Addr, msg: T, raw?: true) => Promise<ActorMessage<any> | any>;
export interface Handler<T> {
    handle(msg: T, sendMessage: SendMessageFunction<any>, updateStats: () => void): Promise<any>;
}
export declare type ActorModule = {
    start?: (props: any) => Promise<void>;
    handle: (msg: any, sendMessage: (addr: Addr, msg: any) => Promise<any>, updateStats: () => void) => any;
    end?: () => Promise<void>;
};
export declare class ActorGroup {
    addrs: Addr[];
    constructor(addrs: Array<Addr>);
}
