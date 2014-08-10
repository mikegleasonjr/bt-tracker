var net = require('net');
var ip = require('ip');


module.exports = {
    announce: function(parameters) {
        var sanitized = {};

        sanitized.infoHash = parameters['info_hash'];
        if (sanitized.infoHash === undefined) {
            return { 'error': 'missing info_hash' };
        }

        if (sanitized.infoHash.length !== 20) {
            return { 'error': 'invalid info_hash' };
        }

        sanitized.peerId = parameters['peer_id'];
        if (sanitized.peerId === undefined) {
            return { 'error': 'missing peer_id' };
        }

        if (sanitized.peerId.length !== 20) {
            return { 'error': 'invalid peer_id' };
        }

        sanitized.port = parameters['port'];
        if (sanitized.port === undefined) {
            return { 'error': 'missing port' };
        }

        sanitized.port = parseInt(sanitized.port);
        if (isNaN(sanitized.port) || sanitized.port < 1 || sanitized.port > 65535) {
            return { 'error': 'invalid port' };
        }

        for (var p in { 'uploaded':'', 'downloaded':'', 'left':'' }) {
            sanitized[p] = parameters[p];
            if (sanitized[p] === undefined) {
                return { 'error': 'missing ' + p };

            }
            sanitized[p] = parseInt(sanitized[p]);
            if (isNaN(sanitized[p]) || sanitized[p] < 0) {
                return { 'error': 'invalid ' + p };
            }
        }

        if (parameters['compact']) {
            sanitized.compact = parseInt(parameters['compact']);
            if (sanitized.compact !== 0 && sanitized.compact !== 1) {
                return { 'error': 'invalid compact' };
            }
        }

        if (parameters['event']) {
            sanitized.event = parameters['event'];
            if (!/^(started|completed|stopped)$/.test(sanitized.event)) {
                return { 'error': 'invalid event' };
            }
        }

        if (parameters['numwant']) {
            sanitized.numwant = parseInt(parameters['numwant']);
            if (isNaN(sanitized.numwant) || sanitized.numwant < 0) {
                return { 'error': 'invalid numwant' };
            }
        }

        if (parameters['ip']) {
            sanitized.ip = parameters['ip'];
            if (!net.isIP(sanitized.ip) || ip.isPrivate(sanitized.ip)) {
                return { 'error': 'invalid ip' };
            }
        }

        if (parameters['no_peer_id']) {
            sanitized.noPeerId = parseInt(parameters['no_peer_id']);
            if (sanitized.noPeerId !== 0 && sanitized.noPeerId !== 1) {
                return { 'error': 'invalid no_peer_id' };
            }
        }

        return sanitized;
    }
};
