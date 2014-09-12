var inherits = require('util').inherits;
var Message = require('./message');
var ErrorReply = require('./errorReply');
var ConnectReply = require('./connectReply');


var ConnectRequest = module.exports = function ConnectRequest(params) {
    Message.call(this);
    this.params = params;
};

inherits(ConnectRequest, Message);

ConnectRequest.parse = function(bytes) {
    if (bytes.length < 16 || bytes.readInt32BE(8) !== 0) {
        return null;
    }

    return new ConnectRequest({
        connId: bytes.slice(0, 8),
        transId: bytes.readInt32BE(12)
    });
};

ConnectRequest.prototype.toReply = function(err, connId) {
    return err ?
        new ErrorReply(err, this.params.transId) :
        new ConnectReply(this.params.transId, connId);
};
