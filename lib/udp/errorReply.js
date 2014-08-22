var inherits = require('util').inherits;
var Message = require('./message');


var ErrorReply = module.exports = function ErrorReply(err, transId) {
    Message.call(this);

    this.action = 3;
    this.err = err.toString();
    this.transId = transId;
};

inherits(ErrorReply, Message);

ErrorReply.prototype.error = true;

ErrorReply.prototype.getBuffer = function() {
    var b = new Buffer(8 + this.err.length);

    b.writeInt32BE(this.action, 0);
    b.writeInt32BE(this.transId, 4);
    b.write(this.err, 8, this.err.length);

    return b;
};
