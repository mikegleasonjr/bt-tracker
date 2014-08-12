var backends = require('./backends');
var config = require('../lib/config');


module.exports = function(config, engine, httpFactory) {
    var backend = backends.get(config.backend);

    engine.setBackend(backend);
    engine.setConfig({
        maxPeers: config['max-peers']
    });

    if (config.http) {
        var http = httpFactory.create();

        http.setEngine(engine);
        http.setConfig({
            port: config['http-port'],
            trustProxy: config['http-trust-proxy'],
            interval: config['interval'],
            compress: config['http-compress']
        });
        http.serve();
    }
};
