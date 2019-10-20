/// <reference types="node" />
import { Addr } from "./Addr";
import { ActorGroup, ActorMessage } from "./actor";
import { Worker } from 'worker_threads';
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
