var util = require('util');
var dgram = require('dgram');
var bufferTools = require('buffertools');
var ConnectRequest = require('./udp/connectRequest');
var AnnounceRequest = require('./udp/announceRequest');


var INITIAL_CONNECTION_ID = new Buffer([0x00, 0x00, 0x04, 0x17, 0x27, 0x10, 0x19, 0x80]);

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
        util.log('UDP server listening on port ' + this.config.port);
    }.bind(this));
};

Udp.prototype.stop = function() {
    this.socket.close();
};

Udp.prototype.onMessage = function(bytes, rinfo) {
    var msg = this.identify(bytes);

    if (!msg) {
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

    return AnnounceRequest.parse(bytes);
};

Udp.prototype.onConnectRequest = function(cr, callback) {
    if (!bufferTools.equals(cr.params.connId, INITIAL_CONNECTION_ID)) {
        callback(cr.toReply('invalid connection_id'));
        return;
    }

    this.engine.connect(function(err, connId) {
        callback(cr.toReply(err, connId));
    });
};

Udp.prototype.onAnnounceRequest = function(ar, callback) {
    this.engine.isConnected(ar.params.connId, function(err, isConn) {
        if (err) {
            callback(ar.toReply(err));
            return;
        }

        if (!isConn) {
            callback(ar.toReply('not connected'));
            return;
        }

        this.engine.announce(ar.params, function(err, swarm) {
            callback(ar.toReply(err, this.config.interval, swarm));
        }.bind(this));
    }.bind(this));
};
