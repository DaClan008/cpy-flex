/* eslint-disable no-console */
const { execSync } = require('child_process');
const { writeFileSync } = require("fs");
const { join } = require('path');

const args = process.argv.slice(2);
let ignoreGit = false;
let ignorePack = false;
let v;
if (args.length > 0) {
    for (let i = 0, len = args.length; i < len; i++) {
        const val = args[i].replace(/^--/, '').toLowerCase();
        switch (val) {
            case 'p':
                v = 'patch';
                break;
            case 'm':
                v = 'minor';
                break;
            case 'M':
                v = 'major';
                break;
            case 'patch':
            case 'major':
            case 'minor':
            case 'premajor':
            case 'preminor':
            case 'prepatch':
            case 'from-git':
            case 'prerelease':
                v = val;
                break;
            case 'preid':
                if (len > i + 1) {
                    const next = args[i + 1];
                    if (v !== '') v += ' '
                    v += `--preid=${next}`;
                    i++;
                }
                break;
            case 'ignorepack':
                ignorePack = true;
                break;
            case 'ignoregit':
                ignoreGit = true;
            default:
                if (/^\d+\.\d+\.\d+/.test(val)) v = val;
                else if (/(--)?preid=.+/.test(val)) v += `${v !== '' ? ' ' : ''}--${val}`;
                break;
        }
    }
}

console.info("starting publish")
const options = { cwd: join(process.cwd(), '/bin') }
function runner() {
    let err = false;
    if (v) {
        try {
            const stdout = execSync(`npm version ${v}`, options)
            console.log(stdout.toString());
        } catch (error) {
            err = true;
            console.log(error);
        }
    }
    if (!err) {
        try {
            const stdout = execSync('npm publish', options)
            console.log(stdout.toString());
        } catch (error) {
            console.log(error);
        }
    }
    console.log("publishing completed");
}

runner();
const pack = require('../bin/package.json');

const { version } = pack;

if (version) {
    // eslint-disable-next-line global-require
    const currentPack = require('../package.json');
    currentPack.version = version;
    writeFileSync(join(process.cwd(), 'package.json'), JSON.stringify(currentPack, null, 4));
    console.log('package.json version updated:', pack.version);
    try {
        execSync(`git tag -a v${version} -m "updated version ${version}"`);
        console.log(`git package version updated: ${version}`)
    } catch (error) {
        console.log("error occured:\n", error);
    }

}

