var Message = module.exports = function Message() {
};

Message.prototype.sendTo = function(port, address) {
    return {
        using: function(socket, callback) {
            if (!address) {
                var rinfo = port;
                address = rinfo.address;
                port = rinfo.port;
            }
            var buffer = this.getBuffer();
            socket.send(buffer, 0, buffer.length, port, address, callback);
        }.bind(this)
    };
};
