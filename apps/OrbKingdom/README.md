# OrbKingdom Server

## Operation

The operation of the OrbKingdom server is quite simple, you just need to run:
```
npm start
```
This will use Docker Compose to set up the Nakama docker-compose file and will create the containers needed to run the server. It also handles hot reloading of the code with a combination of Rollup for building and Nodemon to restart the container if watches are triggered on any of the files in this repository.

## Deployment
Deployment steps are still needed.

## TypeScript Restrictions and Caveats
It's important to note that Nakama has some specific restrictions on how you can write and compile your TypeScript code:

1. All code must compile down to ES5 compliant JavaScript: Nakama's JavaScript runtime is powered by the Goja VM, which supports the JavaScript ES5 specification. This means you can't use newer JavaScript features that aren't included in ES5.

2. Your code cannot interact with the OS in any way, including the file system: This is a security measure to prevent potentially malicious actions.

3. You cannot use any module that relies on NodeJS functionality (e.g. crypto, fs, etc.): Module code is not running in a Node environment, it's running inside the Nakama server. This means Node-specific modules and features are not available. (Might be possible to manually compile them into the build index.js file)

4. Typescript anotations can function normally as they are removed when building.

For specific compatibility issues present within Goja see the Goja known incompatibilities and caveats.

## Future Structure to get around Nakama Caveats:
Build only game logic inside of Nakama, anything that needs node_modules or more complex code can be done inside the Express backend of the torrinleonard.com (orbkingdom.com after we migrate to a new repo independent from my personal website repo). We might be able to facilitate this with the [httpRequest](https://heroiclabs.com/docs/nakama/server-framework/typescript-runtime/function-reference/#httpRequest) function, we could also possibly modify the Nakama container to include a node image and run an aditional app inside the conainer, that way it is one container but with two servers, Nakama, and a Nodejs express server that Nakama can call too so that we get around the Goja issue.
