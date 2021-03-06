var request = require('hippie');
var bencode = require('bencode');
var sinon = require('sinon');
var extend = require('util')._extend;
var util = require('util');
var crypto = require('crypto');
var buffertools = require('buffertools');
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
                .header('X-Forwarded-For', '1.2.3.4')
                .expectStatus(200)
                .expectBody('1.2.3.4')
                .end(done);
        });
    });

    describe('when disabling reverse proxy support', function() {
        it('should ignore the X-Forwarded-For request header', function(done) {
            http.setConfig(configWith({ trustProxy: false }));

            request(http.app)
                .get('/test-reverse-proxy')
                .header('X-Forwarded-For', '1.2.3.4')
                .expectStatus(200)
                .expectBody(/127\.0\.0\.1/)
                .end(done);
        });
    });

    describe('when disabling HTTP compression', function() {
        describe('when HTTP compression is requested by the client', function() {
            it('should respond with an uncompressed response', function(done) {
                http.setConfig(configWith({ compress: false }));
                request(http.app)
                    .get('/test-http-compression')
                    .header('Accept-Encoding', 'gzip, deflate')
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
                    .header('Accept-Encoding', '')
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
                    .header('Accept-Encoding', 'gzip, deflate')
                    .expectHeader('Content-Encoding', /(gzip|deflate)/)
                    .end(done);
            });
        });
    });

    describe('when requesting resource /heartbeat', function() {
        it('should respond 200', function(done) {
            request(http.app)
                .get('/heartbeat')
                .expectStatus(200)
                .end(done);
        });

        it('should respond with text', function(done) {
            request(http.app)
                .get('/heartbeat')
                .expectBody('OK')
                .end(done);
        });
    });

    describe('when requesting resource /heartbeat/', function() {
        it('should respond 404', function(done) {
            request(http.app)
                .get('/heartbeat/')
                .expectStatus(404)
                .end(done);
        });
    });

    describe('when requesting resource', function() {
        ['/heartbeat', '/announce'].forEach(function(res) {
            describe(res, function() {
                it('should respond with the response processing time in the headers', function(done) {
                    request(http.app)
                        .get(res)
                        .expectHeader('X-Response-Time', /[0-9]+ms/)
                        .end(done);
                });

                it('should respond with the bt-tracker version in the headers', function(done) {
                    request(http.app)
                        .get(res)
                        .expectHeader('X-Powered-By', pkg.name + ' ' + pkg.version)
                        .end(done);
                });

                it('should respond as text/plain', function(done) {
                    request(http.app)
                        .get(res)
                        .expectHeader('Content-Type', /text\/plain/)
                        .end(done);
                });
            });
        });
    });

    describe('when requesting resource /announce', function() {
        it('should forward the parameters to the engine', function(done) {
            var expectedInfoHash = new Buffer([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf1, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x9a]);
            var expectedPeerId = new Buffer([0x67, 0x89, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x9a, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf1, 0x23, 0x45]);
            var mock = sinon.mock(engine);
            mock.expects('announce')
                .once()
                .withExactArgs({
                    infoHash: sinon.match(function(infoHash) { return buffertools.equals(infoHash, expectedInfoHash); }),
                    peerId: sinon.match(function(peerId) { return buffertools.equals(peerId, expectedPeerId); }),
                    port: 59696,
                    uploaded: 1024,
                    downloaded: 2048,
                    left: 4096,
                    compact: 1,
                    event: 'started',
                    numWant: 50,
                    ip: '108.33.44.13',
                    noPeerId: 1
                }, sinon.match.func)
                .yields(null, announceResult());

            bencodedRequest()
                .get(fixtures.http.validAnnounceUrl)
                .end(function(err) {
                    mock.verify();
                    done(err);
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
                    .yields(null, announceResult());

                bencodedRequest()
                    .get(fixtures.http.validAnnounceUrlWithoutIP)
                    .end(function(err) {
                        mock.verify();
                        done(err);
                    });
            });
        });

        describe('when the engine returns an error', function() {
            it('should return a bencoded error to the client', function(done) {
                sinon.stub(engine, 'announce').yields('unexpected error', announceResult());

                bencodedRequest()
                    .get(fixtures.http.validAnnounceUrl)
                    .expectStatus(200)
                    .expectBody({ 'failure reason': new Buffer('unexpected error') })
                    .end(function(err) {
                        engine.announce.restore();
                        done(err);
                    });
            });
        });

        describe('when the engine returns a valid response', function() {
            it('should return the configured interval', function(done) {
                var expectedInterval = Math.floor(Math.random() * 1000);
                sinon.stub(engine, 'announce').yields(null, announceResult());

                http.setConfig(configWith({ interval: expectedInterval }));

                bencodedRequest()
                    .get(fixtures.http.validAnnounceUrl)
                    .expectStatus(200)
                    .end(function(err, res, body) {
                        body.interval.should.equal(expectedInterval);
                        engine.announce.restore();
                        done(err);
                    });
            });

            it('should return the number of seeders', function(done) {
                sinon.stub(engine, 'announce').yields(null, announceResult());

                bencodedRequest()
                    .get(fixtures.http.validAnnounceUrl)
                    .expectStatus(200)
                    .end(function(err, res, body) {
                        body.complete.should.equal(14132);
                        engine.announce.restore();
                        done(err);
                    });
            });

            it('should return the number of leechers', function(done) {
                sinon.stub(engine, 'announce').yields(null, announceResult());

                bencodedRequest()
                    .get(fixtures.http.validAnnounceUrl)
                    .expectStatus(200)
                    .end(function(err, res, body) {
                        body.incomplete.should.equal(21341);
                        engine.announce.restore();
                        done(err);
                    });
            });

            describe('when a compact response has been requested', function() {
                it('should return a compact peers list', function(done) {
                    sinon.stub(engine, 'announce').yields(null, announceResult());

                    bencodedRequest()
                        .get(fixtures.http.validAnnounceUrl)
                        .expectStatus(200)
                        .end(function(err, res, body) {
                            compact2string.multi(body.peers).should.eql([
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
                            done(err);
                        });
                });
            });

            describe('when a compact response has not been specified', function() {
                it('should return a non-compact peers list', function(done) {
                    var expectedResult = announceResult();
                    sinon.stub(engine, 'announce').yields(null, expectedResult);

                    bencodedRequest()
                        .get(fixtures.http.validAnnounceUrlWithoutCompact)
                        .expectStatus(200)
                        .end(function(err, res, body) {
                            var peers = body.peers.map(function(peer) {
                                peer.ip = peer.ip.toString();
                                return peer;
                            });

                            peers.length.should.equal(expectedResult.peers.length);
                            peers.should.containEql({ 'peer id': expectedResult.peers[0].id, ip: '1.2.3.4', port: 58901 });
                            peers.should.containEql({ 'peer id': expectedResult.peers[1].id, ip: '2.2.3.4', port: 58902 });
                            peers.should.containEql({ 'peer id': expectedResult.peers[2].id, ip: '3.2.3.4', port: 58903 });
                            peers.should.containEql({ 'peer id': expectedResult.peers[3].id, ip: '4.2.3.4', port: 58904 });
                            peers.should.containEql({ 'peer id': expectedResult.peers[4].id, ip: '5.2.3.4', port: 58905 });
                            peers.should.containEql({ 'peer id': expectedResult.peers[5].id, ip: '6.2.3.4', port: 58906 });
                            peers.should.containEql({ 'peer id': expectedResult.peers[6].id, ip: '7.2.3.4', port: 58907 });
                            peers.should.containEql({ 'peer id': expectedResult.peers[7].id, ip: '8.2.3.4', port: 58908 });
                            peers.should.containEql({ 'peer id': expectedResult.peers[8].id, ip: '9.2.3.4', port: 58909 });
                            peers.should.containEql({ 'peer id': expectedResult.peers[9].id, ip: '10.2.3.4', port: 58910 });

                            engine.announce.restore();
                            done(err);
                        });
                });

                describe('when a client asks to ommit the peer id field', function() {
                    it('should return a non-compact peers list without the peer id field', function(done) {
                        sinon.stub(engine, 'announce').yields(null, announceResult());

                        bencodedRequest()
                            .get(fixtures.http.validAnnounceUrlWithNoPeerId)
                            .end(function(err, res, body) {
                                var peers = body.peers.map(function(peer) {
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
                                    { ip: '10.2.3.4', port: 58910 }
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

    function bencodedRequest() {
        return request(http.app)
            .use(function(options, next) {
                options.encoding = null;
                next(options);
            })
            .parser(function(body, fn) {
                fn(null, bencode.decode(body));
            });
    }
});
