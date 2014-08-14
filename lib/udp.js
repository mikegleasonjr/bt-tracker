var util = require('util');


var Udp = module.exports = function Udp() {
    this.config = null;
    this.engine = null;
};

Udp.prototype.setConfig = function(config) {
    this.config = config;
    return this;
};

Udp.prototype.setEngine = function(engine) {
    this.engine = engine;
    return this;
};

Udp.prototype.serve = function() {
};

Udp.prototype.onAnnounce = function() {
};
