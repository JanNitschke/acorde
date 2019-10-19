"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mod_1 = require("./mod");
const worker_threads_1 = require("worker_threads");
if (worker_threads_1.parentPort === null) {
    throw new Error("The worker can only be used in a worker thread");
}
const parent = worker_threads_1.parentPort;
const reactor = new mod_1.Reactor(worker_threads_1.workerData.addr, parent);
parent.on('message', (data) => {
    reactor.onWorkerMessage(mod_1.parseThreadMessage(data));
});
