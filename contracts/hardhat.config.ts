import type { HardhatUserConfig } from "hardhat/config";
import { subtask } from "hardhat/config";
import { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } from "hardhat/builtin-tasks/task-names";
import "@nomicfoundation/hardhat-toolbox";

const SOLC_VERSION = "0.8.26";

// This sandbox's network policy blocks binaries.soliditylang.org, which is
// where Hardhat normally downloads solc from. The `solc` npm package (an
// ordinary dependency, installed from the regular npm registry) already
// bundles a matching solc-js build in node_modules, so this override points
// Hardhat straight at it instead of trying to download anything. Safe to
// remove once/if outbound access to binaries.soliditylang.org is available.
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD).setAction(
  async (args: { solcVersion: string }, _hre, runSuper) => {
    if (args.solcVersion === SOLC_VERSION) {
      return {
        compilerPath: require.resolve("solc/soljson.js"),
        isSolcJs: true,
        version: args.solcVersion,
        longVersion: `${args.solcVersion}+commit.local-npm-solc`,
      };
    }
    return runSuper(args);
  }
);

const config: HardhatUserConfig = {
  solidity: {
    version: SOLC_VERSION,
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
};

export default config;
