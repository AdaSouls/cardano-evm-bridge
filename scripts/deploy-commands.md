# Deploy & Verify Commands for Pyrope

## Deploy Contracts (Truffle)

```bash
# Deploy FalconToken and FalconBridge
truffle migrate --network pyrope -f 3 --to 3
```

## Generate Flattened Files for Verification

```bash
# Generate FalconToken_flat.sol
node -e "
const fs = require('fs');
const clean = (code) => {
  return code
    .replace(/\/\/ SPDX-License-Identifier:.*\n/g, '')
    .replace(/pragma solidity.*;\n/g, '')
    .replace(/import .*;\n/g, '')
    .trim();
};

const flat = \`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

\${clean(fs.readFileSync('node_modules/@openzeppelin/contracts/utils/Context.sol', 'utf8'))}
\${clean(fs.readFileSync('node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol', 'utf8'))}
\${clean(fs.readFileSync('node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol', 'utf8'))}
\${clean(fs.readFileSync('node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol', 'utf8'))}
\${clean(fs.readFileSync('node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol', 'utf8'))}
\${clean(fs.readFileSync('src/contracts/FalconToken.sol', 'utf8'))}
\`;
fs.writeFileSync('build/FalconToken_flat.sol', flat);
"

# Generate FalconBridge_flat.sol
node -e "
const fs = require('fs');
const clean = (code) => {
  return code
    .replace(/\/\/ SPDX-License-Identifier:.*\n/g, '')
    .replace(/pragma solidity.*;\n/g, '')
    .replace(/import .*;\n/g, '')
    .trim();
};

const flat = \`// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

\${clean(fs.readFileSync('node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol', 'utf8'))}
\${clean(fs.readFileSync('src/contracts/interfaces/IToken.sol', 'utf8'))}
\${clean(fs.readFileSync('src/contracts/BridgeBase.sol', 'utf8'))}
\${clean(fs.readFileSync('src/contracts/FalconBridge.sol', 'utf8'))}
\`;
fs.writeFileSync('build/FalconBridge_flat.sol', flat);
"
```

## Verify Contracts Manually in Blockscout

1. Go to contract address in explorer
2. Click "Contract" → "Verify & Publish"
3. Select **"Solidity (Single file)"**
4. **Compiler version**: `v0.8.20+commit.a1b79de6`
5. **Optimization**: Disabled (No)
6. **Contract name**: `FalconToken` or `FalconBridge`
7. Paste content from `build/FalconToken_flat.sol` or `build/FalconBridge_flat.sol`

### FalconBridge Constructor Args
For FalconBridge, you need to provide constructor arguments (ABI-encoded):
- Token address: `0xaabeEC6aC5d908e00474EFd75C0cB66412AC8Be9`
- ABI-encoded: `000000000000000000000000aabeec6ac5d908e00474efd75c0cb66412ac8be9`

## Deployed Addresses (Jan 24, 2026)

| Contract | Address |
|----------|---------|
| FalconToken | `0xaabeEC6aC5d908e00474EFd75C0cB66412AC8Be9` |
| FalconBridge | `0x45F281f95709016A7B70F59cc4f39445440c0c75` |

## Block Explorer Links
- FalconToken: https://explorer.pyropechain.com/address/0xaabeec6ac5d908e00474efd75c0cb66412ac8be9
- FalconBridge: https://explorer.pyropechain.com/address/0x45f281f95709016a7b70f59cc4f39445440c0c75
