const Queue = require('sync-queue')

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
}

module.exports = function(RED) {
    let currentPercentage = 0 // always assume that shutters are open at start of nodered;

    function calculateTimeOut(config, differentPercentage){
        let fullProcessingTime = Number(config.processTimeInSeconds);
        let timeout = (fullProcessingTime / 100 * Math.abs(differentPercentage)) * 1000;
        return timeout;
    }

    function sendUp(queue, node, msg, timeOut){
        queue.place( function() {
            msg.topic = msg.payload.topic;
            msg.payload = "UP";
            node.send(msg);
            setTimeout(function() {
                queue.next();
            }, timeOut);
        });
    }
    function sendDown(queue, node, msg, timeOut){
        queue.place(function() {
            msg.topic = msg.payload.topic;
            msg.payload = "DOWN";
            node.send(msg);
            setTimeout(function() {
                queue.next();
            }, timeOut);
        });
    }
    function sendStop(queue, node, msg){
        queue.place(function() {
            msg.payload = "STOP";
            node.send(msg); queue.next();
        });
    }

    function shutterControllerNode(config) {
        RED.nodes.createNode(this,config);
        let queue = Queue();

        //linkLogToConsole(this);
        let node = this;

        node.on('input', function(msg) {
            let shutterPercentage = Number(msg.payload.shutterPercentage);
            let differentPercentage = shutterPercentage - currentPercentage;
            // example 10% open, want to go to 50% needs to add 40% (40%)
            // example 60% open, want to go to 50% needs to subtract 10% (-10%)

            if (shutterPercentage === 0){
                sendUp(queue, node, msg, calculateTimeOut(config, differentPercentage));
            } else if (shutterPercentage === 100){
                sendDown(queue, node, msg, calculateTimeOut(config, differentPercentage));
            } else if (differentPercentage < 0){
                sendUp(queue, node, msg, calculateTimeOut(config, differentPercentage));
                sendStop(queue, node, msg);
            } else if (differentPercentage > 0){
                sendDown(queue, node, msg, calculateTimeOut(config, differentPercentage));
                sendStop(queue, node, msg);
            }
            currentPercentage = shutterPercentage;
        });
    }
    RED.nodes.registerType("shutter-controller",shutterControllerNode);
}