var inherits = require('util').inherits;
var Message = require('./message');
var ErrorReply = require('./errorReply');
var AnnounceReply = require('./announceReply');
var ip = require('ip');


var AnnounceRequest = module.exports = function AnnounceRequest(params) {
    Message.call(this);
    this.params = params;
};

inherits(AnnounceRequest, Message);

AnnounceRequest.parse = function(bytes) {
    if (bytes.length < 98 || bytes.readInt32BE(8) !== 1) {
        return null;
    }

    return new AnnounceRequest({
        connId: bytes.slice(0, 8),
        transId: bytes.readInt32BE(12),
        infoHash: bytes.slice(16, 36),
        peerId: bytes.slice(36, 56),
        downloaded: bytes.readDoubleBE(56),
        left: bytes.readDoubleBE(64),
        uploaded: bytes.readDoubleBE(72),
        event: AnnounceRequest.toEventString(bytes.readInt32BE(80)),
        ip: ip.toString(bytes, 84, 4),
        key: bytes.readInt32BE(88),
        numWant: bytes.readInt32BE(92),
        port: bytes.readInt16BE(96)
    });
};

AnnounceRequest.toEventString = function(eventId) {
    switch (eventId) {
        case 0: return undefined;
        case 1: return 'completed';
        case 2: return 'started';
        case 3: return 'stopped';
        default: return 'unknown event';
    }
};

AnnounceRequest.prototype.toReply = function(err, interval, swarm) {
    return err ?
        new ErrorReply(err, this.params.transId) :
        new AnnounceReply(this.params.transId, interval, swarm);
};
