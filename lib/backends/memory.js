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
    this.peers[infoHash] = this.peers[infoHash] || {};

    if (peerId in this.peers[infoHash]) {
        clearTimeout(this.peers[infoHash][peerId].cookie);
    }

    this.peers[infoHash][peerId] = {
        ip: peer.ip,
        port: peer.port,
        left: peer.left,
        cookie: setTimeout(function() {
            delete this.peers[infoHash][peerId];
        }.bind(this), this.config.peerTTL * 1000)
    };

    callback(null);
};

MemoryBackend.prototype.delPeer = function(infoHash, peerId, callback) {
    if (this.peers[infoHash]) {
        delete this.peers[infoHash][peerId];
    }

    callback(null);
};

MemoryBackend.prototype.incDownloads = function(infoHash, callback) {
    this.peers[infoHash] = this.peers[infoHash] || {};
    this.downloads[infoHash] = this.downloads[infoHash] || 0;
    this.downloads[infoHash]++;

    callback(null);
};

MemoryBackend.prototype.listSwarms = function(callback) {
    callback(null, Object.keys(this.peers));
};

MemoryBackend.prototype.getSwarm = function(infoHash, options, callback) {
    var peers = this.peers[infoHash];

    if (peers) {
        var leechers = 0;
        var seeders = 0;
        var peers2 = {};
        var peerIds = this._randomize(Object.keys(peers));

        peerIds.forEach(function(peerId) {
            peers[peerId].left === 0 ? seeders++ : leechers++;
        });

        var count = Math.min(options.maxPeers, peerIds.length);
        for (var i = 0; i < count; i++) {
            var peerId = peerIds[i];
            peers2[peerId] = peers[peerId];
        }

        callback(null, {
            leechers: leechers,
            seeders: seeders,
            downloads: this.downloads[infoHash] || 0,
            peers: peers2
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
