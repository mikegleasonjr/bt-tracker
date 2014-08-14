var should = require('should');
var sinon = require('sinon');
var extend = require('util')._extend;
var MemoryBackend = require('../../lib/backends/memory');
var fixtures = require('../fixtures/fixtures.json').backend;


describe('memory backend', function() {
    var backend;

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
                swarms.should.be.instanceof(Array).and.be.empty;
                done();
            });
        });
    });

    describe('when setting a peer of an unknown swarm', function() {
        it('should create the swarm', function(done) {
            backend.setPeer('info-hash-1', 'peer-id-1', fixtures.setPeerPeer, sinon.spy());

            backend.listSwarms(function(err, swarms) {
                swarms.should.containEql('info-hash-1');
                done();
            });
        });
    });

    describe('when setting a peer', function() {
        it('should be added to the swarm', function(done) {
            backend.setPeer('info-hash-1', 'peer-id-1', peerWith({ ip: '1.2.3.4', port: 1234 }), sinon.spy());
            backend.setPeer('info-hash-1', 'peer-id-2', peerWith({ ip: '5.6.7.8', port: 5789 }), sinon.spy());
            backend.setPeer('info-hash-2', 'peer-id-3', peerWith({ ip: '9.10.11.12', port: 1011 }), sinon.spy());

            backend.getSwarm('info-hash-1', fixtures.getSwarmOptions, function(err, swarm) {
                swarm.peers.should.have.properties('peer-id-1', 'peer-id-2');
                swarm.peers['peer-id-1'].should.containEql({ ip: '1.2.3.4', port: 1234 });
                swarm.peers['peer-id-2'].should.containEql({ ip: '5.6.7.8', port: 5789 });

                backend.getSwarm('info-hash-2', fixtures.getSwarmOptions, function(err, swarm) {
                    swarm.peers.should.have.properties('peer-id-3');
                    swarm.peers['peer-id-3'].should.containEql({ ip: '9.10.11.12', port: 1011 });

                    done();
                });
            });

        });

        it('should overwrite an existing one', function(done) {
            backend.setPeer('info-hash-1', 'peer-id-1', peerWith({ ip: '1.2.3.4', port: 1234 }), sinon.spy());
            backend.setPeer('info-hash-1', 'peer-id-1', peerWith({ ip: '5.6.7.8', port: 5789 }), sinon.spy());

            backend.getSwarm('info-hash-1', fixtures.getSwarmOptions, function(err, swarm) {
                swarm.peers['peer-id-1'].should.containEql({ ip: '5.6.7.8', port: 5789 });
                done();
            });
        });

        it('should yields', function(done) {
            backend.setPeer('info-hash-1', 'peer-id-1', fixtures.setPeerPeer, done);
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
            backend.setPeer('info-hash-1', 'peer-id-1', fixtures.setPeerPeer, sinon.spy());

            clock.tick(1099 * second);

            backend.getSwarm('info-hash-1', fixtures.getSwarmOptions, function(err, swarm) {
                swarm.peers.should.have.keys('peer-id-1');

                clock.tick(second);

                backend.getSwarm('info-hash-1', fixtures.getSwarmOptions, function(err, swarm) {
                    swarm.peers.should.not.have.keys('peer-id-1');
                    done();
                });
            });
        });

        describe('when a peer is overwritten', function() {
            it('should reset its expiration', function(done) {
                backend.setConfig(configWith({ peerTTL: 900 }));
                backend.setPeer('info-hash-1', 'peer-id-1', fixtures.setPeerPeer, sinon.spy());

                clock.tick(800 * second);

                backend.setPeer('info-hash-1', 'peer-id-1', fixtures.setPeerPeer, sinon.spy());

                clock.tick(899 * second);

                backend.getSwarm('info-hash-1', fixtures.getSwarmOptions, function(err, swarm) {
                    swarm.peers.should.have.keys('peer-id-1');

                    clock.tick(second);

                    backend.getSwarm('info-hash-1', fixtures.getSwarmOptions, function(err, swarm) {
                        swarm.peers.should.not.have.keys('peer-id-1');
                        done();
                    });
                });
            });
        });
    });

    describe('when incrementing downloads of an unknown swarm', function() {
        it('should create the swarm', function(done) {
            backend.incDownloads('info-hash-1', sinon.spy());

            backend.listSwarms(function(err, swarms) {
                swarms.should.containEql('info-hash-1');
                done();
            });
        });
    });

    describe('when incrementing downloads', function() {
        it('should increment the swarms downloads count', function(done) {
            backend.setPeer('info-hash-1', 'peer-id-1', fixtures.setPeerPeer, sinon.spy());
            backend.incDownloads('info-hash-1', sinon.spy());
            backend.incDownloads('info-hash-1', sinon.spy());
            backend.incDownloads('info-hash-2', sinon.spy());
            backend.incDownloads('info-hash-2', sinon.spy());

            backend.getSwarm('info-hash-1', fixtures.getSwarmOptions, function(err, swarm) {
                swarm.downloads.should.eql(2);
                backend.getSwarm('info-hash-2', fixtures.getSwarmOptions, function(err, swarm) {
                    swarm.downloads.should.eql(2);
                    done();
                });
            });

        });

        it('should yields', function(done) {
            backend.incDownloads('info-hash-1', done);
        });
    });

    describe('when deleting an unkown peer from an unknown swarm', function() {
        it('should not return an error', function(done) {
            backend.delPeer('info-hash-1', 'peer-id-1', function(err) {
                should(err).be.empty;
                done();
            });
        });

        it('should not create a swarm', function(done) {
            backend.delPeer('info-hash-1', 'peer-id-1', sinon.spy());

            backend.listSwarms(function(err, swarms) {
                swarms.should.not.containEql('info-hash-1');
                done();
            });
        });
    });

    describe('when deleting an unkown peer from a known swarm', function() {
        it('should not return an error', function(done) {
            backend.setPeer('info-hash-1', 'peer-id-existing', fixtures.setPeerPeer, sinon.spy());
            backend.delPeer('info-hash-1', 'peer-id-non-existing', function(err) {
                should(err).be.empty;
                done();
            });
        });
    });

    describe('when deleting a peer', function() {
        it('should be deleted from the swarm', function(done) {
            backend.setPeer('info-hash-1', 'peer-id-1', fixtures.setPeerPeer, sinon.spy());
            backend.setPeer('info-hash-1', 'peer-id-2', fixtures.setPeerPeer, sinon.spy());
            backend.delPeer('info-hash-1', 'peer-id-1', sinon.spy());

            backend.getSwarm('info-hash-1', fixtures.getSwarmOptions, function(err, swarm) {
                swarm.peers.should.not.have.property('peer-id-1');
                swarm.peers.should.have.property('peer-id-2');
                done();
            });
        });

        it('should yields', function(done) {
            backend.delPeer('info-hash-1', 'peer-id-1', done);
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
        beforeEach(function() {
            var noop = function() {};
            backend.setPeer('info-hash-1', 'seeder-1', peerWith({ left: 0 }), noop);
            backend.setPeer('info-hash-1', 'leecher-1', peerWith({ left: 2048 }), noop);
            backend.setPeer('info-hash-1', 'seeder-2', peerWith({ left: 0 }), noop);
            backend.setPeer('info-hash-1', 'leecher-2', peerWith({ left: 1024 }), noop);
            backend.setPeer('info-hash-1', 'seeder-3', peerWith({ left: 0 }), noop);
            backend.setPeer('info-hash-1', 'seeder-4', peerWith({ left: 0 }), noop);
            backend.setPeer('info-hash-1', 'leecher-3', peerWith({ left: 1024 }), noop);
            backend.setPeer('info-hash-1', 'leecher-4', peerWith({ left: 1024 }), noop);
            backend.setPeer('info-hash-1', 'seeder-5', peerWith({ left: 0 }), noop);
            backend.setPeer('info-hash-1', 'seeder-6', peerWith({ left: 0 }), noop);
            backend.delPeer('info-hash-1', 'seeder-1', noop);
        });

        it('should return the number of leechers', function() {
            backend.getSwarm('info-hash-1', fixtures.getSwarmOptions, function(err, swarm) {
                swarm.leechers.should.equal(4);
            });
        });

        it('should return the number of seeders', function() {
            backend.getSwarm('info-hash-1', fixtures.getSwarmOptions, function(err, swarm) {
                swarm.seeders.should.equal(5);
            });
        });

        describe('when the number of requested peers matches the number of peers in the swarm', function() {
            it('should return all the peers', function() {
                backend.getSwarm('info-hash-1', swarmOptionsWith({ maxPeers: 9 }), function(err, swarm) {
                    swarm.peers.should.have.keys(
                        'seeder-2', 'seeder-3', 'seeder-4', 'seeder-5', 'seeder-6',
                        'leecher-1', 'leecher-2', 'leecher-3', 'leecher-4'
                    );
                });
            });
        });

        describe('when the number of requested peers is smaller than the number of peers in the swarm', function() {
            it('should return a subset of the peers', function(next) {
                backend.getSwarm('info-hash-1', swarmOptionsWith({ maxPeers: 5 }), function(err, swarm) {
                    var peersIds = Object.keys(swarm.peers);
                    var allPeersIds = ['seeder-2', 'seeder-3', 'seeder-4', 'seeder-5', 'seeder-6', 'leecher-1', 'leecher-2', 'leecher-3', 'leecher-4'];

                    peersIds.length.should.equal(5);
                    peersIds.forEach(function(id) {
                        allPeersIds.should.containEql(id);
                    });

                    next(err);
                });
            });

            it('should randomize the peers returned', function(next) {
                backend.getSwarm('info-hash-1', swarmOptionsWith({ maxPeers: 4 }), function(err, swarm1) {
                    backend.getSwarm('info-hash-1', swarmOptionsWith({ maxPeers: 4 }), function(err, swarm2) {
                        backend.getSwarm('info-hash-1', swarmOptionsWith({ maxPeers: 4 }), function(err, swarm3) {
                            var compare = function(s1, s2) { return s1 > s2; };
                            var keys1 = Object.keys(swarm1.peers).sort(compare).join(', ');
                            var keys2 = Object.keys(swarm2.peers).sort(compare).join(', ');
                            var keys3 = Object.keys(swarm3.peers).sort(compare).join(', ');

                            (keys1 === keys2 && keys1 === keys3).should.not.be.true;
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
