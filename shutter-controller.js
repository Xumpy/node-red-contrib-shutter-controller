const Queue = require('bull');

function linkLogToConsole(context){
    context.error = function(logMessage) {
        const currentTime = new Date();
        console.error(currentTime + ": " + logMessage);
    }
    context.debug = function(logMessage) {
        const currentTime = new Date();
        console.debug(currentTime + ": " + logMessage);
    }
    context.log = function(logMessage) {
        const currentTime = new Date();
        console.log(currentTime + ": " + logMessage);
    }
    context.send = function(logMessage) {
        const currentTime = new Date();
        console.log(currentTime + ": " + logMessage);
    }
}

module.exports = function(RED) {
    let currentPercentage = 0 // always assume that shutters are open at start of nodered;

    function calculateTimeOut(config, differentPercentage){
        let fullProcessingTime = Number(config.processTimeInSeconds);
        let timeout = (fullProcessingTime / 100 * Math.abs(differentPercentage)) * 1000;
        return timeout;
    }

    function createQueue(queueName, host){
        let queue = new Queue(queueName, {
            redis: {
                host: host
            }
        });

        queue.process( function (job, done){
            job.data.msg.topic = job.data.msg.payload.topic;
            job.data.msg.payload = "UP";

            setTimeout(function() {
                done(job.data.msg);
            }, job.data.timeout);
        });
        return queue;
    }

    function sendUp(queue, node, msg, timeout){
        node.send( queue.add({
                msg: msg,
                command: "UP",
                timeout: timeout
            }));
    }

    function sendDown(queue, node, msg, timeout){
        node.send( queue.add({
                msg: msg,
                command: "DOWN",
                node: node,
                timeout: timeout
            }));
    }

    function sendStop(queue, node, msg, timeout){
        node.send( queue.add({
                msg: msg,
                command: "STOP",
                node: node,
                timeout: timeout
            }));
    }

    function shutterControllerNode(config) {
        RED.nodes.createNode(this,config);

        let queue = createQueue(config.shutterName, "192.168.1.3");

        linkLogToConsole(this);
        let node = this;

        node.on('input', function(msg) {
            console.log(node);

            let shutterPercentage = Number(msg.payload.shutterPercentage);
            let differentPercentage = shutterPercentage - currentPercentage;
            // example 10% open, want to go to 50% needs to add 40% (40%)
            // example 60% open, want to go to 50% needs to subtract 10% (-10%)

            if (shutterPercentage === 0){
                //queue.destroy();
                sendUp(queue, node, msg, 0);
            } else if (shutterPercentage === 100){
                //queue.destroy();
                sendDown(queue, node, msg, 0);
            } else if (differentPercentage < 0){
                sendUp(queue, node, msg, 0);
                sendStop(queue, node, msg, calculateTimeOut(config, differentPercentage));
            } else if (differentPercentage > 0){
                sendDown(queue, node, msg, 0);
                sendStop(queue, node, msg, calculateTimeOut(config, differentPercentage));
            }
            currentPercentage = shutterPercentage;
        });
    }
    RED.nodes.registerType("shutter-controller",shutterControllerNode);
}