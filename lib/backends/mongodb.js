var MongoDBBackend = module.exports = function MongoDBBackend() {
    this.config = null;
    this.client = null;
};

MongoDBBackend.prototype.getName = function() {
    return 'mongodb';
};

MongoDBBackend.prototype.setConfig = function(config) {
    this.config = config;
};

MongoDBBackend.prototype.setPeer = function(infoHash, peerId, peer, callback) {
    callback('not implemented');
};

MongoDBBackend.prototype.delPeer = function(infoHash, peerId, callback) {
    callback('not implemented');
};

MongoDBBackend.prototype.incDownloads = function(infoHash, callback) {
    callback('not implemented');
};

MongoDBBackend.prototype.getSwarm = function(infoHash, options, callback) {
    callback('not implemented');
};

MongoDBBackend.prototype.addConnId = function(connId, callback) {
    callback('not implemented');
};

MongoDBBackend.prototype.isConnId = function(connId, callback) {
    callback('not implemented');
};
