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
    const queue = Queue();
    let currentPercentage = 0 // always assume that shutters are open at start of nodered;

    function calculateTimeOut(config, differentPercentage){
        let fullProcessingTime = Number(config.processTimeInSeconds);
        let timeout = (fullProcessingTime / 100 * Math.abs(differentPercentage)) * 1000;
        return timeout;
    }

    function sendUp(node, msg, timeOut){
        queue.place( function() {
            msg.topic = msg.payload.topic;
            msg.payload = "UP";
            node.send(msg);
            setTimeout(function() {
                queue.next();
            }, timeOut);
        });
    }
    function sendDown(node, msg, timeOut){
        queue.place(function() {
            msg.topic = msg.payload.topic;
            msg.payload = "DOWN";
            node.send(msg);
            setTimeout(function() {
                queue.next();
            }, timeOut);
        });
    }
    function sendStop(node, msg){
        queue.place(function() {
            msg.payload = "STOP";
            node.send(msg); queue.next();
        });
    }

    function shutterControllerNode(config) {
        RED.nodes.createNode(this,config);

        //linkLogToConsole(this);
        var node = this;

        node.on('input', function(msg) {
            let shutterPercentage = Number(msg.payload.shutterPercentage);
            let differentPercentage = shutterPercentage - currentPercentage;
            // example 10% open, want to go to 50% needs to add 40% (40%)
            // example 60% open, want to go to 50% needs to subtract 10% (-10%)

            if (shutterPercentage === 0){
                sendUp(node, msg, calculateTimeOut(config, differentPercentage));
            } else if (shutterPercentage === 100){
                sendDown(node, msg, calculateTimeOut(config, differentPercentage));
            } else if (differentPercentage < 0){
                sendUp(node, msg, calculateTimeOut(config, differentPercentage));
                sendStop(node, msg);
            } else if (differentPercentage > 0){
                sendDown(node, msg, calculateTimeOut(config, differentPercentage));
                sendStop(node, msg);
            }
            currentPercentage = shutterPercentage;
        });
    }
    RED.nodes.registerType("shutter-controller",shutterControllerNode);
}