const childProcess = require('child_process');
const crypto = require('crypto');
const util = require('util');

const random = util.promisify(crypto.randomBytes);

function execute(command, options) {
    const env = options && options.env ? { ...process.env, ...options.env } : process.env;
    return new Promise((resolve, reject) => {
        const safeCommand = `set -euo pipefail\n${command}`;
        childProcess.exec(safeCommand, { shell: '/bin/bash', env }, (error, stdout, stderr) => {
            const formattedStdout = removeFinalNewline(stdout);
            if (error) reject({ ...error, stdout: formattedStdout, stderr: removeFinalNewline(stderr) });
            else resolve(formattedStdout);
        })
    })
}

function pipe(command, options) {
    return function (stdIn) {
        return random(32)
            .then(randomId => randomId.toString('hex'))
            .then(randomId => execute(`${command} <<${randomId}\n${stdIn}\n${randomId}`, options))
    }
}

function removeFinalNewline(stdio) {
    return stdio.endsWith('\n') ? stdio.slice(0, -1) : stdio;
}

execute.pipe = pipe;
module.exports = execute;