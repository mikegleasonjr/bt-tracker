var MemoryBackend = module.exports = function MemoryBackend() {
    this.swarms = {};
};

MemoryBackend.prototype.getName = function() {
    return 'memory';
};

MemoryBackend.prototype.getPeer = function(infoHash, peerId, callback) {
    var swarm = this.swarms[infoHash];
    callback(null, swarm ? swarm.peers[peerId] : undefined);
};

MemoryBackend.prototype.setPeer = function(infoHash, peerId, peer, callback) {
    this._getSwarm(infoHash).peers[peerId] = peer;
    callback(null);
};

MemoryBackend.prototype.delPeer = function(infoHash, peerId, callback) {
    var swarm = this.swarms[infoHash];
    if (swarm) {
        delete swarm.peers[peerId];
    }
    callback(null);
};

MemoryBackend.prototype.incSeeders = function(infoHash, callback) {
    this._getSwarm(infoHash).seeders++;
    callback(null);
};

MemoryBackend.prototype.decSeeders = function(infoHash, callback) {
    var swarm = this._getSwarm(infoHash);
    if (swarm.seeders > 0) {
        swarm.seeders--;
    }
    callback(null);
};

MemoryBackend.prototype.incLeechers = function(infoHash, callback) {
    this._getSwarm(infoHash).leechers++;
    callback(null);
};

MemoryBackend.prototype.decLeechers = function(infoHash, callback) {
    var swarm = this._getSwarm(infoHash);
    if (swarm.leechers > 0) {
        swarm.leechers--;
    }
    callback(null);
};

MemoryBackend.prototype.getSwarm = function(infoHash, options, callback) {
    var swarm = this.swarms[infoHash];

    if (swarm) {
        var peers = {};
        var keys = this._randomize(Object.keys(swarm.peers));
        var count = Math.min(options.maxPeers, keys.length);
        for (var i = 0; i < count; i++) {
            var key = keys[i];
            peers[key] = swarm.peers[key];
        }

        callback(null, {
            leechers: swarm.leechers,
            seeders: swarm.seeders,
            peers: peers
        });
    }
    else {
        callback('unknown swarm');
    }
};

MemoryBackend.prototype._getSwarm = function(infoHash) {
    var swarm = this.swarms[infoHash];

    if (swarm) {
        return swarm;
    }

    swarm = this.swarms[infoHash] = {
        leechers: 0,
        seeders: 0,
        peers: { }
    };

    return swarm;
};

MemoryBackend.prototype._randomize = function(array) {
    var randomized = [];

    while(array.length) {
        var randomIndex = Math.floor(Math.random() * array.length);
        randomized.push(array[randomIndex]);
        array.splice(randomIndex, 1);
    }

    return randomized;
};
