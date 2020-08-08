const PAQ = require('priority-async-queue')

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

    function sendUp(paq, node, msg, timeOut){
        paq.addTask( function() {
            msg.topic = msg.payload.topic;
            msg.payload = "UP";
            node.send(msg);
            paq.pause();
            setTimeout(function() {
                paq.resume();
                }, timeOut);
        });
    }
    function sendDown(paq, node, msg, timeOut){
        paq.addTask(function() {
            msg.topic = msg.payload.topic;
            msg.payload = "DOWN";
            node.send(msg);
            paq.pause();
            setTimeout(function() {
                paq.resume();
                }, timeOut);
        });
    }
    function sendStop(paq, node, msg){
        paq.addTask(function() {
            msg.payload = "STOP";
            node.send(msg);
        });
    }

    function shutterControllerNode(config) {
        RED.nodes.createNode(this,config);
        let paq = new PAQ();

        linkLogToConsole(this);
        let node = this;

        node.on('input', function(msg) {
            let shutterPercentage = Number(msg.payload.shutterPercentage);
            let differentPercentage = shutterPercentage - currentPercentage;
            // example 10% open, want to go to 50% needs to add 40% (40%)
            // example 60% open, want to go to 50% needs to subtract 10% (-10%)

            if (shutterPercentage === 0){
                paq.clearTask();
                paq.resume();
                sendUp(paq, node, msg, calculateTimeOut(config, differentPercentage));
            } else if (shutterPercentage === 100){
                paq.clearTask();
                paq.resume();
                sendDown(paq, node, msg, calculateTimeOut(config, differentPercentage));
            } else if (differentPercentage < 0){
                sendUp(paq, node, msg, calculateTimeOut(config, differentPercentage));
                sendStop(paq, node, msg);
            } else if (differentPercentage > 0){
                sendDown(paq, node, msg, calculateTimeOut(config, differentPercentage));
                sendStop(paq, node, msg);
            }
            currentPercentage = shutterPercentage;
        });
    }
    RED.nodes.registerType("shutter-controller",shutterControllerNode);
}