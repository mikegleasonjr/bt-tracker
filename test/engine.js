var crypto = require('crypto');
var extend = require('util')._extend;
var sinon = require('sinon');
var crypto = require('crypto');
var Engine = require('../lib/engine');
var MemoryBackend = require('../lib/backends/memory');
var fixtures = require('./fixtures/fixtures.json');
require('should');


describe('engine', function() {
    var engine;
    var backend;
    var mock;

    beforeEach(function() {
        backend = new MemoryBackend();
        backend.setConfig(fixtures.backend.config);

        engine = new Engine();
        engine.setConfig(fixtures.engine.config);
        engine.setBackend(backend);

        mock = sinon.mock(backend);
    });

    afterEach(function() {
        mock.verify();
    });

    describe('connect', function() {
        it('should return a pseudo-random connection id', function(done) {
            engine.connect(function(err, connId1) {
                connId1.should.be.instanceOf(Buffer);
                connId1.length.should.equal(8);

                engine.connect(function(err, connId2) {
                    connId2.toString('hex').should.not.equal(connId1.toString('hex'));
                    done(err);
                });
            });
        });

        it('should store the connection id in the backend', function(done) {
            var spy = sinon.spy(backend, 'addConnId');

            engine.connect(function(err, connId) {
                spy.calledOnce.should.be.true;
                spy.calledWithExactly(connId.toString('hex'), sinon.match.func).should.be.true;
                done(err);
            });
        });

        describe('when the backend returns an error', function() {
            it('should bubble up', function(done) {
                sinon.stub(backend, 'addConnId').yields('db connection error');

                engine.connect(function(err) {
                    err.should.equal('db connection error');
                    backend.addConnId.restore();
                    done();
                });
            });
        });
    });

    describe('isConnected', function() {
        it('should forward the call to the backend', function(done) {
            var expectedConnId = crypto.pseudoRandomBytes(8);
            var mock = sinon.mock(backend);
            mock.expects('isConnId')
                .once()
                .withExactArgs(expectedConnId.toString('hex'), sinon.match.func)
                .yields('some-error-19432', 'some-value-12365');

            engine.isConnected(expectedConnId, function(err, isConnId) {
                mock.verify();
                err.should.equal('some-error-19432');
                isConnId.should.equal('some-value-12365');
                done();
            });
        });
    });

    describe('announce', function() {
        describe('params', function() {
            describe('when called without info_hash', function() {
                it('should fail with missing info_hash', function(done) {
                    engine.announce(validAnnounceParamsWithout('infoHash'), function(err) {
                        err.should.eql('missing info_hash');
                        done();
                    });
                });
            });

            describe('when called with an invalid info_hash', function() {
                it('should fail with invalid info_hash', function(done) {
                    engine.announce(validAnnounceParamsWith({ infoHash: 'invalid' }), function(err) {
                        err.should.eql('invalid info_hash');
                        done();
                    });
                });
            });

            describe('when called without peer_id', function() {
                it('should fail with missing peer_id', function(done) {
                    engine.announce(validAnnounceParamsWithout('peerId'), function(err) {
                        err.should.eql('missing peer_id');
                        done();
                    });
                });
            });

            describe('when called with an invalid peer_id', function() {
                it('should fail with invalid peer_id', function(done) {
                    engine.announce(validAnnounceParamsWith({ peerId: 'invalid' }), function(err) {
                        err.should.eql('invalid peer_id');
                        done();
                    });
                });
            });

            describe('when called without port', function() {
                it('should fail with missing port', function(done) {
                    engine.announce(validAnnounceParamsWithout('port'), function(err) {
                        err.should.eql('missing port');
                        done();
                    });
                });
            });

            describe('when called with a port which is not a number', function() {
                it('should fail with invalid port', function(done) {
                    engine.announce(validAnnounceParamsWith({ port: 'invalid' }), function(err) {
                        err.should.eql('invalid port');
                        done();
                    });
                });
            });

            describe('when called with an out of range port (lower)', function() {
                it('should fail with invalid port', function(done) {
                    engine.announce(validAnnounceParamsWith({ port: 0 }), function(err) {
                        err.should.eql('invalid port');
                        done();
                    });
                });
            });

            describe('when called with an out of range port (upper)', function() {
                it('should fail with invalid port', function(done) {
                    engine.announce(validAnnounceParamsWith({ port: 65536 }), function(err) {
                        err.should.eql('invalid port');
                        done();
                    });
                });
            });

            ['uploaded', 'downloaded', 'left'].forEach(function(p) {
                describe('when called without ' + p, function() {
                    it('should fail with missing ' + p, function(done) {
                        engine.announce(validAnnounceParamsWithout(p), function(err) {
                            err.should.eql('missing ' + p);
                            done();
                        });
                    });
                });

                describe('when called with ' + p + ' which is not a number', function() {
                    it('should fail with invalid ' + p, function(done) {
                        engine.announce(validAnnounceParamsWith(p, 'invalid'), function(err) {
                            err.should.eql('invalid ' + p);
                            done();
                        });
                    });
                });

                describe('when called with a negative ' + p, function() {
                    it('should fail with invalid ' + p, function(done) {
                        engine.announce(validAnnounceParamsWith(p, -1), function(err) {
                            err.should.eql('invalid ' + p);
                            done();
                        });
                    });
                });
            });

            describe('when called with an invalid compact', function() {
                it('should fail with invalid compact', function(done) {
                    engine.announce(validAnnounceParamsWith({ compact: 'invalid' }), function(err) {
                        err.should.eql('invalid compact');
                        done();
                    });
                });
            });

            describe('when called with an invalid event', function() {
                it('should fail with invalid event', function(done) {
                    engine.announce(validAnnounceParamsWith({ event: 'invalid' }), function(err) {
                        err.should.eql('invalid event');
                        done();
                    });
                });
            });

            describe('when called with an invalid numwant', function() {
                it('should fail with invalid numwant', function(done) {
                    engine.announce(validAnnounceParamsWith({ numWant: -1 }), function(err) {
                        err.should.eql('invalid numwant');
                        done();
                    });
                });
            });

            describe('when called with an invalid ip', function() {
                it('should fail with invalid ip', function(done) {
                    engine.announce(validAnnounceParamsWith({ ip: 'invalid' }), function(err) {
                        err.should.eql('invalid ip');
                        done();
                    });
                });
            });

            describe('when called with a private space ip', function() {
                it('should fail with invalid ip', function(done) {
                    engine.announce(validAnnounceParamsWith({ ip: '172.16.3.1' }), function(err) {
                        err.should.eql('invalid ip');
                        done();
                    });

                });
            });

            describe('when called with an invalid no_peer_id', function() {
                it('should fail with invalid no_peer_id', function(done) {
                    engine.announce(validAnnounceParamsWith({ noPeerId: 'invalid' }), function(err) {
                        err.should.eql('invalid no_peer_id');
                        done();
                    });
                });
            });
        });

        describe('when announcing as started', function() {
            it('should set the peer in the swarm', function(done) {
                var params = validAnnounceParamsWith({ event: 'started' });
                var spy = sinon.spy(backend, 'setPeer');

                engine.announce(params, function(err) {
                    spy.withArgs(params.infoHash, params.peerId, fixtures.backend.setPeerPeer, sinon.match.func)
                        .calledOnce.should.be.ok;
                    spy.restore();
                    done(err);
                });
            });

            describe('when the backend returns an error', function() {
                it('should bubble up', function(done) {
                    var params = validAnnounceParamsWith({ event: 'started' });
                    mock.expects('setPeer')
                        .yields('db connection error');

                    engine.announce(params, function(err) {
                        err.should.equal('db connection error');
                        done();
                    });
                });
            });
        });

        describe('when announcing as stopped', function() {
            it('should remove the peer from the swarm', function(done) {
                var params = validAnnounceParamsWith({ event: 'stopped' });
                mock.expects('delPeer')
                    .once()
                    .withExactArgs(params.infoHash, params.peerId, sinon.match.func)
                    .yields(null);

                engine.announce(params, function() {
                    done();
                });
            });

            describe('when the backend returns an error', function() {
                it('should bubble up', function(done) {
                    var params = validAnnounceParamsWith({ event: 'stopped' });
                    mock.expects('delPeer')
                        .yields('db connection error');

                    engine.announce(params, function(err) {
                        err.should.equal('db connection error');
                        done();
                    });
                });
            });
        });

        describe('when announcing as completed', function() {
            it('should set the peer in the swarm', function(done) {
                var params = validAnnounceParamsWith({ event: 'completed' });
                mock.expects('setPeer')
                    .once()
                    .withExactArgs(params.infoHash, params.peerId, fixtures.backend.setPeerPeer, sinon.match.func)
                    .yields(null);

                engine.announce(params, done);
            });

            describe('when the backend returns an error while setting the peer', function() {
                it('should bubble up', function(done) {
                    var params = validAnnounceParamsWith({ event: 'completed' });
                    mock.expects('setPeer')
                        .yields('db connection error');

                    engine.announce(params, function(err) {
                        err.should.equal('db connection error');
                        done();
                    });
                });
            });

            it('should increment the downloads count', function(done) {
                var params = validAnnounceParamsWith({ event: 'completed' });
                mock.expects('incDownloads')
                    .once()
                    .withExactArgs(params.infoHash, sinon.match.func)
                    .yields(null);

                engine.announce(params, done);
            });

            describe('when the backend returns an error while incrementing downloads', function() {
                it('should bubble up', function(done) {
                    var params = validAnnounceParamsWith({ event: 'completed' });
                    mock.expects('incDownloads')
                        .yields('db connection error');

                    engine.announce(params, function(err) {
                        err.should.equal('db connection error');
                        done();
                    });
                });
            });
        });

        describe('when a client is announcing without an event', function() {
            it('should set the peer in the swarm', function(done) {
                var params = validAnnounceParamsWith({ event: 'started' });
                var spy = sinon.spy(backend, 'setPeer');

                engine.announce(params, function(err) {
                    spy.withArgs(params.infoHash, params.peerId, fixtures.backend.setPeerPeer, sinon.match.func)
                        .calledOnce.should.be.ok;
                    spy.restore();
                    done(err);
                });
            });

            describe('when the backend returns an error', function() {
                it('should bubble up', function(done) {
                    var params = validAnnounceParams();
                    mock.expects('setPeer')
                        .yields('db connection error');

                    engine.announce(params, function(err) {
                        err.should.equal('db connection error');
                        done();
                    });
                });
            });
        });

        describe('when responding', function() {
            it('should get the swarm from the backend', function(done) {
                var params = validAnnounceParams();
                mock.expects('getSwarm')
                    .withExactArgs(params.infoHash, swarmOptionsWith({ maxPeers: 123987 }), sinon.match.func)
                    .yields(null, fixtures.backend.getSwarmResult);

                engine.setConfig({ maxPeers: 123987 });
                engine.announce(params, done);
            });

            describe('when too many peers are requested by the client', function() {
                it('should ask the backend to return the maximum number of peers allowed', function(done) {
                    var params = validAnnounceParamsWith({ numWant: 200 });
                    engine.setConfig(engineConfigWith({ maxPeers: 199 }));
                    mock.expects('getSwarm')
                        .withExactArgs(params.infoHash, swarmOptionsWith({ maxPeers: 199 }), sinon.match.func)
                        .yields(null, fixtures.backend.getSwarmResult);

                    engine.announce(params, done);
                });
            });

            describe('when the number of peers requested by the client is less than the maximum number of peers allowed', function() {
                it('should ask the backend to return the number of peers requested by the client', function(done) {
                    var params = validAnnounceParamsWith({ numWant: 49 });
                    engine.setConfig(engineConfigWith({ maxPeers: 50 }));
                    mock.expects('getSwarm')
                        .withExactArgs(params.infoHash, swarmOptionsWith({ maxPeers: 49 }), sinon.match.func)
                        .yields(null, fixtures.backend.getSwarmResult);

                    engine.announce(params, done);
                });
            });

            describe('when the backend returns an error', function() {
                it('should bubble up', function(done) {
                    var params = validAnnounceParams();
                    mock.expects('getSwarm')
                        .yields('unknown swarm');

                    engine.announce(params, function(err) {
                        err.should.equal('unknown swarm');
                        done();
                    });
                });
            });

            it('should return the number of seeders', function(done) {
                var params = validAnnounceParams();
                mock.expects('getSwarm')
                    .yields(null, fixtures.backend.getSwarmResult);

                engine.announce(params, function(err, result) {
                    result.should.containEql({ seeders: 123 });
                    done();
                });
            });

            it('should return the number of leechers', function(done) {
                var params = validAnnounceParams();
                mock.expects('getSwarm').yields(null, fixtures.backend.getSwarmResult);

                engine.announce(params, function(err, result) {
                    result.should.containEql({ leechers: 142 });
                    done();
                });
            });

            it('should return the peers', function(done) {
                var params = validAnnounceParams();
                mock.expects('getSwarm').yields(null, fixtures.backend.getSwarmResult);

                engine.announce(params, function(err, result) {
                    result.peers.should.equal(fixtures.backend.getSwarmResult.peers);
                    done();
                });
            });
        });
    });

    function validAnnounceParams() {
        return {
            infoHash: crypto.pseudoRandomBytes(20),
            peerId: crypto.pseudoRandomBytes(20),
            // those should be the same as in the fixtures
            ip: '7.5.6.3',
            port: 2874,
            uploaded: 1024,
            downloaded: 2048,
            left: 4096
            //compact: 1,
            //event: 'started',
            //numWant: 45,
            //noPeerId: 1
        };
    }

    function validAnnounceParamsWith(overrides, val) {
        if (typeof overrides === 'object') {
            return extend(validAnnounceParams(), overrides);
        }

        var params = validAnnounceParams();
        params[overrides] = val;
        return params;
    }

    function swarmOptionsWith(overrides) {
        return extend(extend({}, fixtures.backend.getSwarmOptions), overrides);
    }

    function engineConfigWith(overrides) {
        return extend(extend({}, fixtures.engine.config), overrides);
    }

    function validAnnounceParamsWithout(p) {
        var params = validAnnounceParams();
        delete params[p];
        return params;
    }
});
