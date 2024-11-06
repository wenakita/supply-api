const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("https://rpc.ankr.com/arbitrum");

module.exports = {
  provider
}; 