const { Orchestrator } = require('./../lib/mod')


var run = async() => {
    /**
     * @typedef {import('./../lib/mod.js').Orchestrator} Orchestrator
     * @type {Orchestrator} orchestrator
     */
    const orchestrator = await Orchestrator.create(8);    
    const pongAddr = await orchestrator.addActor("./../test/pong", {});
    const primeAddr = await orchestrator.addActorGroup("./../test/primeActor", {});

    setInterval(() => {
        logstr = "load:";
        orchestrator.reactorLoad.forEach((load , key) => {
            logstr += " " + key + ": " + Math.round(load.load * 1000); 
        });
        process.stdout.write("\r " + logstr + "                                 ");
    }, 500);

    let response = await orchestrator.sendMessage(pongAddr, "ping");
    console.log("response: ", response);

    console.log("starting primes!");

    var start = new Date().getTime();

    let prms = [];
    for (let index = 0; index < 1000; index++) {
        prms.push(orchestrator.sendMessage(primeAddr, {from: index * 1000, to: (index + 1) * 1000}));
    }
    console.log("setup complete!");
    let primes = await Promise.all(prms);
    console.log("recived \n");

    console.log("took: : " + (new Date().getTime() -  start) + "ms \n");


    primes = primes.flat().sort((a,b) => a-b);
    console.log(primes, "\n");
};

run();