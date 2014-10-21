var spawn = require('child_process').spawn;
var getAvailablePort = require('../utils/randomPort');
var MongoDBBackend = require('../../lib/backends/mongodb');


describe('mongodb backend', function() {
    var backend = new MongoDBBackend();
//    var client;
    var server;

//    before(function(done) {
//        startMongoDBServer(function(proc, port) {
//            server = proc;
//            client = redis.createClient(port, '127.0.0.1');
//            backend.setConfig({
//                peerTTL: 1000,
//                host: '127.0.0.1',
//                port: port
//            });
//            done();
//        });
//    });

    afterEach(function(done) {
        done();
//        client.flushall(done);
    });

    after(function() {
//        client.end();
//        server.kill();
    });

    require('./common')(backend, 'mongodb');
});

function startMongoDBServer(callback) {
    getAvailablePort(function(port) {
        var proc = spawn('mongod', ['--dbpath=/tmp', '--port', port]);

        proc.stdout.on('data', function(data) {
            if (data.toString().indexOf('The server is now ready to accept connections') !== -1) {
                callback(proc, port);
            }
        });
    });
}
