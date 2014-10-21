var backends = require('./backends');
var extend = require('util')._extend;


module.exports = function(config, engine, httpFactory, udpFactory) {
    var backend = backends.get(config.backend);

    backend.setConfig(getBackendOpts(config));

    engine.setBackend(backend);
    engine.setConfig({
        maxPeers: config.maxPeers
    });

    config.http && httpFactory.create()
        .setEngine(engine)
        .setConfig({
            port: config.httpPort,
            trustProxy: config.httpTrustProxy,
            interval: config.interval,
            compress: config.httpCompress
        })
        .serve();

    config.udp && udpFactory.create()
        .setEngine(engine)
        .setConfig({
            port: config.udpPort,
            interval: config.interval
        })
        .serve();
};

function getBackendOpts(config) {
    var opts = {
        peerTTL: config.interval * 3
    };

    if (config.backend === 'mongodb') {
        extend(opts, {
            host: config.mongodbHost,
            port: config.mongodbPort
        });
    }

    return opts;
}
