var portscanner = require('portscanner');


module.exports = function(done, callback) {
    portscanner.findAPortNotInUse(10000, 20000, '127.0.0.1', function(err, port) {
        if (err) {
            done(err);
        }
        else {
            callback(port);
        }
    });
};
