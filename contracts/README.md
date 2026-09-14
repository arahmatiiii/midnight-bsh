# Midnight BSH — optional on-chain contract

This is **not required** to run the Midnight BSH web app — the app's
database is its source of truth. This is here for anyone who wants a fully
on-chain, trustless variant of the same idea: posts, votes, and self-claimed
certificates, plus a night-window gate, all enforced by `MidnightBSH.sol`.

## Differences from the app

- The night window is UTC-only (no IANA timezone/DST support is possible
  on-chain) and configurable by the deployer via `setWindow(startHour, endHour)`.
- There's no archive/rollover job — all posts stay on-chain forever. Reading
  "yesterday's top posts" is left to an off-chain indexer of the
  `PostCreated`/`Voted` events, which this repo doesn't implement.
- Certificates are a fixed list set at deploy time (constructor args), not
  editable afterwards.

## Usage

```bash
npm install
npm run compile
npm test
```

To deploy (requires a configured Hardhat network — see
[Hardhat's docs](https://hardhat.org/hardhat-runner/docs/guides/deploying)
for adding a testnet/mainnet RPC + private key):

```bash
npx hardhat run scripts/deploy.ts --network <your-network>
```

## A note on the local solc override

`hardhat.config.ts` overrides Hardhat's `TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD`
subtask to load the Solidity compiler from the `solc` npm package already in
`node_modules` instead of downloading it from `binaries.soliditylang.org`.
This was needed because the sandbox this was built in blocks that host; it's
harmless to keep (it just avoids a network round-trip) or to delete if you'd
rather let Hardhat manage the compiler download itself.
