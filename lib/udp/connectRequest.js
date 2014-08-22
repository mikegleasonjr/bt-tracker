var inherits = require('util').inherits;
var Message = require('./message');
var ConnectReply = require('./connectReply');


var ConnectRequest = module.exports = function ConnectRequest(transId, connId) {
    Message.call(this);

    this.action = 0;
    this.connId = connId || 0x041727101980;
    this.transId = transId;
};

inherits(ConnectRequest, Message);

ConnectRequest.parse = function(bytes) {
    var connId;
    var action;
    var transId;

    if (bytes.length < 16) {
        return null;
    }

    action = bytes.readInt32BE(8);

    if (action !== 0) {
        return null;
    }

    connId = bytes.readDoubleBE(0);
    transId = bytes.readInt32BE(12);

    var cr = new ConnectRequest(transId, connId);

    if (connId !== 0x041727101980) {
        cr.err = 'invalid connection_id';
    }

    return  cr;
};

ConnectRequest.prototype.toReply = function(connId) {
    return new ConnectReply(this.transId, connId);
};
