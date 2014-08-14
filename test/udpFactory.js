var UdpFactory = require('../lib/udpFactory');
var Udp = require('../lib/udp');


describe('udp factory', function() {
    describe('when requesting an instance of udp', function() {
        it('should create one', function() {
            var udpFactory = new UdpFactory();

            udpFactory.create().should.be.an.instanceOf(Udp);
        });
    });
});
