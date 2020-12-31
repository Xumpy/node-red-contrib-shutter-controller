var helper = require("node-red-node-test-helper");
var shutterControllerNode = require("../shutter-controller.js");

helper.init(require.resolve('node-red'));

describe('shutter-controller Node', function () {
    this.timeout(30000);

    afterEach(function () {
        helper.unload();
    });
    it('Test shutter controller', function (done) {
        var flow = [
            { id: "n1", type: "shutter-controller", shutterName: "shizzle1", processTimeInSeconds: 10 , name: "shutter-controller",wires:[["n2"]] },
            { id: "n2", type: "helper" }
        ];

        helper.load(shutterControllerNode, flow, function () {
            var iterator = 0;
            var n2 = helper.getNode("n2");
            var n1 = helper.getNode("n1");
            n2.on("input", function (msg) {
                const currentTime = new Date();
                console.log(currentTime + ": " + msg.payload + " on topic: " + msg.topic);
                iterator++; if (iterator === 4) done();
            });
            n1.receive({ payload: {
                    topic: "RFY/0xE0002/1",
                    shutterPercentage: "70"
                } });
            n1.receive({ payload: {
                    topic: "RFY/0xE0002/1",
                    shutterPercentage: "30"
                } });
        });
    });
    it('Test shutter controller', function (done) {
        var flow = [
            { id: "n1", type: "shutter-controller", processTimeInSeconds: 10 , name: "shutter-controller",wires:[["n2"]] },
            { id: "n2", type: "helper" }
        ];

        helper.load(shutterControllerNode, flow, function () {
            var iterator = 0;
            var n2 = helper.getNode("n2");
            var n1 = helper.getNode("n1");
            n2.on("input", function (msg) {
                const currentTime = new Date();
                console.log(currentTime + ": " + msg.payload + " on topic: " + msg.topic);
                iterator++; if (iterator === 2) done();
            });
            n1.receive({ payload: {
                    topic: "RFY/0xE0002/1",
                    shutterPercentage: "70"
                } });
            n1.receive({ payload: {
                    topic: "RFY/0xE0002/1",
                    shutterPercentage: "30"
                } });
            n1.receive({ payload: {
                    topic: "RFY/0xE0002/1",
                    shutterPercentage: "100"
                } });
        });
    });

    it('Test shutter controller', function (done) {
        var flow = [
            { id: "n1", type: "shutter-controller", shutterName: "shizzle1", processTimeInSeconds: 10, name: "shutter-controller",wires:[["n2"]] },
            { id: "n2", type: "helper" },
            { id: "n3", type: "shutter-controller", shutterName: "shizzle2", processTimeInSeconds: 10, name: "shutter-controller",wires:[["n4"]] },
            { id: "n4", type: "helper" }
        ];

        helper.load(shutterControllerNode, flow, function () {
            var iterator = 0;
            var n4 = helper.getNode("n4");
            var n3 = helper.getNode("n3");
            var n2 = helper.getNode("n2");
            var n1 = helper.getNode("n1");
            n2.on("input", function (msg) {
                const currentTime = new Date();
                console.log(currentTime + ": " + msg.payload + " on topic: " + msg.topic);
                iterator++; if (iterator === 4) done();
            });
            n1.receive({ payload: {
                    topic: "RFY/0xE0002/1",
                    shutterPercentage: "10"
                } });
            n3.receive({ payload: {
                    topic: "RFY/0xE0002/2",
                    shutterPercentage: "10"
                } });
        });
    });
});