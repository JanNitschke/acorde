"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mod_1 = require("./mod");
const addr_1 = require("./addr");
const actor_1 = require("./actor");
const worker_threads_1 = require("worker_threads");
const threads_1 = require("./threads");
const events_1 = require("events");
/*8""8q.                     `7MM                           mm                        mm
.dP'    `YM.                     MM                           MM                        MM
dM'      `MM `7Mb,od8  ,p6"bo    MMpMMMb.   .gP"Ya  ,pP"Ybd mmMMmm  `7Mb,od8  ,6"Yb.  mmMMmm   ,pW"Wq.  `7Mb,od8
MM        MM   MM' "' 6M'  OO    MM    MM  ,M'   Yb 8I   `"   MM      MM' "' 8)   MM    MM    6W'   `Wb   MM' "'
MM.      ,MP   MM     8M         MM    MM  8M"""""" `YMMMa.   MM      MM      ,pm9MM    MM    8M     M8   MM
`Mb.    ,dP'   MM     YM.    ,   MM    MM  YM.    , L.   I8   MM      MM     8M   MM    MM    YA.   ,A9   MM
`"bmmd"'   .JMML.    YMbmd'  .JMML  JMML. `Mbmmd' M9mmmP'   `Mbmo .JMML.   `Moo9^Yo.  `Mbmo  `Ybmd9'  .JMM*/
class Orchestrator extends events_1.EventEmitter {
    constructor(threads) {
        super();
        this.lastMsgId = 100;
        this.lastActorId = 0;
        this.lastWorkerId = 0;
        this.lastGroupId = 0;
        this.msgResolvers = new Map();
        this.actorResolvers = new Map();
        this.addr = new addr_1.Addr("o");
        this.reactors = new Map();
        this.actorGroups = new Map();
        this.reactorLoad = new Map();
        this.threads = threads;
    }
    static async create(threads) {
        const orchestrator = new Orchestrator(threads);
        const prms = [];
        for (let index = 0; index < threads; index++) {
            prms.push(orchestrator.addReactor());
        }
        await Promise.all(prms);
        return orchestrator;
    }
    addReactor() {
        return new Promise((resolve) => {
            const addr = new addr_1.Addr(mod_1.REACTOR_ADDR_PRE + ++this.lastWorkerId);
            const worker = new worker_threads_1.Worker(mod_1.WORKER_FILE_PATH, { workerData: { addr: addr } });
            this.reactors.set(addr.reactor, worker);
            worker.on('message', (msg) => {
                this.handleMessage(threads_1.parseThreadMessage(msg), addr);
            });
            worker.on("online", () => {
                this.reactors.set(addr.reactor, worker);
                this.reactorLoad.set(addr.reactor, { load: 5, actors: 0, queue: 0 });
                resolve(addr);
            });
        });
    }
    addActor(actorFile, props, reactorAddr) {
        if (reactorAddr === undefined) {
            let lowestValue = Infinity;
            let lowestAddr = null;
            this.reactorLoad.forEach((rl, addr) => {
                const load = rl.load + rl.actors * 0.1 + rl.queue * 0.01;
                if (load < lowestValue) {
                    lowestAddr = addr;
                    lowestValue = load;
                }
            });
            if (lowestAddr === null)
                throw new Error("Orchestrator not initialized");
            reactorAddr = new addr_1.Addr(lowestAddr);
        }
        const reactor = this.reactors.get(reactorAddr.reactor);
        const id = ++this.lastActorId;
        if (reactor === undefined)
            throw new Error("Reactor : '" + reactorAddr.reactor + "' does not exist");
        reactor.postMessage(new threads_1.ThreadSpawnMessage(actorFile, props, id));
        const reactorLoad = this.reactorLoad.get(reactorAddr.reactor);
        if (reactorLoad !== undefined) {
            this.reactorLoad.set(reactorAddr.reactor, { load: reactorLoad.load, actors: reactorLoad.actors + 1, queue: reactorLoad.queue });
        }
        return new Promise(resolve => {
            this.actorResolvers.set(id, resolve);
        });
    }
    async addActorGroup(actorFile, props) {
        const prm = [];
        this.reactors.forEach((reactor, key) => {
            prm.push(this.addActor(actorFile, props, new addr_1.Addr(key)));
        });
        const addrs = await Promise.all(prm);
        const id = mod_1.GROUP_ADDR_PRE + (++this.lastGroupId);
        this.actorGroups.set(id, new actor_1.ActorGroup(addrs));
        return new addr_1.Addr(id);
    }
    sendMessageInt(msg, id) {
        const isGroup = msg.destination.reactor.startsWith(mod_1.GROUP_ADDR_PRE);
        let reactor;
        if (isGroup) {
            const group = this.actorGroups.get(msg.destination.plain);
            if (group === undefined)
                throw new Error("Group does not exist");
            let lowestValue = Infinity;
            let lowestAddr;
            group.addrs.forEach(addr => {
                const wl = this.reactorLoad.get(addr.reactor);
                if (wl === undefined)
                    throw new Error("Group reactor does not exist");
                const load = wl.load + wl.queue * 0.001 + Math.random() * 0.01;
                if (load < lowestValue) {
                    lowestAddr = addr;
                    lowestValue = load;
                }
            });
            if (lowestAddr === undefined)
                throw new Error("Group reactor does not exist");
            const r = this.reactors.get(lowestAddr.reactor);
            if (r === undefined)
                throw new Error("Reactor : '" + lowestAddr.reactor + "' does not exist");
            reactor = r;
            msg.destination = lowestAddr;
        }
        else {
            const r = this.reactors.get(msg.destination.reactor);
            if (r === undefined)
                throw new Error("Reactor : '" + msg.destination.reactor + "' does not exist");
            reactor = r;
        }
        if (!id) {
            let id = ++this.lastMsgId;
            reactor.postMessage(new threads_1.ThreadActorMessage(msg, id));
            return new Promise((resolve, reject) => {
                this.msgResolvers.set(id, { resolve, reject });
            });
        }
        else {
            if (msg.source.plain === this.addr.plain)
                throw new Error("Cannot forward un-id-ed message");
            reactor.postMessage(new threads_1.ThreadActorMessage(msg, id));
            return Promise.resolve(new actor_1.ActorMessage(addr_1.Addr.NONE, addr_1.Addr.NONE, false));
        }
    }
    sendMessage(addr, msg) {
        return new Promise(async (resolve, reject) => {
            if (typeof addr === "string") {
                addr = new addr_1.Addr(addr);
            }
            const actorMessage = new actor_1.ActorMessage(this.addr, addr, msg);
            const result = await this.sendMessageInt(actorMessage);
            if (result.error)
                reject(result.error);
            else
                resolve(result.content);
        });
    }
    async handleMessage(msg, workerAddr) {
        if (msg instanceof threads_1.ThreadActorMessage) {
            const dst = msg.msg.destination;
            if (dst.reactor.startsWith(this.addr.reactor))
                this.emit("msg", msg);
            await this.sendMessageInt(msg.msg, msg.id);
            return;
        }
        else if (msg instanceof threads_1.ThreadActorResponse) {
            const reactor = this.reactors.get(msg.msg.destination.reactor);
            if (reactor) {
                reactor.postMessage(msg);
                return;
            }
            else {
                const prm = this.msgResolvers.get(msg.id);
                if (!prm)
                    throw new Error("recived unrequested result");
                this.msgResolvers.delete(msg.id);
                prm.resolve(msg.msg);
                return;
            }
        }
        else if (msg instanceof threads_1.ThreadSpawnedMessage) {
            const res = this.actorResolvers.get(msg.id);
            if (!res)
                throw new Error("recived unrequested actor spawn");
            this.actorResolvers.delete(msg.id);
            res(msg.addr);
            return;
        }
        else if (msg instanceof threads_1.ThreadStatsMessage) {
            this.reactorLoad.set(workerAddr.reactor, { load: msg.load, queue: msg.queue, actors: msg.actors });
            return;
        }
        else {
            throw new Error("Orchestratpr recived unknown message type");
        }
    }
}
exports.Orchestrator = Orchestrator;
