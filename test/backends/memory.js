var MemoryBackend = require('../../lib/backends/memory');
var fixtures = require('../fixtures/fixtures.json').backend;


describe('memory backend', function() {
    var backend = new MemoryBackend();

    beforeEach(function() {
        backend.setConfig(fixtures.config);
    });

    afterEach(function() {
        backend.clear();
    });

    require('./common')(backend, 'memory');
});
