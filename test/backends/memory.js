var should = require('should');
var sinon = require('sinon');
var MemoryBackend = require('../../lib/backends/memory');


describe('memory backend', function() {
    var backend;

    beforeEach(function() {
        backend = new MemoryBackend();
    });

    describe('when getting the backend name', function() {
        it('should be memory', function() {
            backend.getName().should.equal('memory');
        });
    });

    describe('when a new instance is created', function() {
        it('should have an empty swarms list', function() {
            backend.swarms.should.eql({});
        });
    });

    describe('when getting a peer of an unknown swarm', function() {
        it('should not create an empty swarm', function() {
            backend.getPeer('info-hash-1', 'peer-id-1', sinon.spy());
            backend.swarms.should.not.have.keys('info-hash-1');
        });

        it('should return an undefined peer', function() {
            var spy = sinon.spy();
            backend.getPeer('info-hash-1', 'peer-id-1', spy);
            spy.calledWithExactly(null, undefined).should.be.true;
        });
    });

    describe('when getting a known peer from a known swarm', function() {
        it('should return that peer', function() {
            var peer = { ip: '1.2.3.4' };
            var spy = sinon.spy();
            var swarm = backend._getSwarm('info-hash-1');
            swarm.peers['peer-id-1'] = peer;

            backend.getPeer('info-hash-1', 'peer-id-1', spy);

            spy.calledWithExactly(null, peer).should.be.true;
        });
    });

    describe('when setting a peer of an unknown swarm', function() {
        it('should create an empty swarm', function() {
            backend.setPeer('info-hash-1', 'peer-id-1', {}, sinon.spy());
            backend.swarms.should.have.keys('info-hash-1');
        });
    });

    describe('when setting a peer', function() {
        it('should exists in the swarm', function() {
            var peer = { ip: '1.2.3.4' };
            var swarm = backend._getSwarm('info-hash-1');

            backend.setPeer('info-hash-1', 'peer-id-1', peer, sinon.spy());

            swarm.peers['peer-id-1'].should.equal(peer);
        });

        it('should not return anything', function() {
            var peer = { ip: '1.2.3.4' };
            var spy = sinon.spy();

            backend.setPeer('info-hash-1', 'peer-id-1', peer, spy);

            spy.calledWithExactly(null).should.be.true;
        });
    });

    describe('when incrementing seeders of an unknown swarm', function() {
        it('should create an empty swarm', function() {
            backend.incrementSeeders('info-hash-1', sinon.spy());
            backend.swarms.should.have.keys('info-hash-1');
        });

        it('should have a seeders count of 1', function() {
            backend.incrementSeeders('info-hash-1', sinon.spy());
            backend.swarms['info-hash-1'].should.containEql({ seeders: 1 });
        });
    });

    describe('when incrementing seeders of a swarm', function() {
        it('should return nothing', function() {
            var callback = sinon.spy();

            backend.incrementSeeders('info-hash-1', callback);

            callback.calledWithExactly(null).should.be.true;
        });

        it('should increment the seeders', function() {
            backend.incrementSeeders('info-hash-1', sinon.spy());
            backend.swarms['info-hash-1'].should.containEql({ seeders: 1 });
            backend.incrementSeeders('info-hash-2', sinon.spy());
            backend.swarms['info-hash-1'].should.containEql({ seeders: 1 });
            backend.incrementSeeders('info-hash-1', sinon.spy());
            backend.swarms['info-hash-1'].should.containEql({ seeders: 2 });
        });
    });

    describe('when decrementing seeders of an unknown swarm', function() {
        it('should create an empty swarm', function() {
            backend.decrementSeeders('info-hash-1', sinon.spy());
            backend.swarms.should.have.keys('info-hash-1');
        });

        it('should have a seeders count of 0', function() {
            backend.decrementSeeders('info-hash-1', sinon.spy());
            backend.swarms['info-hash-1'].should.containEql({ seeders: 0 });
        });
    });

    describe('when decrementing seeders of a swarm', function() {
        it('should return nothing', function() {
            var callback = sinon.spy();

            backend.decrementSeeders('info-hash-1', callback);

            callback.calledWithExactly(null).should.be.true;
        });

        it('should decrement the seeders count', function() {
            var callback = sinon.spy();
            backend._getSwarm('info-hash-1').seeders = 33;

            backend.decrementSeeders('info-hash-1', callback);

            backend._getSwarm('info-hash-1').seeders.should.equal(32);
        });

        it('should not decrement if already 0', function() {
            var callback = sinon.spy();
            backend._getSwarm('info-hash-1').seeders = 1;

            backend.decrementSeeders('info-hash-1', callback);
            backend.decrementSeeders('info-hash-1', callback);

            backend._getSwarm('info-hash-1').seeders.should.equal(0);
        });
    });

    describe('when incrementing leechers of an unknown swarm', function() {
        it('should create an empty swarm', function() {
            backend.incrementLeechers('info-hash-1', sinon.spy());
            backend.swarms.should.have.keys('info-hash-1');
        });

        it('should have a leechers count of 1', function() {
            backend.incrementLeechers('info-hash-1', sinon.spy());
            backend.swarms['info-hash-1'].should.containEql({ leechers: 1 });
        });
    });

    describe('when incrementing leechers of a swarm', function() {
        it('should return nothing', function() {
            var callback = sinon.spy();

            backend.incrementLeechers('info-hash-1', callback);

            callback.calledWithExactly(null).should.be.true;
        });

        it('should increment the leechers', function() {
            backend.incrementLeechers('info-hash-1', sinon.spy());
            backend.swarms['info-hash-1'].should.containEql({ leechers: 1 });
            backend.incrementLeechers('info-hash-2', sinon.spy());
            backend.swarms['info-hash-1'].should.containEql({ leechers: 1 });
            backend.incrementLeechers('info-hash-1', sinon.spy());
            backend.swarms['info-hash-1'].should.containEql({ leechers: 2 });
        });
    });

    describe('when decrementing leechers of an unknown swarm', function() {
        it('should create an empty swarm', function() {
            backend.decrementLeechers('info-hash-1', sinon.spy());
            backend.swarms.should.have.keys('info-hash-1');
        });

        it('should have a leechers count of 0', function() {
            backend.decrementLeechers('info-hash-1', sinon.spy());
            backend.swarms['info-hash-1'].should.containEql({ leechers: 0 });
        });
    });

    describe('when decrementing leechers of a swarm', function() {
        it('should return nothing', function() {
            var callback = sinon.spy();

            backend.decrementLeechers('info-hash-1', callback);

            callback.calledWithExactly(null).should.be.true;
        });

        it('should decrement the leechers count', function() {
            var callback = sinon.spy();
            backend._getSwarm('info-hash-1').leechers = 33;

            backend.decrementLeechers('info-hash-1', callback);

            backend._getSwarm('info-hash-1').leechers.should.equal(32);
        });

        it('should not decrement if already 0', function() {
            var callback = sinon.spy();
            backend._getSwarm('info-hash-1').leechers = 1;

            backend.decrementLeechers('info-hash-1', callback);
            backend.decrementLeechers('info-hash-1', callback);

            backend._getSwarm('info-hash-1').leechers.should.equal(0);
        });
    });

    describe('when deleting a peer from an unknown swarm', function() {
        it('should not create an empty swarm', function() {
            var spy = sinon.spy();
            backend.deletePeer('info-hash-1', 'peer-id-1', spy);
            backend.swarms.should.not.have.keys('info-hash-1');
            spy.calledWithExactly(null).should.be.true;
        });
    });

    describe('when deleting a known peer from an existing swarm', function() {
        it('should be removed from the swarm', function() {
            var spy = sinon.spy();
                backend.setPeer('info-hash-1', 'peer-id-1', { ip: '1.2.3.4' }, sinon.spy());
            backend.swarms['info-hash-1'].peers.should.have.keys('peer-id-1');
            backend.deletePeer('info-hash-1', 'peer-id-1', spy);
            backend.swarms['info-hash-1'].peers.should.not.have.keys('peer-id-1');
            spy.calledWithExactly(null).should.be.true;
        });
    });

    describe('when getting an unknown swarm', function() {
        it('should not create an empty swarm', function() {
            backend.getSwarm('info-hash-1', { maxPeers: 50 }, sinon.spy());
            backend.swarms.should.not.have.keys('info-hash-1');
        });

        it('should return an error', function() {
            var spy = sinon.spy();
            backend.getSwarm('info-hash-1', { maxPeers: 50 }, spy);
            spy.calledWithExactly('unknown swarm').should.be.true;
        });
    });

    describe('when getting a known swarm', function() {
        var expectedSwarm = {
            leechers: 142,
            seeders: 123,
            peers: {
                'peer1': { ip: '1.2.3.4', port: 58901 },
                'peer2': { ip: '2.2.3.4', port: 58902 },
                'peer3': { ip: '3.2.3.4', port: 58903 },
                'peer4': { ip: '4.2.3.4', port: 58904 },
                'peer5': { ip: '5.2.3.4', port: 58905 },
                'peer6': { ip: '6.2.3.4', port: 58906 },
                'peer7': { ip: '7.2.3.4', port: 58907 },
                'peer8': { ip: '8.2.3.4', port: 58908 },
                'peer9': { ip: '9.2.3.4', port: 58909 },
                'peer10': { ip: '10.2.3.4', port: 58910 }
            }
        };

        it('should return the number of leechers', function(next) {
            backend.swarms['info-hash-1'] = expectedSwarm;
            backend.getSwarm('info-hash-1', { maxPeers: 50 }, function(err, swarm) {
                swarm.should.containEql({ leechers: 142 });
                next(err);
            });
        });

        it('should return the number of seeders', function(next) {
            backend.swarms['info-hash-1'] = expectedSwarm;
            backend.getSwarm('info-hash-1', { maxPeers: 50 }, function(err, swarm) {
                swarm.should.containEql({ seeders: 123 });
                next(err);
            });
        });

        it('should return the peers', function(next) {
            backend.swarms['info-hash-1'] = expectedSwarm;
            backend.getSwarm('info-hash-1', { maxPeers: 50 }, function(err, swarm) {
                ('peers' in swarm).should.be.true;
                next(err);
            });
        });

        describe('when the number of requested peers matches the number of peers in the swarm', function() {
            it('should return all the peers', function(next) {
                backend.swarms['info-hash-1'] = expectedSwarm;
                backend.getSwarm('info-hash-1', { maxPeers: 10 }, function(err, swarm) {
                    swarm.peers.should.have.keys(Object.keys(expectedSwarm.peers));
                    next(err);
                });
            });
        });

        describe('when the number of requested peers is greater than the number of peers in the swarm', function() {
            it('should return all the peers', function(next) {
                backend.swarms['info-hash-1'] = expectedSwarm;
                backend.getSwarm('info-hash-1', { maxPeers: 13 }, function(err, swarm) {
                    swarm.peers.should.have.keys(Object.keys(expectedSwarm.peers));
                    next(err);
                });
            });
        });

        describe('when the number of requested peers is smaller than the number of peers in the swarm', function() {
            it('should return a subset of the peers', function(next) {
                backend.swarms['info-hash-1'] = expectedSwarm;
                backend.getSwarm('info-hash-1', { maxPeers: 7 }, function(err, swarm) {
                    var peersIds = Object.keys(swarm.peers);
                    var allPeersIds = Object.keys(expectedSwarm.peers);

                    peersIds.length.should.equal(7);
                    peersIds.forEach(function(id) {
                        allPeersIds.should.containEql(id);
                    });

                    next(err);
                });
            });

            it('should randomize the peers returned', function(next) {
                backend.swarms['info-hash-1'] = expectedSwarm;

                backend.getSwarm('info-hash-1', { maxPeers: 4 }, function(err, swarm1) {
                    backend.getSwarm('info-hash-1', { maxPeers: 4 }, function(err, swarm2) {
                        backend.getSwarm('info-hash-1', { maxPeers: 4 }, function(err, swarm3) {
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
});
