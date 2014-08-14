var util = require('util');


var Udp = module.exports = function Udp() {
    this.config = null;
    this.engine = null;
};

Udp.prototype.setConfig = function(config) {
    this.config = config;
};

Udp.prototype.setEngine = function(engine) {
    this.engine = engine;
};

Udp.prototype.serve = function() {
};

Udp.prototype.onAnnounce = function() {
};
