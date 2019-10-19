/// <reference types="node" />
import { Worker, MessagePort } from 'worker_threads';
export declare class ActorMessage<T> {
    source: Addr;
    destination: Addr;
    content: T;
    returnValue?: boolean;
    error?: string;
    constructor(source: Addr, destination: Addr, content: T, returnValue?: boolean, error?: string);
}
export declare type SendMessageFunction<T> = (addr: Addr, msg: T, raw?: true) => Promise<ActorMessage<any> | any>;
export interface Handler<T> {
    handle(msg: T, sendMessage: SendMessageFunction<any>, updateStats: () => void): Promise<any>;
}
export declare class Addr {
    plain: string;
    actor: string | undefined;
    reactor: string;
    static NONE: Addr;
    constructor(plain: string);
}
export declare type ActorModule = {
    start?: (props: any) => Promise<void>;
    handle: (msg: any, sendMessage: (addr: Addr, msg: any) => Promise<any>, updateStats: () => void) => any;
    end?: () => Promise<void>;
};
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
declare class ActorGroup {
    addrs: Addr[];
    constructor(addrs: Array<Addr>);
}
export declare enum ThreadMessageType {
    Spawn = 0,
    Spawned = 1,
    ActorMessage = 2,
    ActorResponse = 3,
    Destroy = 4,
    Stats = 5
}
export interface ThreadMessage {
    type: ThreadMessageType;
}
export declare class ThreadSpawnMessage implements ThreadMessage {
    type: ThreadMessageType.Spawn;
    path: string;
    props: any;
    id: number;
    constructor(filePath: string, props: any, id: number);
}
export declare class ThreadSpawnedMessage implements ThreadMessage {
    type: ThreadMessageType.Spawned;
    addr: Addr;
    id: number;
    constructor(addr: Addr, id: number);
}
export declare class ThreadActorMessage<T> implements ThreadMessage {
    type: ThreadMessageType.ActorMessage;
    msg: ActorMessage<T>;
    id: number;
    constructor(msg: ActorMessage<T>, id: number);
}
export declare class ThreadActorResponse<T> implements ThreadMessage {
    type: ThreadMessageType.ActorResponse;
    msg: ActorMessage<T>;
    id: number;
    constructor(msg: ActorMessage<T>, id: number);
}
export declare class ThreadDestroyMessage<T> implements ThreadMessage {
    type: ThreadMessageType.Destroy;
    addr: Addr;
    constructor(addr: Addr);
}
export declare class ThreadStatsMessage<T> implements ThreadMessage {
    type: ThreadMessageType.Stats;
    load: number;
    queue: number;
    actors: number;
    constructor(load: number, queue: number, actors: number);
}
export declare function parseThreadMessage(msg: any): ThreadSpawnMessage | ThreadSpawnedMessage | ThreadActorMessage<unknown> | ThreadActorResponse<unknown> | ThreadDestroyMessage<unknown> | ThreadStatsMessage<unknown>;
export declare class Reactor {
    actors: Map<string, Actor>;
    reactorAddr: Addr;
    load: number;
    lastLoadTest: [number, number];
    lastSend: [number, number];
    lastMsgId: number;
    lastActorId: number;
    msgResolvers: Map<number, {
        resolve: (result: any) => void;
        reject: (reason: any) => void;
    }>;
    running: boolean;
    port: MessagePort;
    constructor(addr: Addr, port: MessagePort);
    updateStats(): void;
    interruptStats(): void;
    spawnActor(path: string, props: any): Promise<Addr>;
    sendMessage<T>(msg: ActorMessage<T>): Promise<ActorMessage<any>>;
    onWorkerMessage(msg: ThreadMessage): Promise<void>;
}
export declare class Orchestrator {
    lastMsgId: number;
    lastActorId: number;
    lastWorkerId: number;
    lastGroupId: number;
    msgResolvers: Map<number, {
        resolve: (result: any) => void;
        reject: (reason: any) => void;
    }>;
    actorResolvers: Map<number, (result: any) => void>;
    addr: Addr;
    reactors: Map<string, Worker>;
    actorGroups: Map<string, ActorGroup>;
    reactorLoad: Map<string, {
        load: number;
        actors: number;
        queue: number;
    }>;
    threads: number;
    private constructor();
    static create(threads: number): Promise<Orchestrator>;
    addReactor(): Promise<Addr>;
    addActor(actorFile: string, props: any, reactorAddr?: Addr): Promise<Addr>;
    addActorGroup(actorFile: string, props: any): Promise<Addr>;
    sendMessageInt(msg: ActorMessage<any>, id?: number): Promise<ActorMessage<any>>;
    sendMessage(addr: Addr | string, msg: any): Promise<any>;
    handleMessage(msg: any, workerAddr: Addr): Promise<void>;
}
export {};
