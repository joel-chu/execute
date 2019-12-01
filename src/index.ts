import {exec} from 'child_process';
import {randomBytes} from 'crypto';
import {promisify} from "util";

const random = promisify(randomBytes);

type ExecuteOptions = { env?: { [x: string]: string } };

export function execute(command: string, options?: ExecuteOptions): Promise<string> {
    const env = options && options.env ? {...process.env, ...options.env} : process.env;
    return new Promise((resolve, reject) => {
        const safeCommand = `set -euo pipefail\n${command}`;
        exec(safeCommand, {shell: '/bin/bash', env}, (error, stdout, stderr) => {
            const formattedStdout = removeFinalNewline(stdout);
            if (error) reject({...error, stdout: formattedStdout, stderr: removeFinalNewline(stderr)});
            else resolve(formattedStdout);
        })
    })
}

export function pipe(command: string, options?: ExecuteOptions): (x: string) => Promise<string> {
    return function (stdIn: string) {
        return random(32)
            .then(randomId => randomId.toString('hex'))
            .then(randomId => execute(`${command} <<${randomId}\n${stdIn}\n${randomId}`, options))
    }
}

function removeFinalNewline(stdio: string) {
    return stdio.endsWith('\n') ? stdio.slice(0, -1) : stdio;
}