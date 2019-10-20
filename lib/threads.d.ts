import { Addr } from "./Addr";
import { ActorMessage } from "./actor";
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
