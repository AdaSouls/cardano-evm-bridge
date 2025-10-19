const { ethers } = require('ethers');

const address = (address) => {
  if (!ethers.utils.isAddress(address)) {
    return false;
  }
  return true;
};

module.exports = {
  address,
};
