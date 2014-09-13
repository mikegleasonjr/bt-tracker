var request = require('supertest');
var dgram = require('dgram');
var crypto = require('crypto');
var givenCli = require('./utils/cli');
var givenAvailableRandomPort = require('./utils/randomPort');
var backends = require('../lib/backends');


// these are some integration tests to see if everything is wired up properly...
// see test/config.js for the command line unit tests
describe('command-line interface', function() {
    describe('when requesting help with --help', function() {
        it('should display some help and quit', function(done) {
            givenCli()
                .withParams(['--help'])
                .expectStdout('Usage: bt-tracker [options]')
                .onRun(done);
        });
    });

    describe('when not specifying any server to start', function() {
        it('should display a notice to use at least one server', function(done) {
            givenCli()
                .withParams(['--no-http', '--no-udp'])
                .expectStderr('Please start an HTTP server (--http) and or a UDP server (--udp)')
                .onRun(done);
        });
    });

    describe('when requesting an HTTP server on a specific port using arguments', function() {
        it('should start an HTTP server on that port', function(done) {
            givenAvailableRandomPort(function(port) {
                givenCli()
                    .withParams(['--http', '--http-port', port])
                    .whenStdout('HTTP server listening on port')
                    .check(function(done) {
                        request('http://localhost:' + port)
                            .get('/heartbeat')
                            .expect(200, 'OK', done);
                    })
                    .onRun(done);
            });
        });
    });

    describe('when requesting an HTTP server on a specific port using environment variables', function() {
        it('should start an HTTP server on that port', function(done) {
            givenAvailableRandomPort(function(port) {
                givenCli()
                    .withParams(['--http'])
                    .withEnv('BTT_HTTP_PORT', port)
                    .whenStdout('HTTP server listening on port')
                    .check(function(done) {
                        request('http://localhost:' + port)
                            .get('/heartbeat')
                            .expect(200, 'OK', done);
                    })
                    .onRun(done);
            });
        });
    });

    describe('when requesting an UDP server on a specific port using arguments', function() {
        it('should start an UDP server on that port', function(done) {
            givenAvailableRandomPort(function(port) {
                givenCli()
                    .withParams(['--udp', '--udp-port', port])
                    .whenStdout('UDP server listening on port')
                    .check(function(done) {
                        var client = dgram.createSocket('udp4');
                        var msg = validUDPConnectMessage();

                        client.on('message', function(reply) {
                            reply.length.should.equal(16);

                            reply.readInt32BE(0).should.equal(0);           // 0 (connect)
                            reply.readInt32BE(4).should.equal(msg.transId); // transaction id

                            done();
                        });

                        client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
                    })
                    .onRun(done);
            });
        });
    });

    describe('when requesting an UDP server on a specific port using environment variables', function() {
        it('should start an UDP server on that port', function(done) {
            givenAvailableRandomPort(function(port) {
                givenCli()
                    .withParams(['--udp'])
                    .withEnv('BTT_UDP_PORT', port)
                    .whenStdout('UDP server listening on port')
                    .check(function(done) {
                        var client = dgram.createSocket('udp4');
                        var msg = validUDPConnectMessage();

                        client.on('message', function(reply) {
                            reply.length.should.equal(16);

                            reply.readInt32BE(0).should.equal(0);           // 0 (connect)
                            reply.readInt32BE(4).should.equal(msg.transId); // transaction id

                            done();
                        });

                        client.send(msg.buffer, 0, msg.buffer.length, port, '127.0.0.1');
                    })
                    .onRun(done);
            });
        });
    });

    describe('when listing available backends', function() {
        it('should display the available backends and quit', function(done) {
            givenCli()
                .withParams(['--list-backends'])
                .expectStdout(backends.list().join(' '))
                .onRun(done);
        });
    });

    function validUDPConnectMessage() {
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
});
