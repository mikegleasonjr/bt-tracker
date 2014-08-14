var request = require('supertest');
var bencode = require('bencode');
var sinon = require('sinon');
var nodeHttp = require('http');
var extend = require('util')._extend;
var util = require('util');
var HttpFactory = require('../lib/httpFactory');
var Engine = require('../lib/engine');
var pkg = require('../package.json');
var fixtures = require('./fixtures/fixtures.json');
var express = require('express');
var compact2string = require('compact2string');
require('should');


describe('http', function() {
    var http = new HttpFactory().create();
    var engine = new Engine();

    before(function() {
        http.setEngine(engine);

        http.app.get('/test-reverse-proxy', function(req, res) {
            res.send(req.ip);
        });

        http.app.get('/test-http-compression', function(req, res) {
            res.end(new Array(1025).join('a'));
        });
    });

    beforeEach(function() {
        engine.setConfig(fixtures.engine.config);
        http.setConfig(fixtures.http.config);
    });

    describe('when calling serve', function() {
        it('should start listening on the configured port', function() {
            sinon.stub(util, 'log');
            http.setConfig(configWith({ port: 9188 }));
            var mock = sinon.mock(http.app)
                .expects('listen').once()
                .withExactArgs(9188, sinon.match.func)
                .yields();

            http.serve();
            mock.verify();
            util.log.restore();
        });
    });

    describe('when enabling reverse proxy support', function() {
        it('should honor the X-Forwarded-For request header', function(done) {
            http.setConfig(configWith({ trustProxy: true }));

            request(http.app)
                .get('/test-reverse-proxy')
                .set('X-Forwarded-For', '1.2.3.4')
                .expect(200, '1.2.3.4', done);
        });
    });

    describe('when disabling reverse proxy support', function() {
        it('should ignore the X-Forwarded-For request header', function(done) {
            http.setConfig(configWith({ trustProxy: false }));

            request(http.app)
                .get('/test-reverse-proxy')
                .set('X-Forwarded-For', '1.2.3.4')
                .expect(200, '127.0.0.1', done);
        });
    });

    describe('when disabling HTTP compression', function() {
        describe('when HTTP compression is requested by the client', function() {
            it('should respond with an uncompressed response', function(done) {
                http.setConfig(configWith({ compress: false }));
                request(http.app)
                    .get('/test-http-compression')
                    .set('Accept-Encoding: gzip, deflate')
                    .end(function(err, res) {
                        res.headers.should.not.have.property('content-encoding');
                        done(err);
                    });
            });
        });
    });

    describe('when enabling HTTP compression', function() {
        describe('when HTTP compression is not requested by the client', function() {
            it('should respond with an uncompressed response', function(done) {
                http.setConfig(configWith({ compress: true }));
                request(http.app)
                    .get('/test-http-compression')
                    .set('Accept-Encoding', '')
                    .end(function(err, res) {
                        res.headers.should.not.have.property('content-encoding');
                        done(err);
                    });
            });
        });

        describe('when HTTP compression is requested by the client', function() {
            it('should respond with a compressed response', function(done) {
                http.setConfig(configWith({ compress: true }));
                request(http.app)
                    .get('/test-http-compression')
                    .set('Accept-Encoding: gzip, deflate')
                    .expect('Content-Encoding', /(gzip|deflate)/)
                    .expect(new Array(1025).join('a'), done);
            });
        });
    });

    describe('when requesting resource /heartbeat', function() {
        it('should respond 200', function(done) {
            request(http.app)
                .get('/heartbeat')
                .expect(200, done);
        });

        it('should respond with text', function(done) {
            request(http.app)
                .get('/heartbeat')
                .expect('OK')
                .end(done);
        });
    });

    describe('when requesting resource /heartbeat/', function() {
        it('should respond 404', function(done) {
            request(http.app)
                .get('/heartbeat/')
                .expect(404, done);
        });
    });

    describe('when requesting resource', function() {
        ['/heartbeat', '/announce'].forEach(function(res) {
            describe(res, function() {
                it('should respond with the response processing time in the headers', function(done) {
                    request(http.app)
                        .get(res)
                        .expect('X-Response-Time', /[0-9]+ms/, done);
                });

                it('should respond with the bt-tracker version in the headers', function(done) {
                    request(http.app)
                        .get(res)
                        .expect('X-Powered-By', pkg.name + ' ' + pkg.version, done);
                });

                it('should respond as text/plain', function(done) {
                    request(http.app)
                        .get(res)
                        .expect('Content-Type', /text\/plain/, done);
                });
            });
        });
    });

    describe('when requesting resource /announce', function() {
        it('should forward the parameters to the engine', function(done) {
            var mock = sinon.mock(engine);
            mock.expects('announce')
                .once()
                .withExactArgs({
                    info_hash: new Buffer('\x12\x34\x56\x78\x9a\xbc\xde\xf1\x23\x45\x67\x89\xab\xcd\xef\x12\x34\x56\x78\x9a').toString(),
                    peer_id: unescape('-UM1840-%13u%d9Tb%df%d4%bd%c7w%82%e0'),
                    port: '59696',
                    uploaded: '1024',
                    downloaded: '2048',
                    left: '4096',
                    compact: '1',
                    event: 'started',
                    numwant: '50',
                    ip: '108.33.44.13',
                    no_peer_id: '1'
                }, sinon.match.func)
                .yields(null, fixtures.engine.announceResult);

            request(http.app)
                .get(fixtures.http.validAnnounceUrl)
                .end(function() {
                    mock.verify();
                    done();
                });
        });

        describe('when ip is not specified by the client', function() {
            var originalRequestIpGetHandler;

            before(function() {
                originalRequestIpGetHandler = Object.getOwnPropertyDescriptor(express.request, 'ip').get;
                Object.defineProperty(express.request, 'ip', {
                    get: function() { return '4.5.6.7'; }
                });
            });

            after(function() {
                Object.defineProperty(express.request, 'ip', {
                    configurable: true,
                    enumerable: true,
                    get: originalRequestIpGetHandler
                });
            });

            it('should call the engine with the client\'s ip', function(done) {
                var mock = sinon.mock(engine);
                mock.expects('announce')
                    .once()
                    .withExactArgs(sinon.match({ ip: '4.5.6.7' }), sinon.match.func)
                    .yields(null, fixtures.engine.announceResult);

                request(http.app)
                    .get(fixtures.http.validAnnounceUrlWithoutIP)
                    .end(function() {
                        mock.verify();
                        done();
                    });
            });
        });

        describe('when the engine returns an error', function() {
            it('should return a bencoded error to the client', function(done) {
                sinon.stub(engine, 'announce').yields('unexpected error', fixtures.engine.announceResult);

                request(http.app)
                    .get(fixtures.http.validAnnounceUrl)
                    .expect(200, bencode.encode({ 'failure reason': 'unexpected error' }).toString())
                    .end(function(err) {
                        engine.announce.restore();
                        done(err);
                    });
            });
        });

        describe('when the engine returns a valid response', function() {
            // TODO, ugly hack because supertest/superagent does not support
            // a `Buffer` response, they transform it to utf8 and we loose the
            // original stream. We can't convert it back to a `Buffer` and
            // properly bdecode it...
            var server = nodeHttp.createServer(http.app);
            var baseUrl;

            before(function(done) {
                server.listen(0, function() {
                    baseUrl = 'http://localhost:' + server.address().port;
                    done();
                });
            });

            after(function() {
                server.close();
            });

            it('should return the configured interval', function(done) {
                var expectedInterval = Math.floor(Math.random() * 1000);
                sinon.stub(engine, 'announce').yields(null, fixtures.engine.announceResult);

                http.setConfig(configWith({ interval: expectedInterval }));

                nodeHttp.get(baseUrl + fixtures.http.validAnnounceUrl, function(res) {
                    var buffer = new Buffer(0);
                    res.on('data', function(data) {
                        buffer = Buffer.concat([buffer, data], buffer.length + data.length);
                    });
                    res.on('end', function() {
                        bencode.decode(buffer).interval.should.equal(expectedInterval);
                        engine.announce.restore();
                        done();
                    });
                });
            });

            it('should return the number of seeders', function(done) {
                sinon.stub(engine, 'announce').yields(null, fixtures.engine.announceResult);

                nodeHttp.get(baseUrl + fixtures.http.validAnnounceUrl, function(res) {
                    var buffer = new Buffer(0);
                    res.on('data', function(data) {
                        buffer = Buffer.concat([buffer, data], buffer.length + data.length);
                    });
                    res.on('end', function() {
                        bencode.decode(buffer).complete.should.equal(14132);
                        engine.announce.restore();
                        done();
                    });
                });
            });

            it('should return the number of leechers', function(done) {
                sinon.stub(engine, 'announce').yields(null, fixtures.engine.announceResult);

                nodeHttp.get(baseUrl + fixtures.http.validAnnounceUrl, function(res) {
                    var buffer = new Buffer(0);
                    res.on('data', function(data) {
                        buffer = Buffer.concat([buffer, data], buffer.length + data.length);
                    });
                    res.on('end', function() {
                        bencode.decode(buffer).incomplete.should.equal(21341);
                        engine.announce.restore();
                        done();
                    });
                });
            });

            describe('when a compact response has been requested', function() {
                it('should return a compact peers list', function(done) {
                    sinon.stub(engine, 'announce').yields(null, fixtures.engine.announceResult);

                    nodeHttp.get(baseUrl + fixtures.http.validAnnounceUrl, function(res) {
                        var buffer = new Buffer(0);
                        res.on('data', function(data) {
                            buffer = Buffer.concat([buffer, data], buffer.length + data.length);
                        });
                        res.on('end', function() {
                            var decoded = bencode.decode(buffer);
                            compact2string.multi(decoded.peers).should.eql([
                                '1.2.3.4:58901',
                                '2.2.3.4:58902',
                                '3.2.3.4:58903',
                                '4.2.3.4:58904',
                                '5.2.3.4:58905',
                                '6.2.3.4:58906',
                                '7.2.3.4:58907',
                                '8.2.3.4:58908',
                                '9.2.3.4:58909',
                                '10.2.3.4:58910'
                            ]);
                            engine.announce.restore();
                            done();
                        });
                    });
                });
            });

            describe('when a compact response has not been specified', function() {
                it('should return a non-compact peers list', function(done) {
                    sinon.stub(engine, 'announce').yields(null, fixtures.engine.announceResult);

                    request(http.app)
                        .get(fixtures.http.validAnnounceUrlWithoutCompact)
                        .end(function(err, res) {
                            var peers = bencode.decode(res.text).peers.map(function(peer) {
                                peer['peer id'] = peer['peer id'].toString();
                                peer.ip = peer.ip.toString();
                                return peer;
                            });

                            peers.should.eql([
                                { 'peer id': 'peer1', ip: '1.2.3.4', port: 58901 },
                                { 'peer id': 'peer2', ip: '2.2.3.4', port: 58902 },
                                { 'peer id': 'peer3', ip: '3.2.3.4', port: 58903 },
                                { 'peer id': 'peer4', ip: '4.2.3.4', port: 58904 },
                                { 'peer id': 'peer5', ip: '5.2.3.4', port: 58905 },
                                { 'peer id': 'peer6', ip: '6.2.3.4', port: 58906 },
                                { 'peer id': 'peer7', ip: '7.2.3.4', port: 58907 },
                                { 'peer id': 'peer8', ip: '8.2.3.4', port: 58908 },
                                { 'peer id': 'peer9', ip: '9.2.3.4', port: 58909 },
                                { 'peer id': 'peer10', ip: '10.2.3.4', port: 58910 },
                            ]);
                            engine.announce.restore();
                            done(err);
                        });
                });

                describe('when a client asks to ommit the peer id field', function() {
                    it('should return a non-compact peers list without the peer id field', function(done) {
                        sinon.stub(engine, 'announce').yields(null, fixtures.engine.announceResult);

                        request(http.app)
                            .get(fixtures.http.validAnnounceUrlWithNoPeerId)
                            .end(function(err, res) {
                                var peers = bencode.decode(res.text).peers.map(function(peer) {
                                    peer.ip = peer.ip.toString();
                                    return peer;
                                });

                                peers.should.eql([
                                    { ip: '1.2.3.4', port: 58901 },
                                    { ip: '2.2.3.4', port: 58902 },
                                    { ip: '3.2.3.4', port: 58903 },
                                    { ip: '4.2.3.4', port: 58904 },
                                    { ip: '5.2.3.4', port: 58905 },
                                    { ip: '6.2.3.4', port: 58906 },
                                    { ip: '7.2.3.4', port: 58907 },
                                    { ip: '8.2.3.4', port: 58908 },
                                    { ip: '9.2.3.4', port: 58909 },
                                    { ip: '10.2.3.4', port: 58910 },
                                ]);
                                engine.announce.restore();
                                done(err);
                            });
                    });
                });
            });
        });
    });

    function configWith(overrides) {
        return extend(extend({}, fixtures.http.config), overrides);
    }
});
