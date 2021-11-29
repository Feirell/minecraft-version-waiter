# Minecraft version waiter

This is a script I wrote to notify me when a new version of Minecraft is released.
If you are waiting for a new version as well, and want to be notified, when it is available for download, then you can use this script too!
You just need to download nodejs https://nodejs.org and the script and run this script like so:

```shell
node /path/to/version-test.js
```

You can supply two arguments.
The first one is the currently release version you have, for which you want to be notified if it has changed.
The second one is an interval, in minutes, to wait to check for a new version.

For example to check for a new different version then 1.17.1 every 20 minutes you could do it like so:

```shell
node /path/to/version-test.js 1.17.1 20
```
