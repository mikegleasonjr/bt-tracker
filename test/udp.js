var sinon = require('sinon');
var extend = require('util')._extend;
var util = require('util');
var UdpFactory = require('../lib/udpFactory');
var Engine = require('../lib/engine');
var fixtures = require('./fixtures/fixtures.json');
require('should');


describe('udp', function() {
    var udp = new UdpFactory().create();
    var engine = new Engine();

    before(function() {
        udp.setEngine(engine);
    });

    beforeEach(function() {
        engine.setConfig(fixtures.engine.config);
        udp.setConfig(fixtures.udp.config);
    });

    function configWith(overrides) {
        return extend(extend({}, fixtures.udp.config), overrides);
    }
});
