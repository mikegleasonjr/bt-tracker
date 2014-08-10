var fs = require('fs');
var path = require('path');


(function(){
    var backends = {};

    fs.readdirSync(path.join(__dirname, 'backends')).forEach(function(source) {
        var Backend = require('./backends/' + source);
        var instance = new Backend();
        backends[instance.getName()] = instance;
    });

    module.exports.get = function(name) {
        return backends[name];
    };

    module.exports.list = function() {
        return Object.keys(backends);
    };
})();
