# EVM indexing squids

This repo contains sample [squid ETLs](https://docs.subsquid.io/overview/) for indexing, transforming and presenting on-chain data of Substrate networks as GraphQL APIs. Each squid highlights a specific feature of the Subquid SDK.

## Overview

- [1-events](https://github.com/subsquid-labs/substrate-events-example): Indexes `Balance.Transfer` events on Kusama.
- [2-calls](https://github.com/subsquid-labs/substrate-calls-example): Indexes calls to `Identity.set_identity` and `Identity.clear_indentity`.
- [3-storage](https://github.com/subsquid-labs/substrate-storage-example): Queries the historical network storage state to enrich event data.
- [4-constants](): TBA
- [5-frontier](https://github.com/subsquid-labs/substrate-frontier-example): Indexes EVM logs emitted by a contract on Moonriver. The approach shown in this example is suitable for use cases requiring a mixture of Substrate and EVM data; consider using [EVM processor](https://docs.subsquid.io/evm-indexing) instead if you only need EVM data.
- [6-remark](https://github.com/subsquid-labs/substrate-remark-example): Indexes on-chain footnotes made by the `system.remark` extrinsic.
- [8-custom-resolver](https://github.com/subsquid-labs/squid-substrate-examples/tree/master/8-custom-resolver): Indexes `Balance.Transfer` events and outputs total daily volumes via a custom GraphQL resolver.

## Prerequisites

- Node v16.x
- Docker
- Squid CLI

To install the Squid CLI, run 

```
npm i -g @subsquid/cli
```

## Running 

Navigate to the example folder.

```bash
npm ci
sqd build
# start the database
sqd up
# starts a long-running ETL and blocks the terminal
sqd process

# starts the GraphQL API server at localhost:4350/graphql
sqd serve
```
