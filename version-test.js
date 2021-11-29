const https = require('https');

const asyncHTTPRequest = url => new Promise((res, rej) => https.get(url, res).on('error', rej))

const getBufferFromStream = stream => new Promise((res, rej) => {
    stream.setEncoding('utf8');

    let fullResult = '';

    stream.on('data', chunk => fullResult += chunk);
    stream.on('end', () => res(fullResult));
});

const downloadJSON = async (url) => {
    const res = await asyncHTTPRequest(url);

    const statusCode = res.statusCode;

    if (statusCode < 200 && statusCode >= 300) {
        res.resume();

        throw new Error(`Request Failed. Status Code: ${statusCode}`);
    }

    const contentType = res.headers['content-type'];

    if (!/^application\/json/.test(contentType)) {
        res.resume();

        throw new Error(`Invalid content-type. Expected application/json but received ${contentType}`);
    }

    return JSON.parse(await getBufferFromStream(res));
};

const metaURL = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
const getMetaInformation = () => downloadJSON(metaURL);

const awaitTS = ts => new Promise(res => setTimeout(res, ts - Date.now()));
const awaitDelta = delta => new Promise(res => setTimeout(res, delta));

const tsToString = tsOrDate => {
    const data = typeof tsOrDate == 'number' ? new Date(tsOrDate) : tsOrDate;
    return data.toLocaleTimeString();
};

const nextMinuteInterval = (interval, inRelation = new Date()) => {
    if (60 % interval !== 0)
        throw new Error('The interval is a full devisor for 60 minutes.');

    const nextMinutes = (Math.floor(inRelation.getMinutes() / interval) + 1) * interval;

    const nd = new Date(inRelation);

    nd.setMinutes(nextMinutes);
    nd.setSeconds(0);
    nd.setMilliseconds(0);

    return nd;
};

const waitForDifferentReleaseVersion = async (version, interval) => {
    while (true) {
        const nowStr = '[' + tsToString(Date.now()) + ']';

        console.log(nowStr + ' Loading current release version id');

        const {latest: {release}} = await getMetaInformation();

        if (version != release) {
            console.log(nowStr + ' Found a new version: ' + release);
            return release;
        } else
            console.log(nowStr + ' Current Version is still: ' + version);

        const next = nextMinuteInterval(interval);

        console.log(nowStr + ' Waiting for next check time at ' + tsToString(next));

        await awaitTS(next);
    }
};

const ringBell = () => process.stdout.write('\u0007');

const notify = async () => {
    while (true) {
        for (let i = 0; i < 3; i++) {
            ringBell();
            await awaitDelta(850);
        }

        await awaitDelta(2500);
    }
}

const start = async () => {
    const [_node, _scriptfile,
        givenVersion = undefined,
        checkInterval = '20'
    ] = process.argv;

    let waitingForVersion = givenVersion;

    if (waitingForVersion === undefined) {
        const {latest: {release}} = await getMetaInformation();
        waitingForVersion = release;
        console.log('No version given, using the current latest version ' + waitingForVersion + '\n');
    }

    const parsedInterval = Number.parseInt(checkInterval);

    if (!Number.isInteger(parsedInterval)) {
        console.error('Can not parse the value "' + checkInterval + '" to an integer value');
        process.exit(1);
    }

    if (60 % parsedInterval !== 0) {
        console.error('The interval ' + parsedInterval + ' is not a full devisor for 60 minutes');
        process.exit(1);
    }

    if (parsedInterval < 5) {
        console.error('The interval ' + parsedInterval + ' is less than 5 minutes');
        process.exit(1);
    }

    console.log('Bell test: Ringining the bell...');
    ringBell();
    await awaitDelta(750);
    console.log('Make sure you were able to hear that otherwise the notification will not work!');

    console.log('\nWaiting for a version which is not ' + waitingForVersion + ', checking every ' + parsedInterval + ' minutes.\n');

    await waitForDifferentReleaseVersion(waitingForVersion, parsedInterval);

    console.log('You can kill this program now and open your Minecraft launcher');
    await notify();
};

start()
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
