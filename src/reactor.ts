import { parentPort, workerData, MessagePort } from 'worker_threads';
import { Actor, ActorModule, ActorMessage } from "./actor";
import { Addr } from "./Addr";
import { ThreadMessage,ThreadStatsMessage, ThreadActorMessage, ThreadSpawnMessage, ThreadDestroyMessage, ThreadSpawnedMessage, ThreadActorResponse } from "./threads";
import { LOAD_SUMMERY_WEIGHT } from "./mod";

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
    msgResolvers: Map<number, {resolve:(result: any) => void, reject: (reason: any) => void}> = new Map();
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
        const isLocal = (msg.destination.reactor === this.reactorAddr.reactor);
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
            return new Promise((resolve, reject )=> {
                this.msgResolvers.set(id, {resolve, reject});
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
            const prm = this.msgResolvers.get(msg.id);
            if (!prm) throw new Error("\n Reactor : " + this.reactorAddr.plain+ " recived unrequested result: \n " + JSON.stringify(msg) + " \n Map: " + JSON.stringify(new Array(this.msgResolvers.keys())));
            this.msgResolvers.delete(msg.id);
            prm.resolve(msg.msg);
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
            throw new Error("Reactor recived unknown message type");
        }
    }
}