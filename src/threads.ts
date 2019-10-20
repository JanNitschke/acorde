import { Addr } from "./Addr";
import { ActorMessage } from "./actor";

/*P""MM""YMM `7MM                                        `7MM  `7MMM.     ,MMF'                                                             
P'   MM   `7   MM                                          MM    MMMb    dPMM                                                               
     MM        MMpMMMb.  `7Mb,od8  .gP"Ya   ,6"Yb.    ,M""bMM    M YM   ,M MM   .gP"Ya  ,pP"Ybd ,pP"Ybd  ,6"Yb.   .P"Ybmmm  .gP"Ya  ,pP"Ybd 
     MM        MM    MM    MM' "' ,M'   Yb 8)   MM  ,AP    MM    M  Mb  M' MM  ,M'   Yb 8I   `" 8I   `" 8)   MM  :MI  I8   ,M'   Yb 8I   `" 
     MM        MM    MM    MM     8M""""""  ,pm9MM  8MI    MM    M  YM.P'  MM  8M"""""" `YMMMa. `YMMMa.  ,pm9MM   WmmmP"   8M"""""" `YMMMa. 
     MM        MM    MM    MM     YM.    , 8M   MM  `Mb    MM    M  `YM'   MM  YM.    , L.   I8 L.   I8 8M   MM  8M        YM.    , L.   I8 
   .JMML.    .JMML  JMML..JMML.    `Mbmmd' `Moo9^Yo. `Wbmd"MML..JML. `'  .JMML. `Mbmmd' M9mmmP' M9mmmP' `Moo9^Yo. YMMMMMb   `Mbmmd' M9mmmP' 
                                                                                                                 6'     dP                  
                                                                                                                 Ybmmmd*/
export enum ThreadMessageType {
    Spawn,
    Spawned,
    ActorMessage,
    ActorResponse,
    Destroy,
    Stats
}

export interface ThreadMessage {
    type: ThreadMessageType;
}

export class ThreadSpawnMessage implements ThreadMessage {
    type: ThreadMessageType.Spawn = ThreadMessageType.Spawn;
    path: string;
    props: any;
    id: number;
    constructor(filePath: string, props: any, id: number) {
        this.path = filePath;
        this.props = props;
        this.id = id;
    }
}

export class ThreadSpawnedMessage implements ThreadMessage {
    type: ThreadMessageType.Spawned = ThreadMessageType.Spawned;
    addr: Addr;
    id: number;
    constructor(addr: Addr, id: number) {
        this.addr = addr;
        this.id = id;
    }
}

export class ThreadActorMessage<T> implements ThreadMessage {
    type: ThreadMessageType.ActorMessage = ThreadMessageType.ActorMessage;
    msg: ActorMessage<T>;
    id: number;
    constructor(msg: ActorMessage<T>, id: number) {
        this.msg = msg;
        this.id = id;
    }
}

export class ThreadActorResponse<T> implements ThreadMessage {
    type: ThreadMessageType.ActorResponse = ThreadMessageType.ActorResponse;
    msg: ActorMessage<T>;
    id: number;

    constructor(msg: ActorMessage<T>, id: number) {
        this.msg = msg;
        this.id = id;
    }
}

export class ThreadDestroyMessage<T> implements ThreadMessage {
    type: ThreadMessageType.Destroy = ThreadMessageType.Destroy;
    addr: Addr;
    constructor(addr: Addr) {
        this.addr = addr;
    }
}

export class ThreadStatsMessage<T> implements ThreadMessage {
    type: ThreadMessageType.Stats = ThreadMessageType.Stats;
    load: number;
    queue: number;
    actors: number;
    constructor(load: number, queue: number, actors: number) {
        this.load = load;
        this.queue = queue;
        this.actors = actors;
    }
}

export function parseThreadMessage(msg: any) {
    const type = msg.type as ThreadMessageType;
    switch (type) {
        case ThreadMessageType.Spawn:
            return new ThreadSpawnMessage(msg.path, msg.props, msg.id);

        case ThreadMessageType.Spawned:
            return new ThreadSpawnedMessage(msg.addr, msg.id);

        case ThreadMessageType.ActorMessage:
            return new ThreadActorMessage(msg.msg, msg.id);

        case ThreadMessageType.ActorResponse:
            return new ThreadActorResponse(msg.msg, msg.id);

        case ThreadMessageType.Destroy:
            return new ThreadDestroyMessage(msg.addr);

        case ThreadMessageType.Stats:
            return new ThreadStatsMessage(msg.load, msg.queue, msg.actors);

    }
}