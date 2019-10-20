"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Actor {
    constructor(addr, reactor, mod) {
        this.isDestroyed = false;
        this.addr = addr;
        this.reactor = reactor;
        this.mod = mod;
    }
    async start(props) {
        if (this.mod.start) {
            await Promise.resolve(this.mod.start(props));
        }
    }
    async destroy() {
        if (this.mod.end) {
            await Promise.resolve(this.mod.end()).catch(console.error);
        }
    }
    sendMessage(addr, msg, raw) {
        return new Promise(async (resolve, reject) => {
            const result = await this.reactor.sendMessage(new ActorMessage(this.addr, addr, msg));
            if (raw) {
                resolve(result);
            }
            else {
                if (result.error)
                    reject(result.error);
                else
                    resolve(result.content);
            }
        });
    }
    async onMessage(msg) {
        if (!this.isDestroyed) {
            try {
                const result = await Promise.resolve(this.mod.handle(msg.content, this.sendMessage.bind(this), this.reactor.updateStats.bind(this.reactor)));
                if (result !== undefined) {
                    return new ActorMessage(this.addr, msg.source, result, true);
                }
                else {
                    return new ActorMessage(this.addr, msg.source, msg.content, false);
                }
            }
            catch (ex) {
                return new ActorMessage(this.addr, msg.source, msg.content, false, ex.stack);
            }
        }
        else {
            throw new Error("Tryed to send a message to a destroyed actor");
        }
    }
}
exports.Actor = Actor;
class ActorMessage {
    constructor(source, destination, content, returnValue, error) {
        if (source instanceof ActorMessage) {
            this.source = source.source;
            this.destination = source.destination;
            this.content = source.content;
            this.returnValue = source.returnValue;
            this.error = source.error;
        }
        else {
            this.source = source;
            this.destination = destination;
            this.content = content;
            this.returnValue = returnValue;
            this.error = error;
        }
    }
}
exports.ActorMessage = ActorMessage;
class ActorGroup {
    constructor(addrs) {
        this.addrs = addrs;
    }
}
exports.ActorGroup = ActorGroup;
