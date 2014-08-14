var http = require('http');


module.exports = function(callback) {
    var server = http.createServer().listen(0, function() {
        var port = this.address().port;
        server.close();
        callback(port);
    });
};
