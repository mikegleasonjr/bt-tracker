var extend = require('util')._extend;
var util = require('util');
var dgram = require('dgram');
var crypto = require('crypto');
var UdpFactory = require('../lib/udpFactory');
var Engine = require('../lib/engine');
var fixtures = require('./fixtures/fixtures.json');
require('should');


describe('udp', function() {
    var port;
    var udp;
    var engine = new Engine();
    var client;

    before(function() {
    });

    beforeEach(function() {
        client = dgram.createSocket('udp4');

        port = 50000 + Math.floor(Math.random() * 10000);

        udp = new UdpFactory().create();
        udp.setEngine(engine);
        udp.setConfig(configWith( { port: port }));

        engine.setConfig(fixtures.engine.config);

        udp.serve();
    });

    afterEach(function() {
        client.close();
        udp.stop();
    });

    describe('when the tracker receives 16 bytes not part of the protocol', function() {
        it('should not respond', function(done) {
            var msg = crypto.randomBytes(16);

            client.on('message', function() {
                done('unexpected response received from the server');
            });

            client.send(msg, 0, msg.length, port, '127.0.0.1');
            setTimeout(done, 50);
        });
    });

    describe('when connecting to tracker', function() {
        describe('when the connect request is valid', function() {
            it('should respond to the connection request', function(done) {
                var msg = new Buffer(16);
                var transId = crypto.randomBytes(4).readInt32BE(0);

                msg.writeDoubleBE(0x041727101980, 0);   // protocol id
                msg.writeInt32BE(0, 8);                 // 0 (connect)
                msg.writeInt32BE(transId, 12);          // transaction id

                client.on('message', function(reply) {
                    reply.length.should.equal(16);

                    reply.readInt32BE(0).should.equal(0);       // 0 (connect)
                    reply.readInt32BE(4).should.equal(transId); // transaction id
                    reply.readDoubleBE(8).should.be.ok;         // random connection id from server

                    done();
                });

                client.send(msg, 0, msg.length, port, '127.0.0.1');
            });
        });

        describe('when the message length is less than 16 bytes', function() {
            it('should not handle the connect request', function(done) {
                var msg = new Buffer(14);
                var transId = crypto.randomBytes(2).readInt16BE(0);

                msg.writeDoubleBE(0x041727101980, 0);   // protocol id
                msg.writeInt32BE(0, 8);                 // 0 (connect)
                msg.writeInt16BE(transId, 12);          // transaction id

                client.on('message', function() {
                    done('unexpected response received from the server');
                });

                client.send(msg, 0, msg.length, port, '127.0.0.1');
                setTimeout(done, 50);
            });
        });

        describe('when the message length is more than 16 bytes', function() {
            it('should handle the connect request and ignore the remaining bytes', function(done) {
                var msg = new Buffer(32);
                var transId = crypto.randomBytes(4).readInt32BE(0);

                msg.writeDoubleBE(0x041727101980, 0);   // protocol id
                msg.writeInt32BE(0, 8);                 // 0 (connect)
                msg.writeInt32BE(transId, 12);          // transaction id

                client.on('message', function(reply) {
                    reply.length.should.equal(16);

                    reply.readInt32BE(0).should.equal(0);       // 0 (connect)
                    reply.readInt32BE(4).should.equal(transId); // transaction id
                    reply.readDoubleBE(8).should.be.ok;         // random connection id from server

                    done();
                });

                client.send(msg, 0, msg.length, port, '127.0.0.1');
            });
        });

        describe('when the connection id is not the bittorent protocol identification', function() {
            it('should return an error', function(done) {
                var msg = new Buffer(16);
                var transId = crypto.randomBytes(4).readInt32BE(0);

                msg.writeDoubleBE(0x041727101981, 0);   // protocol id
                msg.writeInt32BE(0, 8);                 // 0 (connect)
                msg.writeInt32BE(transId, 12);          // transaction id

                client.on('message', function(reply) {
                    reply.length.should.equal(8 + 'invalid connection_id'.length);

                    reply.readInt32BE(0).should.equal(3);       // 3 (error)
                    reply.readInt32BE(4).should.equal(transId); // transaction id
                    reply.slice(8).toString().should.equal('invalid connection_id');

                    done();
                });

                client.send(msg, 0, msg.length, port, '127.0.0.1');
            });
        });
    });

    function configWith(overrides) {
        return extend(extend({}, fixtures.udp.config), overrides);
    }
});
