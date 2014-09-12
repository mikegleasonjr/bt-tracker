var inherits = require('util').inherits;
var Message = require('./message');
var ip = require('ip');


var AnnounceReply = module.exports = function AnnounceReply(transId, interval, swarm) {
    Message.call(this);

    this.action = 1;
    this.transId = transId;
    this.interval = interval;
    this.swarm = swarm;
};

inherits(AnnounceReply, Message);

AnnounceReply.prototype.getBuffer = function() {
    var b = new Buffer(20 + (this.swarm.peers.length * 6));

    b.writeInt32BE(this.action, 0);
    b.writeInt32BE(this.transId, 4);
    b.writeInt32BE(this.interval, 8);
    b.writeInt32BE(this.swarm.leechers, 12);
    b.writeInt32BE(this.swarm.seeders, 16);

    var offset = 20;
    this.swarm.peers.forEach(function(peer) {
        ip.toBuffer(peer.ip, b, offset);
        b.writeUInt16BE(peer.port, offset + 4);
        offset += 6;
    });

    return b;
};
