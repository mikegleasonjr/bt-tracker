var async = require('async');
var sanitize = require('./engine/parameters');


var Engine = module.exports = function Engine() {
    this.backend = null;
    this.config = null;
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

    async.waterfall([
        this.announce[params.event || 'updated'].bind(this, params),
        this.announce.end.bind(this, params)
    ], callback);
};

Engine.prototype.announce.started = function(params, callback) {
    this.backend.setPeer(params.infoHash, params.peerId, this._peer(params), callback);
};

Engine.prototype.announce.stopped = function(params, callback) {
    this.backend.delPeer(params.infoHash, params.peerId, callback);
};

Engine.prototype.announce.completed = function(params, callback) {
    async.parallel([
        this.backend.setPeer.bind(this.backend, params.infoHash, params.peerId, this._peer(params)),
        this.backend.incDownloads.bind(this.backend, params.infoHash)
    ], function(err) { callback(err); });
};

Engine.prototype.announce.updated = function(params, callback) {
    this.backend.setPeer(params.infoHash, params.peerId, this._peer(params), callback);
};

Engine.prototype.announce.end = function(params, callback) {
    var maxPeers = Math.min(params.numWant || Number.POSITIVE_INFINITY, this.config.maxPeers);
    this.backend.getSwarm(params.infoHash, { maxPeers: maxPeers }, callback);
};

Engine.prototype._peer = function(params) {
    return {
        ip: params.ip,
        port: params.port,
        downloaded: params.downloaded,
        uploaded: params.uploaded,
        left: params.left
    };
};
