import * as threads from './threads';
export declare const LOAD_SUMMERY_WEIGHT = 0.99;
export declare const GROUP_ADDR_PRE = "g";
export declare const REACTOR_ADDR_PRE = "r";
export declare const WORKER_FILE_PATH: string;
export { Actor, ActorMessage, ActorModule, SendMessageFunction, Handler } from './actor';
export { Addr } from './addr';
export { Orchestrator } from './orchestrator';
export { Reactor } from './reactor';
export declare namespace Validation {
    export import ThreadActorMessage = threads.ThreadActorMessage;
    export import ThreadActorResponse = threads.ThreadActorResponse;
    export import ThreadDestroyMessage = threads.ThreadDestroyMessage;
    export import ThreadMessageType = threads.ThreadMessageType;
    export import ThreadSpawnMessage = threads.ThreadSpawnMessage;
    export import ThreadSpawnedMessage = threads.ThreadSpawnedMessage;
    export import ThreadStatsMessage = threads.ThreadStatsMessage;
    export import parseThreadMessage = threads.parseThreadMessage;
    export import ThreadMessage = threads.ThreadMessage;
}
