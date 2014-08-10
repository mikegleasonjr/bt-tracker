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

Engine.prototype.announce = function(parameters, callback) {
    parameters = sanitize.announce(parameters);

    if (parameters.error) {
        callback(parameters.error);
        return;
    }

    async.waterfall([
        this.announce[parameters.event || 'updated'].bind(this, parameters),
        this.announce.end.bind(this, parameters)
    ], callback);
};

Engine.prototype.announce.started = function(parameters, callback) {
    var peer = { ip: parameters.ip, port: parameters.port };
    var setPeer = this.backend.setPeer.bind(this.backend, parameters.infoHash, parameters.peerId, peer);
    var incrementLeechersOrSeeders = this.backend['increment' + (parameters.left === 0 ? 'Seeders' : 'Leechers')].bind(this.backend, parameters.infoHash);

    async.parallel([
        incrementLeechersOrSeeders,
        setPeer
    ], function(err) { callback(err); });
};

Engine.prototype.announce.stopped = function(parameters, callback) {
    var deletePeer = this.backend.deletePeer.bind(this.backend, parameters.infoHash, parameters.peerId);
    var decrementLeechersOrSeeders = this.backend['decrement' + (parameters.left === 0 ? 'Seeders' : 'Leechers')].bind(this.backend, parameters.infoHash);

    async.parallel([
        deletePeer,
        decrementLeechersOrSeeders
    ], function(err) { callback(err); });
};

Engine.prototype.announce.completed = function(parameters, callback) {
    var decrementLeechers = this.backend.decrementLeechers.bind(this.backend, parameters.infoHash);
    var incrementSeeders = this.backend.incrementSeeders.bind(this.backend, parameters.infoHash);

    async.parallel([
        incrementSeeders,
        decrementLeechers
    ], function(err) { callback(err); });
};

Engine.prototype.announce.updated = function(parameters, callback) {
    callback(null);
};

Engine.prototype.announce.end = function(parameters, callback) {
    this.backend.getSwarm(parameters.infoHash, this.config, callback);
};
