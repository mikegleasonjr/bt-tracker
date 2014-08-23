var inherits = require('util').inherits;
var Message = require('./message');


var ConnectReply = module.exports = function ConnectReply(transId, connId) {
    Message.call(this);

    this.action = 0;
    this.transId = transId;
    this.connId = connId;
};

inherits(ConnectReply, Message);

ConnectReply.prototype.getBuffer = function() {
    var b = new Buffer(16);

    b.writeInt32BE(this.action, 0);
    b.writeInt32BE(this.transId, 4);
    this.connId.copy(b, 8);

    return b;
};
