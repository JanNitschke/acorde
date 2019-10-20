/// <reference types="node" />
import { MessagePort } from 'worker_threads';
import { Actor, ActorMessage } from "./actor";
import { Addr } from "./Addr";
import { ThreadMessage } from "./threads";
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
