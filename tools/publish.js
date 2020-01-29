/* eslint-disable no-console */
const { execSync } = require('child_process');
const { writeFileSync } = require("fs");
const { join } = require('path');

const args = process.argv.slice(2);
let version = '';
if (args.indexOf('-p') || args.indexOf('--patch') || args.indexOf('patch')) version = 'patch';
if (args.indexOf('-m') || args.indexOf('--minor') || args.indexOf('minor')) version = 'minor';
if (args.indexOf('-M') || args.indexOf('--major') || args.indexOf('major')) version = 'patch';
if (args.indexOf('--premajor') || args.indexOf('premajor')) version = 'premajor';
if (args.indexOf('--preminor') || args.indexOf('preminor')) version = 'preminor';
if (args.indexOf('--prepatch') || args.indexOf('prepatch')) version = 'prepatch';
if (args.indexOf('--prerelease') || args.indexOf('prerelease')) version = 'prerelease';

console.info("starting publish")
const options = { cwd: join(process.cwd(), '/bin') }
function runner() {
    let err = false;
    if (version) {
        try {
            const stdout = execSync(`npm version ${version}`, options)
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

if (pack && pack.version) {
    // eslint-disable-next-line global-require
    const currentPack = require('../package.json');
    currentPack.version = pack.version;
    console.log(pack.version);
    writeFileSync(join(process.cwd(), 'package.json'), JSON.stringify(currentPack, null, 4));
}

