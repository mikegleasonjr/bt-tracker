var sinon = require('sinon');
var extend = require('util')._extend;
var util = require('util');
var dgram = require('dgram');
var crypto = require('crypto');
var ip = require('ip');
var backends = require('../lib/backends');
var UdpFactory = require('../lib/udpFactory');
var Engine = require('../lib/engine');
var fixtures = require('./fixtures/fixtures.json');
require('should');


describe('udp', function() {
    var port;
    var udp;
    var engine = new Engine();
    var client;
    var backend = backends.get('memory');

    before(function() {
        engine.setBackend(backend);
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
            var msg = crypto.pseudoRandomBytes(16);

            client.on('message', function() {
                done('unexpected response received from the server');
            });

            client.send(msg, 0, msg.length, port, '127.0.0.1');
            setTimeout(done, 50);
        });
    });

    describe('when the tracker receives 98 bytes not part of the protocol', function() {
        it('should not respond', function(done) {
            var msg = crypto.pseudoRandomBytes(98);

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
                var msg = validConnectMessage();

                client.on('message', function(reply) {
                    reply.length.should.equal(16);

                    reply.readInt32BE(0).should.equal(0);           // 0 (connect)
                    reply.readInt32BE(4).should.equal(msg.transId); // transaction id

                    done();
                });

                client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
            });

            it('should returns the connection id received from the engine', function(done) {
                var msg = validConnectMessage();
                var connId = crypto.pseudoRandomBytes(8);
                var mock = sinon.mock(engine);
                mock.expects('connect')
                    .once()
                    .withExactArgs(sinon.match.func)
                    .yields(null, connId);

                client.on('message', function(reply) {
                    mock.verify();
                    reply.slice(8).toString('hex').should.equal(connId.toString('hex'));
                    done();
                });

                client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
            });

            describe('when the engine returns an error', function() {
                it('should bubble up', function(done) {
                    var msg = validConnectMessage();
                    var stub = sinon.stub(engine, 'connect').yields('db connection error');

                    client.on('message', function(reply) {
                        stub.restore();
                        assertError(reply, 'db connection error', msg.transId, done);
                    });

                    client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
                });
            });
        });

        describe('when the message length is less than 16 bytes', function() {
            it('should not handle the connect request', function(done) {
                var msg = validConnectMessage().buffer.slice(0, 14);

                client.on('message', function() {
                    done('unexpected response received from the server');
                });

                client.send(msg, 0, msg.length, port, '127.0.0.1');
                setTimeout(done, 50);
            });
        });

        describe('when the message length is more than 16 bytes', function() {
            it('should handle the connect request and ignore the remaining bytes', function(done) {
                var msg = validConnectMessage();

                msg.buffer = Buffer.concat([msg.buffer, new Buffer(20)]);

                client.on('message', function(reply) {
                    reply.length.should.equal(16);

                    reply.readInt32BE(0).should.equal(0);           // 0 (connect)
                    reply.readInt32BE(4).should.equal(msg.transId); // transaction id

                    done();
                });

                client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
            });
        });

        describe('when the connection id is not the bittorent protocol identification', function() {
            it('should return an error', function(done) {
                var msg = validConnectMessage();

                msg.buffer.writeDoubleBE(0x111111111111, 0);        // protocol id

                client.on('message', function(reply) {
                    assertError(reply, 'invalid connection_id', msg.transId, done);
                });

                client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
            });
        });
    });

    describe('when announcing to the tracker', function() {
        describe('when verifying for a valid connection', function() {
            it('should call the backend', function(done) {
                var msg = validAnnounceMessage();
                var mock = sinon.mock(engine);
                mock.expects('isConnected')
                    .once()
                    .withExactArgs(sinon.match(function(value) {
                        return value instanceof Buffer && value.toString('hex') === msg.connId.toString('hex');
                    }), sinon.match.func)
                    .yields(null, false);

                client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');

                setTimeout(function() {
                    mock.verify();
                    done();
                }, 50);
            });

            describe('when the client is not connected', function() {
                it('should return an error', function(done) {
                    sinon.stub(engine, 'isConnected').yields(null, false);
                    var msg = validAnnounceMessage();

                    client.on('message', function(reply) {
                        engine.isConnected.restore();
                        assertError(reply, 'not connected', msg.transId, done);
                    });

                    client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
                });
            });

            describe('when the engine returns an error', function() {
                it('should bubble up', function(done) {
                    sinon.stub(engine, 'isConnected').yields('db connection error');
                    var msg = validAnnounceMessage();

                    client.on('message', function(reply) {
                        engine.isConnected.restore();
                        assertError(reply, 'db connection error', msg.transId, done);
                    });

                    client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
                });
            });
        });

        describe('when connected', function() {
            before(function() {
                sinon.stub(engine, 'isConnected').yields(null, true);
            });

            after(function() {
                engine.isConnected.restore();
            });

            it('should forward the parameters to the engine', function(done) {
                var msg = validAnnounceMessage();
                var mock = sinon.mock(engine);
                mock.expects('announce')
                    .once()
                    .withExactArgs(sinon.match({
                        infoHash: sinon.match(function(infoHash) { return infoHash.toString('hex') === msg.infoHash.toString('hex'); }),
                        peerId: sinon.match(function(peerId) { return peerId.toString('hex') === msg.peerId.toString('hex'); }),
                        port: 5889,
                        uploaded: 4096,
                        downloaded: 1024,
                        left: 2048,
                        event: 'started',
                        numWant: 43,
                        key: msg.key,
                        ip: '108.33.44.13'
                    }), sinon.match.func)
                    .yields(null, announceResult());

                client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');

                setTimeout(function() {
                    mock.verify();
                    done();
                }, 50);
            });

            describe('when the engine returns an error', function() {
                it('should bubble up', function(done) {
                    sinon.stub(engine, 'announce').yields('db connection error');
                    var msg = validAnnounceMessage();

                    client.on('message', function(reply) {
                        engine.announce.restore();
                        assertError(reply, 'db connection error', msg.transId, done);
                    });

                    client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
                });
            });

            describe('when the engine returns a valid response', function() {
                before(function() {
                    sinon.stub(engine, 'announce').yields(null, announceResult());
                });

                after(function() {
                    engine.announce.restore();
                });

                it('should declare the response as an announce response', function(done){
                    var msg = validAnnounceMessage();

                    client.on('message', function(reply) {
                        reply.readInt32BE(0).should.equal(1);           // 1 (announce)
                        done();
                    });

                    client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
                });

                it('should return the supplied transaction id', function(done) {
                    var msg = validAnnounceMessage();

                    client.on('message', function(reply) {
                        reply.readInt32BE(4).should.equal(msg.transId); // transaction id
                        done();
                    });

                    client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
                });

                it('should return the configured interval', function(done) {
                    var msg = validAnnounceMessage();
                    var expectedInterval = Math.floor(Math.random() * 1000);

                    udp.setConfig(configWith({ interval: expectedInterval }));

                    client.on('message', function(reply) {
                        reply.readInt32BE(8).should.equal(expectedInterval);
                        done();
                    });

                    client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
                });

                it('should return the number of leechers', function(done) {
                    var msg = validAnnounceMessage();

                    client.on('message', function(reply) {
                        reply.readInt32BE(12).should.equal(21341);      // leechers
                        done();
                    });

                    client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
                });

                it('should return the number of seeders', function(done) {
                    var msg = validAnnounceMessage();

                    client.on('message', function(reply) {
                        reply.readInt32BE(16).should.equal(14132);      // seeders
                        done();
                    });

                    client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
                });

                it('should return the peers list', function(done) {
                    var msg = validAnnounceMessage();

                    client.on('message', function(reply) {
                        reply.length.should.equal(20 + (10 * 6));

                        for (var i = 0; i < 10; i++) {
                            ip.toString(reply, 20 + (i * 6), 4).should.equal((i + 1) + '.2.3.4');
                            reply.readUInt16BE(20 + (i * 6) + 4).should.equal(58901 + i);
                        }

                        done();
                    });

                    client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
                });
            });
        });
    });

    function validConnectMessage() {
        var buffer = new Buffer(16);
        var transId = crypto.pseudoRandomBytes(4).readInt32BE(0);
        var connId = new Buffer([0x0, 0x0, 0x4, 0x17, 0x27, 0x10, 0x19, 0x80]);

        connId.copy(buffer, 0);                     // connection id
        buffer.writeInt32BE(0, 8);                  // 0 (connect)
        buffer.writeInt32BE(transId, 12);           // transaction id

        return {
            buffer: buffer,
            transId: transId
        };
    }

    function validAnnounceMessage() {
        var buffer = new Buffer(98);
        var connId = crypto.pseudoRandomBytes(8);
        var transId = crypto.pseudoRandomBytes(4).readInt32BE(0);
        var key = crypto.pseudoRandomBytes(4).readInt32BE(0);
        var infoHash = new Buffer([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf1, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x9a]);
        var peerId = new Buffer([0x67, 0x89, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x9a, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf1, 0x23, 0x45]);

        connId.copy(buffer, 0);                     // connection id
        buffer.writeInt32BE(1, 8);                  // 1 (announce)
        buffer.writeInt32BE(transId, 12);           // transaction id
        infoHash.copy(buffer, 16);                  // info hash
        peerId.copy(buffer, 36);                    // peer id
        buffer.writeDoubleBE(1024, 56);             // downloaded
        buffer.writeDoubleBE(2048, 64);             // left
        buffer.writeDoubleBE(4096, 72);             // uploaded
        buffer.writeInt32BE(2, 80);                 // event (0-none, 1-completed, 2-started, 3-stopped)
        buffer.writeInt32BE(1814113293, 84);        // ip (108.33.44.13)
        buffer.writeInt32BE(key, 88);               // key TODO ??
        buffer.writeInt32BE(43, 92);                // numwant TODO, engine should support -1, see UDP spec
        buffer.writeInt16BE(5889, 96);              // port

        return {
            buffer: buffer,
            infoHash: infoHash,
            peerId: peerId,
            connId: connId,
            transId: transId,
            key: key
        };
    }

    function configWith(overrides) {
        return extend(extend({}, fixtures.udp.config), overrides);
    }

    function assertError(reply, desc, transId, done) {
        reply.length.should.equal(8 + desc.length);

        reply.readInt32BE(0).should.equal(3);           // 3 (error)
        reply.readInt32BE(4).should.equal(transId);     // transaction id
        reply.slice(8).toString().should.equal(desc);

        done();
    }

    function announceResult() {
        return {
            "seeders": 14132,
            "leechers": 21341,
            "peers": [
                { id: crypto.pseudoRandomBytes(20), ip: '1.2.3.4', port: 58901 },
                { id: crypto.pseudoRandomBytes(20), ip: '2.2.3.4', port: 58902 },
                { id: crypto.pseudoRandomBytes(20), ip: '3.2.3.4', port: 58903 },
                { id: crypto.pseudoRandomBytes(20), ip: '4.2.3.4', port: 58904 },
                { id: crypto.pseudoRandomBytes(20), ip: '5.2.3.4', port: 58905 },
                { id: crypto.pseudoRandomBytes(20), ip: '6.2.3.4', port: 58906 },
                { id: crypto.pseudoRandomBytes(20), ip: '7.2.3.4', port: 58907 },
                { id: crypto.pseudoRandomBytes(20), ip: '8.2.3.4', port: 58908 },
                { id: crypto.pseudoRandomBytes(20), ip: '9.2.3.4', port: 58909 },
                { id: crypto.pseudoRandomBytes(20), ip: '10.2.3.4', port: 58910 }
            ]
        };
    }
});
