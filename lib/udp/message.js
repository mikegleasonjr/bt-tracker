var Message = module.exports = function Message() {
    this.err = null;
};

Message.prototype.sendTo = function(port, address) {
    return {
        'with': function(socket, callback) {
            if (!address) {
                address = port.address;
                port = port.port;
            }
            var buffer = this.getBuffer();
            socket.send(buffer, 0, buffer.length, port, address, callback);
        }.bind(this)
    };
};
