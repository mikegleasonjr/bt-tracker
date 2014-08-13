var async = require('async');
var sanitize = require('./engine/parameters');


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

    async.waterfall([
        this.announce[params.event || 'updated'].bind(this, params),
        this.announce.end.bind(this, params)
    ], callback);
};

Engine.prototype.announce.started = function(params, callback) {
    var peer = this._peerFromParams(params);

    this.backend.setPeer(params.infoHash, params.peerId, peer, callback);
};

Engine.prototype.announce.stopped = function(params, callback) {
    this.backend.delPeer(params.infoHash, params.peerId, callback);
};

Engine.prototype.announce.completed = function(params, callback) {
    var peer = this._peerFromParams(params);

    async.parallel([
        this.backend.setPeer.bind(this.backend, params.infoHash, params.peerId, peer),
        this.backend.incDownloads.bind(this.backend, params.infoHash)
    ], function(err) { callback(err); });
};

Engine.prototype.announce.updated = function(params, callback) {
    var peer = this._peerFromParams(params);

    this.backend.setPeer(params.infoHash, params.peerId, peer, callback);
};

Engine.prototype.announce.end = function(params, callback) {
    // TODO, test/implement numwant
    this.backend.getSwarm(params.infoHash, { maxPeers: this.config.maxPeers }, callback);
};

Engine.prototype._peerFromParams = function(params) {
    return {
        ip: params.ip,
        port: params.port,
        downloaded: params.downloaded,
        uploaded: params.uploaded,
        left: params.left
    };
};
