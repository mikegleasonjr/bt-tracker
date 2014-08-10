var HttpFactory = require('../lib/httpFactory');
var Http = require('../lib/http');


describe('http factory', function() {
    describe('when requesting an instance of http', function() {
        it('should create one', function() {
            var httpFactory = new HttpFactory();

            httpFactory.create().should.be.an.instanceOf(Http);
        });
    });
});
