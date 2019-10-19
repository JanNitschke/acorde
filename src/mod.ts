import { Worker, MessagePort } from 'worker_threads';

const LOAD_SUMMERY_WEIGHT = 0.99;
const GROUP_ADDR_PRE = "g";
const REACTOR_ADDR_PRE = "r";


export class ActorMessage<T>{
    source: Addr;
    destination: Addr;
    content: T;

    constructor(source: Addr, destination: Addr, content: T) {
        this.source = source;
        this.destination = destination;
        this.content = content;
    }
}

export interface Handler<T> {
    handle(msg: T, sendMessage: (addr: Addr, msg: any) => Promise<any>, updateStats: () => void): Promise<any>;
}

export class Addr {
    plain: string;
    actor: string | undefined = undefined;
    reactor: string;
    
    static NONE: Addr = new Addr("");

    constructor(plain: string) {
        this.plain = plain.trim();
        var parts = plain.split('.');
        this.reactor = parts[0].trim();
        this.actor = parts[1];
        if(this.actor) this.actor.trim();
        Object.freeze(this);
    }
}

export type ActorModule = {
    start?: (props: any) => Promise<void>;
    handle: (msg: any, sendMessage: (addr: Addr, msg: any) => Promise<any>, updateStats: () => void) => any;
    end?: () => Promise<void>
}

export class Actor {
    mod: ActorModule;
    reactor: Reactor;
    addr: Addr;
    isDestroyed = false;

    constructor(addr: Addr, reactor: Reactor, mod: ActorModule) {
        this.addr = addr;
        this.reactor = reactor;
        this.mod = mod;
    }

    async start(props: any) {
        if(this.mod.start){
            await Promise.resolve(this.mod.start(props));
        }
    }

    async destroy() {
        if(this.mod.end){
            await Promise.resolve(this.mod.end());
        }
    }


    sendMessage(addr: Addr, msg: any): Promise<any> {
        return this.reactor.sendMessage(new ActorMessage(this.addr, addr, msg));
    }

    async onMessage(msg: ActorMessage<any>): Promise<ActorMessage<any>> {
        if (!this.isDestroyed) {
            const result = await Promise.resolve(this.mod.handle(msg.content, this.sendMessage.bind(this), this.reactor.updateStats.bind(this.reactor)));
            return new ActorMessage<any>(this.addr, msg.source, result);
        } else {
            throw new Error("Tryed to send a message to a destroyed actor");
        }
    }

}


class ActorGroup{
    addrs: Addr[];
    constructor(addrs: Array<Addr>){
        this.addrs = addrs;
    }
}

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
    var type = msg.type as ThreadMessageType;
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




/*MM"""Mq.                               mm                       
  MM   `MM.                              MM                       
  MM   ,M9   .gP"Ya   ,6"Yb.   ,p6"bo  mmMMmm   ,pW"Wq.  `7Mb,od8 
  MMmmdM9   ,M'   Yb 8)   MM  6M'  OO    MM    6W'   `Wb   MM' "' 
  MM  YM.   8M""""""  ,pm9MM  8M         MM    8M     M8   MM     
  MM   `Mb. YM.    , 8M   MM  YM.    ,   MM    YA.   ,A9   MM     
.JMML. .JMM. `Mbmmd' `Moo9^Yo. YMbmd'    `Mbmo  `Ybmd9'  .JMM*/


export class Reactor {
    actors: Map<string, Actor> = new Map();
    reactorAddr: Addr;
    load: number = 1;
    lastLoadTest = process.hrtime();
    lastSend = process.hrtime();
    lastMsgId = 1;
    lastActorId = 1;
    msgResolvers: Map<number, (result: any) => void> = new Map();
    running = true;
    port: MessagePort;

    constructor(addr: Addr, port: MessagePort) {
        this.reactorAddr = addr;
        this.port = port;
        this.updateStats();
        setInterval(() => {
            this.lastSend = process.hrtime();
            this.port.postMessage(new ThreadStatsMessage(this.load, 0, this.actors.size));
        }, 100);
    }

    updateStats() {
        if (this.running) {
            const currentTiming = process.hrtime(this.lastLoadTest);
            const currentTimingNormal = currentTiming[0] + currentTiming[1] * 0.000000001 
            this.load = LOAD_SUMMERY_WEIGHT * this.load + (1 - LOAD_SUMMERY_WEIGHT) * currentTimingNormal;
            this.lastLoadTest = process.hrtime();

            setTimeout(() => {
                this.updateStats()
            }, 1);
        }
    }

    interruptStats(){
        const currentLoad = process.hrtime(this.lastLoadTest);
        const currentTimingNormal = currentLoad[0] + currentLoad[1] * 0.000000001 
        this.load = LOAD_SUMMERY_WEIGHT * this.load + (1 - LOAD_SUMMERY_WEIGHT) * currentTimingNormal;
        if (currentLoad[0] != this.lastSend[0]) {
            this.lastSend = process.hrtime();
            this.port.postMessage(new ThreadStatsMessage(this.load, 0, this.actors.size));
        }
    }

    async spawnActor(path: string, props: any): Promise<Addr> {
        const mod = require(path) as ActorModule;
        const addr = new Addr(this.reactorAddr.reactor + "." + "a" + (++this.lastActorId));
        const spawned = new Actor(addr, this, mod);
        await spawned.start(props);
        this.actors.set(addr.actor as string, spawned);
        return addr;
    }

    async sendMessage<T>(msg: ActorMessage<T>): Promise<ActorMessage<any>> {
        const isLocal = msg.destination.reactor = this.reactorAddr.reactor;
        if (isLocal) {
            if (!msg.destination.actor) throw new Error("Recived unaddressed message");
            const actor = this.actors.get(msg.destination.actor);
            if (!actor) throw new Error("Recived message for unknown actor: '"+msg.destination.actor+"'");
            const result = await actor.onMessage(msg);
            process.nextTick(() => this.interruptStats());
            return result;
        } else {
            const id = ++this.lastMsgId;
            this.port.postMessage(new ThreadActorMessage(msg, id));
            return new Promise(resolve => {
                this.msgResolvers.set(id, resolve);
                console.log("added! count:",this.msgResolvers.size)
            });
        }
    }

    async onWorkerMessage(msg: ThreadMessage) {
        if (msg instanceof ThreadActorMessage) {
            const actorMessage = msg.msg;
            const result = await this.sendMessage(actorMessage);
            this.port.postMessage(new ThreadActorResponse(result, msg.id));
            return;

        } else if (msg instanceof ThreadActorResponse) {
            const res = this.msgResolvers.get(msg.id);
            if (!res) throw new Error("recived unrequested result");
            this.msgResolvers.delete(msg.id);
            res(msg.msg);
            return;

        } else if (msg instanceof ThreadSpawnMessage) {
            const addr = await this.spawnActor(msg.path, msg.props);
            this.port.postMessage(new ThreadSpawnedMessage(addr, msg.id));
            return;

        } else if (msg instanceof ThreadDestroyMessage) {
            if (!msg.addr.actor) throw new Error("Recived unaddressed delete request");
            const actor = this.actors.get(msg.addr.actor);
            if (!actor) throw new Error("Recived delete request for unknown actor");
            this.actors.delete(msg.addr.actor);
            actor.isDestroyed = true;
            actor.destroy();
            return;
        } else {
            console.log(msg);
            throw new Error("Reactor recived unknown message type");
        }
    }
}

  /*8""8q.                     `7MM                           mm                        mm                       
.dP'    `YM.                     MM                           MM                        MM                       
dM'      `MM `7Mb,od8  ,p6"bo    MMpMMMb.   .gP"Ya  ,pP"Ybd mmMMmm  `7Mb,od8  ,6"Yb.  mmMMmm   ,pW"Wq.  `7Mb,od8 
MM        MM   MM' "' 6M'  OO    MM    MM  ,M'   Yb 8I   `"   MM      MM' "' 8)   MM    MM    6W'   `Wb   MM' "' 
MM.      ,MP   MM     8M         MM    MM  8M"""""" `YMMMa.   MM      MM      ,pm9MM    MM    8M     M8   MM     
`Mb.    ,dP'   MM     YM.    ,   MM    MM  YM.    , L.   I8   MM      MM     8M   MM    MM    YA.   ,A9   MM     
  `"bmmd"'   .JMML.    YMbmd'  .JMML  JMML. `Mbmmd' M9mmmP'   `Mbmo .JMML.   `Moo9^Yo.  `Mbmo  `Ybmd9'  .JMM*/

export class Orchestrator {

    lastMsgId = 0;
    lastActorId = 0;
    lastWorkerId = 0;
    lastGroupId = 0;
    msgResolvers: Map<number, (result: any) => void> = new Map();
    actorResolvers: Map<number, (result: any) => void> = new Map();
    addr = new Addr("o");
    reactors: Map<string, Worker> = new Map();
    actorGroups: Map<string, ActorGroup> = new Map();
    reactorLoad: Map<string, {load: number, actors: number, queue: number}> = new Map();

    workerURL: string;
    threads: number;

    private constructor(threads: number, workerURL: string) {
        this.threads = threads;
        this.workerURL = workerURL;
    }

    static async create(threads: number, workerURL: string): Promise<Orchestrator> {
        var orchestrator = new Orchestrator(threads, workerURL);
        var prms = [];
        for (let index = 0; index < threads; index++) {
            prms.push(orchestrator.addReactor());
        }
        await Promise.all(prms);
        return orchestrator;
    }

    addReactor(): Promise<Addr> {
        return new Promise((resolve) => {
            const addr = new Addr(REACTOR_ADDR_PRE + ++this.lastWorkerId);
            var worker = new Worker(this.workerURL,{workerData: {addr: addr}});
            this.reactors.set(addr.reactor, worker);
            worker.on('message', (msg) => {
                this.handleMessage(parseThreadMessage(msg), addr);
            });
            worker.on("online", () => {
                this.reactors.set(addr.reactor, worker);
                this.reactorLoad.set(addr.reactor, {load: 5, actors: 0, queue: 0});
                resolve(addr);
            });
        });
    }

    addActor(actorFile: string, props: any, reactorAddr?: Addr): Promise<Addr> {
        if(reactorAddr === undefined){
            var lowestValue = Infinity;
            var lowestAddr: string | null = null;
    
            this.reactorLoad.forEach((rl, addr) => {
                var load = rl.load + rl.actors * 0.1 + rl.queue * 0.01;
                if(load < lowestValue){
                    lowestAddr = addr;
                    lowestValue = load;
                }
            });
            if(lowestAddr === null) throw new Error("Orchestrator not initialized")
            reactorAddr = new Addr(lowestAddr);
        }

        var reactor = this.reactors.get(reactorAddr.reactor);
        var id = ++this.lastActorId;
        if(reactor === undefined) throw new Error("Reactor : '"+reactorAddr.reactor+"' does not exist");

        reactor.postMessage(new ThreadSpawnMessage(actorFile, props, id));
        var o = this.reactorLoad.get(reactorAddr.reactor);

        if(o !== undefined){
            this.reactorLoad.set(reactorAddr.reactor, {load: o.load, actors: o.actors + 1, queue: o.queue});
        }
        return new Promise(resolve => {
            this.actorResolvers.set(id, resolve);
        });
    }

    async addActorGroup(actorFile: string, props: any): Promise<Addr>{
        const prm : Array<Promise<Addr>> = [];
        this.reactors.forEach((reactor,key) => {
            prm.push(this.addActor(actorFile, props, new Addr(key)));
        });
        var addrs = await Promise.all(prm);
        var id = GROUP_ADDR_PRE + (++this.lastGroupId);
        this.actorGroups.set(id, new ActorGroup(addrs));
        return new Addr(id);
    }

    sendMessageInt(msg: ActorMessage<any>, id?: number): Promise<ActorMessage<any>>{
        const isGroup = msg.destination.reactor.startsWith(GROUP_ADDR_PRE);
        let reactor: Worker;

        if(isGroup){
            var group = this.actorGroups.get(msg.destination.plain);
            if(group === undefined) throw new Error("Group does not exist");
            var lowestValue = Infinity;
            var lowestAddr: Addr | undefined;
    
            group.addrs.forEach(addr => {
                const wl = this.reactorLoad.get(addr.reactor);
                if(wl === undefined) throw new Error("Group reactor does not exist");
                var load = wl.load + wl.queue * 0.001 + Math.random() * 0.01;
                if(load < lowestValue){
                    lowestAddr = addr;
                    lowestValue = load;
                }
            });
            if(lowestAddr === undefined) throw new Error("Group reactor does not exist");
            const r = this.reactors.get(lowestAddr.reactor);
            if(r === undefined) throw new Error("Reactor : '"+lowestAddr.reactor+"' does not exist");
            reactor = r;
            msg.destination = lowestAddr;
        }else{
            const r = this.reactors.get(msg.destination.reactor);
            if(r === undefined) throw new Error("Reactor : '"+msg.destination.reactor+"' does not exist");
            reactor = r;
        }
        if(!id){
            let id = ++this.lastMsgId;
            reactor.postMessage(new ThreadActorMessage(msg,id));
            return new Promise(resolve => {
                this.msgResolvers.set(id, resolve);
            });
        }else{
            if(msg.source.plain === this.addr.plain) throw new Error("Cannot forward un-id-ed message");
            reactor.postMessage(new ThreadActorMessage(msg,id));
            return Promise.resolve(new ActorMessage(Addr.NONE, Addr.NONE, false));
        }
    }

    async sendMessage(addr: Addr | string, msg: any): Promise<any>{
        if(typeof addr === "string"){
            addr = new Addr(addr);
        }
        var actorMessage = new ActorMessage(this.addr, addr, msg);
        var res = await this.sendMessageInt(actorMessage);
        return res.content;
    }

    async handleMessage(msg: any, workerAddr: Addr) {
        if (msg instanceof ThreadActorMessage) {
            const dst = msg.msg.destination;
            if(dst.reactor.startsWith(this.addr.reactor)) throw new Error("Orchestrator recived unrequested message");
            await this.sendMessageInt(msg.msg);
            return;

        } else if (msg instanceof ThreadActorResponse) {
            const reactor = this.reactors.get(msg.msg.destination.reactor);
            if(reactor){
                reactor.postMessage(msg);
                return;
            }else{
                const res = this.msgResolvers.get(msg.id);
                if (!res) throw new Error("recived unrequested result");
                this.msgResolvers.delete(msg.id);
                res(msg.msg);
                return;
            }
        } else if (msg instanceof ThreadSpawnedMessage) {
            const res = this.actorResolvers.get(msg.id);
            if (!res) throw new Error("recived unrequested actor spawn");
            this.actorResolvers.delete(msg.id);
            res(msg.addr);
            return;

        } else if(msg instanceof ThreadStatsMessage) {
            this.reactorLoad.set(workerAddr.reactor, { load: msg.load, queue: msg.queue, actors: msg.actors} );
            return;
        } else{
            console.log(msg);
            throw new Error("Orchestratpr recived unknown message type");
        }
    }
}