"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*P""MM""YMM `7MM                                        `7MM  `7MMM.     ,MMF'
P'   MM   `7   MM                                          MM    MMMb    dPMM
     MM        MMpMMMb.  `7Mb,od8  .gP"Ya   ,6"Yb.    ,M""bMM    M YM   ,M MM   .gP"Ya  ,pP"Ybd ,pP"Ybd  ,6"Yb.   .P"Ybmmm  .gP"Ya  ,pP"Ybd
     MM        MM    MM    MM' "' ,M'   Yb 8)   MM  ,AP    MM    M  Mb  M' MM  ,M'   Yb 8I   `" 8I   `" 8)   MM  :MI  I8   ,M'   Yb 8I   `"
     MM        MM    MM    MM     8M""""""  ,pm9MM  8MI    MM    M  YM.P'  MM  8M"""""" `YMMMa. `YMMMa.  ,pm9MM   WmmmP"   8M"""""" `YMMMa.
     MM        MM    MM    MM     YM.    , 8M   MM  `Mb    MM    M  `YM'   MM  YM.    , L.   I8 L.   I8 8M   MM  8M        YM.    , L.   I8
   .JMML.    .JMML  JMML..JMML.    `Mbmmd' `Moo9^Yo. `Wbmd"MML..JML. `'  .JMML. `Mbmmd' M9mmmP' M9mmmP' `Moo9^Yo. YMMMMMb   `Mbmmd' M9mmmP'
                                                                                                                 6'     dP
                                                                                                                 Ybmmmd*/
var ThreadMessageType;
(function (ThreadMessageType) {
    ThreadMessageType[ThreadMessageType["Spawn"] = 0] = "Spawn";
    ThreadMessageType[ThreadMessageType["Spawned"] = 1] = "Spawned";
    ThreadMessageType[ThreadMessageType["ActorMessage"] = 2] = "ActorMessage";
    ThreadMessageType[ThreadMessageType["ActorResponse"] = 3] = "ActorResponse";
    ThreadMessageType[ThreadMessageType["Destroy"] = 4] = "Destroy";
    ThreadMessageType[ThreadMessageType["Stats"] = 5] = "Stats";
})(ThreadMessageType = exports.ThreadMessageType || (exports.ThreadMessageType = {}));
class ThreadSpawnMessage {
    constructor(filePath, props, id) {
        this.type = ThreadMessageType.Spawn;
        this.path = filePath;
        this.props = props;
        this.id = id;
    }
}
exports.ThreadSpawnMessage = ThreadSpawnMessage;
class ThreadSpawnedMessage {
    constructor(addr, id) {
        this.type = ThreadMessageType.Spawned;
        this.addr = addr;
        this.id = id;
    }
}
exports.ThreadSpawnedMessage = ThreadSpawnedMessage;
class ThreadActorMessage {
    constructor(msg, id) {
        this.type = ThreadMessageType.ActorMessage;
        this.msg = msg;
        this.id = id;
    }
}
exports.ThreadActorMessage = ThreadActorMessage;
class ThreadActorResponse {
    constructor(msg, id) {
        this.type = ThreadMessageType.ActorResponse;
        this.msg = msg;
        this.id = id;
    }
}
exports.ThreadActorResponse = ThreadActorResponse;
class ThreadDestroyMessage {
    constructor(addr) {
        this.type = ThreadMessageType.Destroy;
        this.addr = addr;
    }
}
exports.ThreadDestroyMessage = ThreadDestroyMessage;
class ThreadStatsMessage {
    constructor(load, queue, actors) {
        this.type = ThreadMessageType.Stats;
        this.load = load;
        this.queue = queue;
        this.actors = actors;
    }
}
exports.ThreadStatsMessage = ThreadStatsMessage;
function parseThreadMessage(msg) {
    const type = msg.type;
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
exports.parseThreadMessage = parseThreadMessage;
