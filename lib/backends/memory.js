var TWO_MINUTES = 1000 * 60 * 2;

var MemoryBackend = module.exports = function MemoryBackend() {
    this.config = null;
    this.peers = {};
    this.downloads = {};
    this.connIds = {};
};

MemoryBackend.prototype.getName = function() {
    return 'memory';
};

MemoryBackend.prototype.setConfig = function(config) {
    this.config = config;
};

MemoryBackend.prototype.setPeer = function(infoHash, peerId, peer, callback) {
    var infoHashStr = infoHash.toString('hex');
    var peerIdStr = peerId.toString('hex');

    this.peers[infoHashStr] = this.peers[infoHashStr] || {};

    if (peerIdStr in this.peers[infoHashStr]) {
        clearTimeout(this.peers[infoHashStr][peerIdStr].expId);
    }

    this.peers[infoHashStr][peerIdStr] = {
        ip: peer.ip,
        port: peer.port,
        left: peer.left,
        expId: setTimeout(function() {
            delete this.peers[infoHashStr][peerIdStr];
        }.bind(this), this.config.peerTTL * 1000)
    };

    callback(null);
};

MemoryBackend.prototype.delPeer = function(infoHash, peerId, callback) {
    var infoHashStr = infoHash.toString('hex');
    var peerIdStr = peerId.toString('hex');

    if (this.peers[infoHashStr]) {
        delete this.peers[infoHashStr][peerIdStr];
    }

    callback(null);
};

MemoryBackend.prototype.incDownloads = function(infoHash, callback) {
    var infoHashStr = infoHash.toString('hex');

    this.peers[infoHashStr] = this.peers[infoHashStr] || {};
    this.downloads[infoHashStr] = this.downloads[infoHashStr] || 0;
    this.downloads[infoHashStr]++;

    callback(null);
};

MemoryBackend.prototype.listSwarms = function(callback) {
    callback(null, Object.keys(this.peers).map(function(infoHashStr) {
        return new Buffer(infoHashStr, 'hex');
    }));
};

MemoryBackend.prototype.getSwarm = function(infoHash, options, callback) {
    var infoHashStr = infoHash.toString('hex');
    var peers = this.peers[infoHashStr];

    if (peers) {
        var leechers = 0;
        var seeders = 0;
        var swarm = [];
        var peerIds = this._randomize(Object.keys(peers));
        var count = Math.min(options.maxPeers, peerIds.length);

        peerIds.forEach(function(peerId) {
            peers[peerId].left === 0 ? seeders++ : leechers++;
        });

        for (var i = 0; i < count; i++) {
            var peerId = peerIds[i];
            var peer = peers[peerId];
            swarm.push({
                id: new Buffer(peerId, 'hex'),
                ip: peer.ip,
                port: peer.port
            });
        }

        callback(null, {
            leechers: leechers,
            seeders: seeders,
            downloads: this.downloads[infoHashStr] || 0,
            peers: swarm
        });
    }
    else {
        callback('unknown swarm');
    }
};

MemoryBackend.prototype.addConnId = function(connId, callback) {
    if (connId in this.connIds) {
        callback('connection id exists');
        return;
    }

    this.connIds[connId] = setTimeout(function() {
        delete this.connIds[connId];
    }.bind(this), TWO_MINUTES);

    callback(null);
};

MemoryBackend.prototype.isConnId = function(connId, callback) {
    callback(null, connId in this.connIds);
};

// TODO: reporting seeds to other seeders could be avoided
MemoryBackend.prototype._randomize = function(array) {
    var randomized = [];

    while(array.length) {
        var randomIndex = Math.floor(Math.random() * array.length);
        randomized.push(array[randomIndex]);
        array.splice(randomIndex, 1);
    }

    return randomized;
};
