import { Worker, MessagePort } from 'worker_threads';
import * as threads from './threads';

export const LOAD_SUMMERY_WEIGHT = 0.99;
export const GROUP_ADDR_PRE = "g";
export const REACTOR_ADDR_PRE = "r";
export const WORKER_FILE_PATH = __dirname +"/worker.js";

export { Actor, ActorMessage, ActorModule, SendMessageFunction, Handler } from './actor';
export { Addr } from './addr';
export { Orchestrator } from './orchestrator';
export { Reactor } from './reactor';

export namespace Validation {
    export import ThreadActorMessage  = threads.ThreadActorMessage;
    export import ThreadActorResponse  = threads.ThreadActorResponse;
    export import ThreadDestroyMessage  = threads.ThreadDestroyMessage;
    export import ThreadMessageType  = threads.ThreadMessageType;
    export import ThreadSpawnMessage  = threads.ThreadSpawnMessage;
    export import ThreadSpawnedMessage  = threads.ThreadSpawnedMessage;
    export import ThreadStatsMessage  = threads.ThreadStatsMessage;
    export import parseThreadMessage  = threads.parseThreadMessage;
    export import ThreadMessage = threads.ThreadMessage;
}