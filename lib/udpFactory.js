var Udp = require('./udp');


var UdpFactory = module.exports = function UdpFactory() {
};

UdpFactory.prototype.create = function() {
    return new Udp();
};
