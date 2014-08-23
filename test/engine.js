var crypto = require('crypto');
var extend = require('util')._extend;
var sinon = require('sinon');
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

    describe('announce', function() {
        describe('parameters', function() {
            describe('when called without info_hash', function() {
                it('should fail with missing info_hash', function(done) {
                    engine.announce(validAnnounceParametersWithout('info_hash'), function(err) {
                        err.should.eql('missing info_hash');
                        done();
                    });
                });
            });

            describe('when called with an invalid info_hash', function() {
                it('should fail with invalid info_hash', function(done) {
                    engine.announce(validAnnounceParametersWith({ info_hash: 'invalid' }), function(err) {
                        err.should.eql('invalid info_hash');
                        done();
                    });
                });
            });

            describe('when called without peer_id', function() {
                it('should fail with missing peer_id', function(done) {
                    engine.announce(validAnnounceParametersWithout('peer_id'), function(err) {
                        err.should.eql('missing peer_id');
                        done();
                    });
                });
            });

            describe('when called with an invalid peer_id', function() {
                it('should fail with invalid peer_id', function(done) {
                    engine.announce(validAnnounceParametersWith({ peer_id: 'invalid' }), function(err) {
                        err.should.eql('invalid peer_id');
                        done();
                    });
                });
            });

            describe('when called without port', function() {
                it('should fail with missing port', function(done) {
                    engine.announce(validAnnounceParametersWithout('port'), function(err) {
                        err.should.eql('missing port');
                        done();
                    });
                });
            });

            describe('when called with a port which is not a number', function() {
                it('should fail with invalid port', function(done) {
                    engine.announce(validAnnounceParametersWith({ 'port': 'invalid' }), function(err) {
                        err.should.eql('invalid port');
                        done();
                    });
                });
            });

            describe('when called with an out of range port (lower)', function() {
                it('should fail with invalid port', function(done) {
                    engine.announce(validAnnounceParametersWith({ 'port': 0 }), function(err) {
                        err.should.eql('invalid port');
                        done();
                    });
                });
            });

            describe('when called with an out of range port (upper)', function() {
                it('should fail with invalid port', function(done) {
                    engine.announce(validAnnounceParametersWith({ 'port': 65536 }), function(err) {
                        err.should.eql('invalid port');
                        done();
                    });
                });
            });

            ['uploaded', 'downloaded', 'left'].forEach(function(p) {
                describe('when called without ' + p, function() {
                    it('should fail with missing ' + p, function(done) {
                        engine.announce(validAnnounceParametersWithout(p), function(err) {
                            err.should.eql('missing ' + p);
                            done();
                        });
                    });
                });

                describe('when called with ' + p + ' which is not a number', function() {
                    it('should fail with invalid ' + p, function(done) {
                        engine.announce(validAnnounceParametersWith(p, 'invalid'), function(err) {
                            err.should.eql('invalid ' + p);
                            done();
                        });
                    });
                });

                describe('when called with a negative ' + p, function() {
                    it('should fail with invalid ' + p, function(done) {
                        engine.announce(validAnnounceParametersWith(p, -1), function(err) {
                            err.should.eql('invalid ' + p);
                            done();
                        });
                    });
                });
            });

            describe('when called with an invalid compact', function() {
                it('should fail with invalid compact', function(done) {
                    engine.announce(validAnnounceParametersWith({ compact: 'invalid' }), function(err) {
                        err.should.eql('invalid compact');
                        done();
                    });
                });
            });

            describe('when called with an invalid event', function() {
                it('should fail with invalid event', function(done) {
                    engine.announce(validAnnounceParametersWith({ event: 'invalid' }), function(err) {
                        err.should.eql('invalid event');
                        done();
                    });
                });
            });

            describe('when called with an invalid numwant', function() {
                it('should fail with invalid numwant', function(done) {
                    engine.announce(validAnnounceParametersWith({ numwant: -1 }), function(err) {
                        err.should.eql('invalid numwant');
                        done();
                    });
                });
            });

            describe('when called with an invalid ip', function() {
                it('should fail with invalid ip', function(done) {
                    engine.announce(validAnnounceParametersWith({ ip: 'invalid' }), function(err) {
                        err.should.eql('invalid ip');
                        done();
                    });
                });
            });

            describe('when called with a private space ip', function() {
                it('should fail with invalid ip', function(done) {
                    engine.announce(validAnnounceParametersWith({ ip: '172.16.3.1' }), function(err) {
                        err.should.eql('invalid ip');
                        done();
                    });

                });
            });

            describe('when called with an invalid no_peer_id', function() {
                it('should fail with invalid no_peer_id', function(done) {
                    engine.announce(validAnnounceParametersWith({ no_peer_id: 'invalid' }), function(err) {
                        err.should.eql('invalid no_peer_id');
                        done();
                    });
                });
            });
        });

        describe('when announcing as started', function() {
            it('should set the peer in the swarm', function(done) {
                var parameters = validAnnounceParametersWith({ event: 'started' });
                var spy = sinon.spy(backend, 'setPeer');

                engine.announce(parameters, function(err) {
                    spy.withArgs(parameters.info_hash, parameters.peer_id, fixtures.backend.setPeerPeer, sinon.match.func)
                        .calledOnce.should.be.ok;
                    spy.restore();
                    done(err);
                });
            });

            describe('when the backend returns an error', function() {
                it('should bubble up', function(done) {
                    var parameters = validAnnounceParametersWith({ event: 'started' });
                    mock.expects('setPeer')
                        .yields('db connection error');

                    engine.announce(parameters, function(err) {
                        err.should.equal('db connection error');
                        done();
                    });
                });
            });
        });

        describe('when announcing as stopped', function() {
            it('should remove the peer from the swarm', function(done) {
                var parameters = validAnnounceParametersWith({ event: 'stopped' });
                mock.expects('delPeer')
                    .once()
                    .withExactArgs(parameters.info_hash, parameters.peer_id, sinon.match.func)
                    .yields(null);

                engine.announce(parameters, function() {
                    done();
                });
            });

            describe('when the backend returns an error', function() {
                it('should bubble up', function(done) {
                    var parameters = validAnnounceParametersWith({ event: 'stopped' });
                    mock.expects('delPeer')
                        .yields('db connection error');

                    engine.announce(parameters, function(err) {
                        err.should.equal('db connection error');
                        done();
                    });
                });
            });
        });

        describe('when announcing as completed', function() {
            it('should set the peer in the swarm', function(done) {
                var parameters = validAnnounceParametersWith({ event: 'completed' });
                mock.expects('setPeer')
                    .once()
                    .withExactArgs(parameters.info_hash, parameters.peer_id, fixtures.backend.setPeerPeer, sinon.match.func)
                    .yields(null);

                engine.announce(parameters, done);
            });

            describe('when the backend returns an error while setting the peer', function() {
                it('should bubble up', function(done) {
                    var parameters = validAnnounceParametersWith({ event: 'completed' });
                    mock.expects('setPeer')
                        .yields('db connection error');

                    engine.announce(parameters, function(err) {
                        err.should.equal('db connection error');
                        done();
                    });
                });
            });

            it('should increment the downloads count', function(done) {
                var parameters = validAnnounceParametersWith({ event: 'completed' });
                mock.expects('incDownloads')
                    .once()
                    .withExactArgs(parameters.info_hash, sinon.match.func)
                    .yields(null);

                engine.announce(parameters, done);
            });

            describe('when the backend returns an error while incrementing downloads', function() {
                it('should bubble up', function(done) {
                    var parameters = validAnnounceParametersWith({ event: 'completed' });
                    mock.expects('incDownloads')
                        .yields('db connection error');

                    engine.announce(parameters, function(err) {
                        err.should.equal('db connection error');
                        done();
                    });
                });
            });
        });

        describe('when a client is announcing without an event', function() {
            it('should set the peer in the swarm', function(done) {
                var parameters = validAnnounceParametersWith({ event: 'started' });
                var spy = sinon.spy(backend, 'setPeer');

                engine.announce(parameters, function(err) {
                    spy.withArgs(parameters.info_hash, parameters.peer_id, fixtures.backend.setPeerPeer, sinon.match.func)
                        .calledOnce.should.be.ok;
                    spy.restore();
                    done(err);
                });
            });

            describe('when the backend returns an error', function() {
                it('should bubble up', function(done) {
                    var parameters = validAnnounceParameters();
                    mock.expects('setPeer')
                        .yields('db connection error');

                    engine.announce(parameters, function(err) {
                        err.should.equal('db connection error');
                        done();
                    });
                });
            });
        });

        describe('when responding', function() {
            it('should get the swarm from the backend', function(done) {
                var parameters = validAnnounceParameters();
                mock.expects('getSwarm')
                    .withExactArgs(parameters.info_hash, swarmOptionsWith({ maxPeers: 123987 }), sinon.match.func)
                    .yields(null, fixtures.backend.getSwarmResult);

                engine.setConfig({ maxPeers: 123987 });
                engine.announce(parameters, done);
            });

            describe('when too many peers are requested by the client', function() {
                it('should ask the backend to return the maximum number of peers allowed', function(done) {
                    var parameters = validAnnounceParametersWith({ numwant: 200 });
                    engine.setConfig(engineConfigWith({ maxPeers: 199 }));
                    mock.expects('getSwarm')
                        .withExactArgs(parameters.info_hash, swarmOptionsWith({ maxPeers: 199 }), sinon.match.func)
                        .yields(null, fixtures.backend.getSwarmResult);

                    engine.announce(parameters, done);
                });
            });

            describe('when the number of peers requested by the client is less than the maximum number of peers allowed', function() {
                it('should ask the backend to return the number of peers requested by the client', function(done) {
                    var parameters = validAnnounceParametersWith({ numwant: 49 });
                    engine.setConfig(engineConfigWith({ maxPeers: 50 }));
                    mock.expects('getSwarm')
                        .withExactArgs(parameters.info_hash, swarmOptionsWith({ maxPeers: 49 }), sinon.match.func)
                        .yields(null, fixtures.backend.getSwarmResult);

                    engine.announce(parameters, done);
                });
            });

            describe('when the backend returns an error', function() {
                it('should bubble up', function(done) {
                    var parameters = validAnnounceParameters();
                    mock.expects('getSwarm')
                        .yields('unknown swarm');

                    engine.announce(parameters, function(err) {
                        err.should.equal('unknown swarm');
                        done();
                    });
                });
            });

            it('should return the number of seeders', function(done) {
                var parameters = validAnnounceParameters();
                mock.expects('getSwarm')
                    .yields(null, fixtures.backend.getSwarmResult);

                engine.announce(parameters, function(err, result) {
                    result.should.containEql({ seeders: 123 });
                    done();
                });
            });

            it('should return the number of leechers', function(done) {
                var parameters = validAnnounceParameters();
                mock.expects('getSwarm').yields(null, fixtures.backend.getSwarmResult);

                engine.announce(parameters, function(err, result) {
                    result.should.containEql({ leechers: 142 });
                    done();
                });
            });

            it('should return the peers', function(done) {
                var parameters = validAnnounceParameters();
                mock.expects('getSwarm').yields(null, fixtures.backend.getSwarmResult);

                engine.announce(parameters, function(err, result) {
                    result.should.containEql({ peers: fixtures.backend.getSwarmResult.peers });
                    done();
                });
            });
        });
    });

    function validAnnounceParameters() {
        return {
            info_hash: unescape('%e2%e2C%2a%a9%e5%cd%0b%bcb%fd%3e%97%0c%fa%e0%e0%f8%2f%f6'),
            peer_id: unescape('-UM1840-%13u%d9Tb%df%d4%bd%c7w%82%e0'),
            // those should be the same as in the fixtures
            ip: '7.5.6.3',
            port: '2874',
            uploaded: '1024',
            downloaded: '2048',
            left: '4096'
        };
    }

    function validAnnounceParametersWith(overrides, val) {
        if (typeof overrides === 'object') {
            return extend(validAnnounceParameters(), overrides);
        }

        var parameters = validAnnounceParameters();
        parameters[overrides] = val;
        return parameters;
    }

    function swarmOptionsWith(overrides) {
        return extend(extend({}, fixtures.backend.getSwarmOptions), overrides);
    }

    function engineConfigWith(overrides) {
        return extend(extend({}, fixtures.engine.config), overrides);
    }

    function validAnnounceParametersWithout(p) {
        var parameters = validAnnounceParameters();
        delete parameters[p];
        return parameters;
    }
});
