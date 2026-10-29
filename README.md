# Subscope

<img src="./apps/web/public/favicon.svg" width="128">

> [!WARNING]
> This project is under development. All features are subject to breaking changes.
> There is no guarantee that any feature will work correctly.

An attempt to implement a small-scale Bluesky-compatible AppView by limiting the data to be stored.

Subscribe & Scoped AppView = Subscope

## Concept

Similar to ActivityPub implementations, Subscope only stores data from registered accounts and the accounts they follow. This is achieved using [Tap](https://github.com/bluesky-social/indigo/tree/main/cmd/tap).

The goal is to enable self-hosting on a typical VPS with around 4 cores / 4GB RAM / 100GB storage.

## System Architecture

Server implementations are located under the apps directory.

- web ... Web client and admin dashboard
- appview ... AppView server that exposes the XRPC API and serves the `did:web` document
- ingester ... Receives Tap events and adds jobs
- worker ... Worker that indexes records into the database

## Deployment

See [docs/user/deploy.md](./docs/user/deploy.md).

## Development

Node.js and Docker are required. Run the following commands to start the development server.

```
corepack enable pnpm
pnpm i
pnpm dev
```

The following servers will start.

- web ... http://localhost:3000
- appview ... http://localhost:3001
- worker ... http://localhost:3003
- ingester ... http://localhost:3004

A local PLC and PDS are also started with the test account `alice.test` / `password`.
