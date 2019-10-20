import { parentPort, workerData } from 'worker_threads';
import { Reactor } from './reactor';
import { parseThreadMessage } from './threads';

if(parentPort === null){
    throw new Error("The worker can only be used in a worker thread"); 
}
const parent = parentPort;

const reactor = new Reactor(workerData.addr, parent);

parent.on('message', (data: any) => {
    reactor.onWorkerMessage( parseThreadMessage(data));
});