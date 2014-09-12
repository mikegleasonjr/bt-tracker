var should = require('should');
var sinon = require('sinon');
var extend = require('util')._extend;
var MemoryBackend = require('../../lib/backends/memory');
var fixtures = require('../fixtures/fixtures.json').backend;
var crypto = require('crypto');


describe('memory backend', function() {
    var backend;
    var infoHash1 = crypto.pseudoRandomBytes(20);
    var infoHash2 = crypto.pseudoRandomBytes(20);
    var peerId1 = crypto.pseudoRandomBytes(20);
    var peerId2 = crypto.pseudoRandomBytes(20);
    var peerId3 = crypto.pseudoRandomBytes(20);

    beforeEach(function() {
        backend = new MemoryBackend();
        backend.setConfig(fixtures.config);
    });

    describe('when getting the backend name', function() {
        it('should be memory', function() {
            backend.getName().should.equal('memory');
        });
    });

    describe('when a new instance is created', function() {
        it('should have an empty swarms list', function(done) {
            backend.listSwarms(function(err, swarms) {
                swarms.should.be.an.Array.and.be.empty;
                done();
            });
        });
    });

    describe('when setting a peer of an unknown swarm', function() {
        it('should create the swarm', function(done) {
            backend.setPeer(infoHash1, peerId1, fixtures.setPeerPeer, sinon.spy());

            backend.listSwarms(function(err, swarms) {
                swarms.should.containEql(infoHash1);
                done();
            });
        });
    });

    describe('when setting a peer', function() {
        it('should be added to the swarm', function(done) {
            backend.setPeer(infoHash1, peerId1, peerWith({ ip: '1.2.3.4', port: 1234 }), sinon.spy());
            backend.setPeer(infoHash1, peerId2, peerWith({ ip: '5.6.7.8', port: 5789 }), sinon.spy());
            backend.setPeer(infoHash2, peerId3, peerWith({ ip: '9.10.11.12', port: 1011 }), sinon.spy());

            backend.getSwarm(infoHash1, fixtures.getSwarmOptions, function(err, swarm) {
                swarm.peers.length.should.equal(2);
                swarm.peers.should.containEql({ id: peerId1, ip: '1.2.3.4', port: 1234 });
                swarm.peers.should.containEql({ id: peerId2, ip: '5.6.7.8', port: 5789 });

                backend.getSwarm(infoHash2, fixtures.getSwarmOptions, function(err, swarm) {
                    swarm.peers.length.should.equal(1);
                    swarm.peers.should.containEql({ id: peerId3, ip: '9.10.11.12', port: 1011 });

                    done();
                });
            });

        });

        it('should overwrite an existing one', function(done) {
            backend.setPeer(infoHash1, peerId1, peerWith({ ip: '1.2.3.4', port: 1234 }), sinon.spy());
            backend.setPeer(infoHash1, peerId1, peerWith({ ip: '5.6.7.8', port: 5789 }), sinon.spy());

            backend.getSwarm(infoHash1, fixtures.getSwarmOptions, function(err, swarm) {
                swarm.peers.should.not.containEql({ id: peerId1, ip: '1.2.3.4', port: 1234 });
                swarm.peers.should.containEql({ id: peerId1, ip: '5.6.7.8', port: 5789 });
                done();
            });
        });

        it('should yields', function(done) {
            backend.setPeer(infoHash1, peerId1, fixtures.setPeerPeer, done);
        });
    });

    describe('when a peer expires', function() {
        var clock;
        var second = 1000;

        before(function() {
            clock = sinon.useFakeTimers();
        });

        after(function() {
            clock.restore();
        });

        it('should be removed from the swarm', function(done) {
            backend.setConfig(configWith({ peerTTL: 1100 }));
            backend.setPeer(infoHash1, peerId1, fixtures.setPeerPeer, sinon.spy());

            clock.tick(1099 * second);

            backend.getSwarm(infoHash1, fixtures.getSwarmOptions, function(err, swarm) {
                swarm.peers.should.containEql({ id: peerId1, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });
                clock.tick(second);

                backend.getSwarm(infoHash1, fixtures.getSwarmOptions, function(err, swarm) {
                    swarm.peers.should.not.containEql({ id: peerId1, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });
                    done();
                });
            });
        });

        describe('when a peer is overwritten', function() {
            it('should reset its expiration', function(done) {
                backend.setConfig(configWith({ peerTTL: 900 }));
                backend.setPeer(infoHash1, peerId1, fixtures.setPeerPeer, sinon.spy());

                clock.tick(800 * second);

                backend.setPeer(infoHash1, peerId1, fixtures.setPeerPeer, sinon.spy());

                clock.tick(899 * second);

                backend.getSwarm(infoHash1, fixtures.getSwarmOptions, function(err, swarm) {
                    swarm.peers.should.containEql({ id: peerId1, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });

                    clock.tick(second);

                    backend.getSwarm(infoHash1, fixtures.getSwarmOptions, function(err, swarm) {
                        swarm.peers.should.not.containEql({ id: peerId1, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });
                        done();
                    });
                });
            });
        });
    });

    describe('when incrementing downloads of an unknown swarm', function() {
        it('should create the swarm', function(done) {
            backend.incDownloads(infoHash1, sinon.spy());

            backend.listSwarms(function(err, swarms) {
                swarms.should.containEql(infoHash1);
                done();
            });
        });
    });

    describe('when incrementing downloads', function() {
        it('should increment the swarms downloads count', function(done) {
            backend.setPeer(infoHash1, peerId1, fixtures.setPeerPeer, sinon.spy());
            backend.incDownloads(infoHash1, sinon.spy());
            backend.incDownloads(infoHash1, sinon.spy());
            backend.incDownloads(infoHash2, sinon.spy());
            backend.incDownloads(infoHash2, sinon.spy());

            backend.getSwarm(infoHash1, fixtures.getSwarmOptions, function(err, swarm) {
                swarm.downloads.should.eql(2);
                backend.getSwarm(infoHash2, fixtures.getSwarmOptions, function(err, swarm) {
                    swarm.downloads.should.eql(2);
                    done();
                });
            });

        });

        it('should yields', function(done) {
            backend.incDownloads(infoHash1, done);
        });
    });

    describe('when deleting an unkown peer from an unknown swarm', function() {
        it('should not return an error', function(done) {
            backend.delPeer(infoHash1, peerId1, function(err) {
                should(err).be.empty;
                done();
            });
        });

        it('should not create a swarm', function(done) {
            backend.delPeer(infoHash1, peerId1, sinon.spy());

            backend.listSwarms(function(err, swarms) {
                swarms.should.not.containEql(infoHash1);
                done();
            });
        });
    });

    describe('when deleting an unkown peer from a known swarm', function() {
        it('should not return an error', function(done) {
            backend.setPeer(infoHash1, peerId1, fixtures.setPeerPeer, sinon.spy());
            backend.delPeer(infoHash1, peerId2, function(err) {
                should(err).be.empty;
                done();
            });
        });
    });

    describe('when deleting a peer', function() {
        it('should be deleted from the swarm', function(done) {
            backend.setPeer(infoHash1, peerId1, fixtures.setPeerPeer, sinon.spy());
            backend.setPeer(infoHash1, peerId2, fixtures.setPeerPeer, sinon.spy());
            backend.delPeer(infoHash1, peerId1, sinon.spy());

            backend.getSwarm(infoHash1, fixtures.getSwarmOptions, function(err, swarm) {
                swarm.peers.should.not.containEql({ id: peerId1, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });
                swarm.peers.should.containEql({ id: peerId2, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });
                done();
            });
        });

        it('should yields', function(done) {
            backend.delPeer(infoHash1, peerId1, done);
        });
    });

    describe('when getting an unknown swarm', function() {
        it('should return an error', function(done) {
            backend.getSwarm('non-existing', fixtures.getSwarmOptions, function(err, swarm) {
                err.should.equal('unknown swarm');
                should(swarm).be.empty;
                done();
            });
        });
    });

    describe('when getting a swarm', function() {
        var peerId4 = crypto.pseudoRandomBytes(20);
        var peerId5 = crypto.pseudoRandomBytes(20);
        var peerId6 = crypto.pseudoRandomBytes(20);
        var peerId7 = crypto.pseudoRandomBytes(20);
        var peerId8 = crypto.pseudoRandomBytes(20);
        var peerId9 = crypto.pseudoRandomBytes(20);
        var peerId10 = crypto.pseudoRandomBytes(20);

        beforeEach(function() {
            backend.setPeer(infoHash1, peerId1, peerWith({ left: 0 }), sinon.spy());
            backend.setPeer(infoHash1, peerId2, peerWith({ left: 2048 }), sinon.spy());
            backend.setPeer(infoHash1, peerId3, peerWith({ left: 0 }), sinon.spy());
            backend.setPeer(infoHash1, peerId4, peerWith({ left: 1024 }), sinon.spy());
            backend.setPeer(infoHash1, peerId5, peerWith({ left: 0 }), sinon.spy());
            backend.setPeer(infoHash1, peerId6, peerWith({ left: 0 }), sinon.spy());
            backend.setPeer(infoHash1, peerId7, peerWith({ left: 1024 }), sinon.spy());
            backend.setPeer(infoHash1, peerId8, peerWith({ left: 1024 }), sinon.spy());
            backend.setPeer(infoHash1, peerId9, peerWith({ left: 0 }), sinon.spy());
            backend.setPeer(infoHash1, peerId10, peerWith({ left: 0 }), sinon.spy());
            backend.delPeer(infoHash1, peerId1, sinon.spy());
        });

        it('should return the number of leechers', function() {
            backend.getSwarm(infoHash1, fixtures.getSwarmOptions, function(err, swarm) {
                swarm.leechers.should.equal(4);
            });
        });

        it('should return the number of seeders', function() {
            backend.getSwarm(infoHash1, fixtures.getSwarmOptions, function(err, swarm) {
                swarm.seeders.should.equal(5);
            });
        });

        describe('when the number of requested peers matches the number of peers in the swarm', function() {
            it('should return all the peers', function() {
                backend.getSwarm(infoHash1, swarmOptionsWith({ maxPeers: 9 }), function(err, swarm) {
                    swarm.peers.length.should.equal(9);
                    swarm.peers.should.containEql({ id: peerId2, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });
                    swarm.peers.should.containEql({ id: peerId3, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });
                    swarm.peers.should.containEql({ id: peerId4, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });
                    swarm.peers.should.containEql({ id: peerId5, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });
                    swarm.peers.should.containEql({ id: peerId6, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });
                    swarm.peers.should.containEql({ id: peerId7, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });
                    swarm.peers.should.containEql({ id: peerId8, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });
                    swarm.peers.should.containEql({ id: peerId9, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });
                    swarm.peers.should.containEql({ id: peerId10, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });
                });
            });
        });

        describe('when the number of requested peers is smaller than the number of peers in the swarm', function() {
            it('should return a subset of the peers', function(next) {
                backend.getSwarm(infoHash1, swarmOptionsWith({ maxPeers: 5 }), function(err, swarm) {
                    var allPeersIds = [peerId2, peerId3, peerId4, peerId5, peerId6, peerId7, peerId8, peerId9, peerId10];
                    var peersIds = swarm.peers.map(function(peer) { return peer.id; });

                    swarm.peers.length.should.equal(5);
                    peersIds.forEach(function(id) {
                        swarm.peers.should.containEql({ id: id, ip: fixtures.setPeerPeer.ip, port: fixtures.setPeerPeer.port });
                    });

                    next(err);
                });
            });

            it('should randomize the peers returned', function(next) {
                backend.getSwarm(infoHash1, swarmOptionsWith({ maxPeers: 4 }), function(err, swarm1) {
                    backend.getSwarm(infoHash1, swarmOptionsWith({ maxPeers: 4 }), function(err, swarm2) {
                        backend.getSwarm(infoHash1, swarmOptionsWith({ maxPeers: 4 }), function(err, swarm3) {
                            var ids = function(a) { return a.map(function(peer) { return peer.id.toString('hex'); }); };

                            var ids1 = ids(swarm1.peers).sort().join(', ');
                            var ids2 = ids(swarm2.peers).sort().join(', ');
                            var ids3 = ids(swarm3.peers).sort().join(', ');

                            (ids1 === ids2 && ids1 === ids3).should.not.be.true;
                            next();
                        });
                    });
                });
            });
        });
    });

    function peerWith(overrides) {
        return extend(extend({}, fixtures.setPeerPeer), overrides);
    }

    function swarmOptionsWith(overrides) {
        return extend(extend({}, fixtures.getSwarmOptions), overrides);
    }

    function configWith(overrides) {
        return extend(extend({}, fixtures.config), overrides);
    }
});
