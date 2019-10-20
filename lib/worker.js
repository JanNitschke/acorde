"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const reactor_1 = require("./reactor");
const threads_1 = require("./threads");
if (worker_threads_1.parentPort === null) {
    throw new Error("The worker can only be used in a worker thread");
}
const parent = worker_threads_1.parentPort;
const reactor = new reactor_1.Reactor(worker_threads_1.workerData.addr, parent);
parent.on('message', (data) => {
    reactor.onWorkerMessage(threads_1.parseThreadMessage(data));
});
