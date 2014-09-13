var TWO_MINUTES = 1000 * 60 * 2;

var RedisBackend = module.exports = function RedisBackend() {
    this.config = null;
};

RedisBackend.prototype.getName = function() {
    return 'redis';
};

RedisBackend.prototype.setConfig = function(config) {
    this.config = config;
};

RedisBackend.prototype.setPeer = function(infoHash, peerId, peer, callback) {
    callback('not implemented');
};

RedisBackend.prototype.delPeer = function(infoHash, peerId, callback) {
    callback('not implemented');
};

RedisBackend.prototype.incDownloads = function(infoHash, callback) {
    callback('not implemented');
};

RedisBackend.prototype.listSwarms = function(callback) {
    callback('not implemented');
};

RedisBackend.prototype.getSwarm = function(infoHash, options, callback) {
    callback('not implemented');
};

RedisBackend.prototype.addConnId = function(connId, callback) {
    callback('not implemented');
};

RedisBackend.prototype.isConnId = function(connId, callback) {
    callback('not implemented');
};
