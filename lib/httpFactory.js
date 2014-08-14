var Http = require('./http');


var HttpFactory = module.exports = function HttpFactory() {
};

HttpFactory.prototype.create = function() {
    return new Http();
};
