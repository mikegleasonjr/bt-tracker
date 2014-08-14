var spawn = require('child_process').spawn;


module.exports = function() {
    var params = [];
    var waitForStdout = undefined;
    var expectedStdout = undefined;
    var expectedStderr = undefined;
    var env = undefined;
    var checkHandler = undefined;

    var withParams = function(p) {
        params = p;
        return {
            whenStdout: whenStdout,
            withEnv: withEnv,
            expectStdout: expectStdout,
            expectStderr: expectStderr
        };
    };

    var withoutParams = function() {
        return {
            whenStdout: whenStdout,
            withEnv: withEnv,
            expectStdout: expectStdout,
            expectStderr: expectStderr,
            expect: check
        };
    };

    var withEnv = function(key, val) {
        env = { key: key, val: val };
        return {
            whenStdout: whenStdout
        };
    };

    var whenStdout = function(s) {
        waitForStdout = s;
        return {
            check: check
        };
    };

    var expectStdout = function(s) {
        expectedStdout = s;
        return {
            onRun: onRun
        };
    };

    var expectStderr = function(s) {
        expectedStderr = s;
        return {
            onRun: onRun
        };
    };

    var check = function(f) {
        checkHandler = f;
        return {
            onRun: onRun
        };
    };

    var onRun = function(callback) {
        var options = { env: {} };
        var proc;

        Object.keys(process.env).forEach(function(key) {
            options.env[key] = process.env[key];
        });

        if (env) {
            options.env[env.key] = env.val;
        }

        proc = spawn('node', ['index.js'].concat(params), options);

        proc.stdout.on('data', function(data) {
            if (waitForStdout) {
                if (data.toString().indexOf(waitForStdout) !== -1) {
                    if (checkHandler) {
                        checkHandler(callback);
                    }
                }
            }
            else if (expectedStdout) {
                if (data.toString().indexOf(expectedStdout) !== -1) {
                    callback();
                }
            }
        });

        proc.stderr.on('data', function(data) {
            if (expectedStderr) {
                if (data.toString().indexOf(expectedStderr) !== -1) {
                    proc.kill();
                    callback();
                }
            }
        });

        if (!waitForStdout && !expectedStdout && !expectedStderr) {
            callback();
        }
    };
    
    return {
        withParams: withParams,
        withoutParams: withoutParams
    };
};
