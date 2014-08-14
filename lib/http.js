var util = require('util');
var express = require('express');
var responseTime = require('response-time');
var bencode = require('bencode');
var querystring = require('querystring');
var string2compact = require('string2compact');
var compression = require('compression');
var pkg = require('../package.json');


querystring.unescape = unescape;

var Http = module.exports = function Http() {
    this.config = null;
    this.engine = null;
    this.app = express();

    this.app.set('query parser', querystring.parse);
    this.app.enable('strict routing');

    this.app.use(compression({ filter: this.canCompressResponse.bind(this) }));
    this.app.use(responseTime());
    this.app.use(this.onAnyRequest.bind(this));

    this.app.get('/heartbeat', this.onHeartbeat.bind(this));
    this.app.get('/announce', this.onAnnounce.bind(this));
};

Http.prototype.setConfig = function(config) {
    this.config = config;

    this.app.set('trust proxy', config.trustProxy);
    this.app.set('x-powered-by', false);
};

Http.prototype.setEngine = function(engine) {
    this.engine = engine;
};

Http.prototype.serve = function() {
    this.app.listen(this.config.port, function() {
        util.log('HTTP server listening on port ' + this.config.port);
    }.bind(this));
};

Http.prototype.onAnyRequest = function(req, res, next) {
    res.set('Content-Type', 'text/plain');
    res.set('X-Powered-By', pkg.name + ' ' + pkg.version);
    next();
};

Http.prototype.canCompressResponse = function() {
    return this.config.compress === true;
};

Http.prototype.onHeartbeat = function(req, res) {
    res.send('OK');
};

Http.prototype.onAnnounce = function(req, res) {
    if (!req.query.ip) {
        req.query.ip = req.ip;
    }

    this.engine.announce(req.query, function(err, swarm) {
        if (err) {
            res.send(bencode.encode({ 'failure reason': err }));
            return;
        }

        var skipPeerId = Number(req.query.no_peer_id) === 1;
        var peers = Number(req.query.compact) === 1 ?
            this._buildPeersResponseCompact(swarm.peers) :
            this._buildPeersResponse(swarm.peers, skipPeerId);

        res.send(bencode.encode({
            complete: swarm.seeders,
            incomplete: swarm.leechers,
            interval: this.config.interval,
            peers: peers
        }));
    }.bind(this));
};

Http.prototype._buildPeersResponseCompact = function(peers) {
    return string2compact(Object.keys(peers).map(function(peerId) {
        var peer = peers[peerId];
        return peer.ip + ':' + peer.port;
    }));
};

Http.prototype._buildPeersResponse = function(peers, skipPeerId) {
    return Object.keys(peers).map(function(peerId) {
        var peer = peers[peerId];
        return skipPeerId ?
            { ip: peer.ip.toString(), port: peer.port } :
            { 'peer id': peerId.toString(), ip: peer.ip.toString(), port: peer.port };
    });
};
