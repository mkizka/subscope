# Subscope

<img src="./icon.png" width="128">

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

- subscope ... Main server providing client and admin dashboard
- appview ... AppView server that exposes the XRPC API and serves the `did:web` document
- ingester ... Receives Jetstream events and adds jobs
- worker ... Worker that processes Tap events

Image proxying uses [atblob](https://github.com/mkizka/atblob) as a Docker container.

## Deployment

WIP

## Development

Node.js and Docker are required. Run the following commands to start the development server.

```
cp packages/db/.env.example packages/db/.env
corepack enable pnpm
pnpm i
pnpm dev
```

The following servers will start.

- subscope ... http://localhost:3000
- appview ... http://localhost:3001
- worker ... http://localhost:3003
- ingester ... http://localhost:3004
