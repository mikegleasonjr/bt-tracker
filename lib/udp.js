var crypto = require('crypto');
var util = require('util');
var dgram = require('dgram');
var ConnectRequest = require('./udp/connectRequest');
var ErrorReply = require('./udp/errorReply');


var Udp = module.exports = function Udp() {
    this.config = null;
    this.engine = null;

    this.socket = dgram.createSocket('udp4');
    this.socket.on('message', this.onMessage.bind(this));
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
    this.socket.bind(this.config.port, function() {
        // listening
        // util.log('')
    });
};

Udp.prototype.stop = function() {
    this.socket.close();
};

Udp.prototype.onMessage = function(bytes, rinfo) {
    var msg = this.identify(bytes);

    if (!msg) {
        return;
    }

    if (msg.err) {
        new ErrorReply(msg.err, msg.transId).sendTo(rinfo).using(this.socket);
        return;
    }

    this['on' + msg.constructor.name](msg, function(reply) {
        reply.sendTo(rinfo).using(this.socket);
    }.bind(this));
};

Udp.prototype.identify = function(bytes) {
    var msg;

    if (msg = ConnectRequest.parse(bytes)) {
        return msg;
    }

    return null;
};

Udp.prototype.onConnectRequest = function(cr, callback) {
    this.engine.connect(function(err, connId) {
        callback(err ? new ErrorReply(err, cr.transId) : cr.toReply(connId));
    });
};
