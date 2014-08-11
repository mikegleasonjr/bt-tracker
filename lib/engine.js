var sanitize = require('./engine/parameters');


var noop = function() {};

var Engine = module.exports = function Engine() {
};

Engine.prototype.setBackend = function(backend) {
    this.backend = backend;
};

Engine.prototype.setConfig = function(config) {
    this.config = config;
};

Engine.prototype.announce = function(params, callback) {
    params = sanitize.announce(params);

    if (params.error) {
        callback(params.error);
        return;
    }

    if (params.event) {
        this.announce[params.event].call(this, params);
    }

    this.announce.end.call(this, params, callback);
};

Engine.prototype.announce.started = function(params) {
    var peer = { ip: params.ip, port: params.port };

    this.backend.setPeer(params.infoHash, params.peerId, peer, noop);

    params.left === 0 ?
        this.backend.incSeeders(params.infoHash, noop) :
        this.backend.incLeechers(params.infoHash, noop);
};

Engine.prototype.announce.stopped = function(params) {
    this.backend.delPeer(params.infoHash, params.peerId, noop);

    params.left === 0 ?
        this.backend.decSeeders(params.infoHash, noop) :
        this.backend.decLeechers(params.infoHash, noop);
};

Engine.prototype.announce.completed = function(params) {
    this.backend.decLeechers(params.infoHash, noop);
    this.backend.incSeeders(params.infoHash, noop);
    this.backend.incDownloads(params.infoHash, noop);
};

Engine.prototype.announce.end = function(params, callback) {
    this.backend.getSwarm(params.infoHash, { maxPeers: this.config.maxPeers }, callback);
};
