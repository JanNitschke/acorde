import { Addr } from "./Addr";
import { Reactor } from "./reactor";

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
            await Promise.resolve(this.mod.end()).catch(console.error);
        }
    }

    async sendMessage(addr: Addr, msg: any): Promise<any>;
    async sendMessage(addr: Addr, msg: any, raw: true): Promise<ActorMessage<any>>;

    sendMessage(addr: Addr, msg: any, raw?: boolean): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const result = await this.reactor.sendMessage(new ActorMessage(this.addr, addr, msg));
            if(raw) {
                resolve(result);
            }else{
                if(result.error) reject(result.error);
                else resolve(result.content)
            }
        });
    }


    async onMessage(msg: ActorMessage<any>): Promise<ActorMessage<any>> {
        if (!this.isDestroyed) {
            try{
                const result = await Promise.resolve(this.mod.handle(msg.content, this.sendMessage.bind(this), this.reactor.updateStats.bind(this.reactor)));
                if(result !== undefined){
                    return new ActorMessage<any>(this.addr, msg.source, result, true);
                }else{
                    return new ActorMessage<any>(this.addr, msg.source, msg.content, false);
                }
            }catch(ex){
                return new ActorMessage<any>(this.addr, msg.source, msg.content, false, ex.stack);
            }
        } else {
            throw new Error("Tryed to send a message to a destroyed actor");
        }
    }

}


export class ActorMessage<T>{
    readonly source: Addr;
    destination: Addr;
    readonly content: T;
    readonly returnValue?: boolean;
    readonly error?: string;

    constructor(clone: ActorMessage<any>);
    constructor(source: Addr, destination: Addr, content: T, returnValue?: boolean, error?: string);
    constructor(source: Addr | ActorMessage<T>, destination?: Addr, content?: T, returnValue?: boolean, error?: string) {
        if(source instanceof ActorMessage){
            this.source = source.source;
            this.destination = source.destination;
            this.content = source.content as T;
            this.returnValue = source.returnValue;
            this.error = source.error;
        }else{
            this.source = source;
            this.destination = destination as Addr;
            this.content = content as T;
            this.returnValue = returnValue;
            this.error = error;
        }
    }
}

export type SendMessageFunction<T> = (addr: Addr, msg: T ,raw?: true) => Promise<ActorMessage<any>|any>;


export interface Handler<T> {
    handle(msg: T, sendMessage: SendMessageFunction<any>, updateStats: () => void): Promise<any>;
}


export type ActorModule = {
    start?: (props: any) => Promise<void>;
    handle: (msg: any, sendMessage: (addr: Addr, msg: any) => Promise<any>, updateStats: () => void) => any;
    end?: () => Promise<void>
}


export class ActorGroup{
    addrs: Addr[];
    constructor(addrs: Array<Addr>){
        this.addrs = addrs;
    }
}

