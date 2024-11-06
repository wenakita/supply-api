require('dotenv').config();
const express = require("express");
const ethers = require("ethers");
const fs = require("fs").promises;
const MinterAbi = require("./abis/baseV1Minter.json").abi;
const Erc20Abi = require("./abis/erc20.json").abi;
const { provider } = require("./utils/constants");
const cors = require('express-cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const hermesAddress = "0x45940000009600102A1c002F0097C4A500fa00AB";
const minterAddress = "0x000000B473F20DEA03618d00315900eC5900dc59";
const hermesTimelockAddress = "0x716147a2169246c09f47D9880Bf85D49093A92C4";

const maiaAddress = "0x00000000ea00F3F4000e7Ed5Ed91965b19f1009B";
const maiaTimelockAddress = "0x744f3EC772AAA9f0d40398b90F9E856EF88D118A";

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

async function getHermesCirculatingSupply() {
  const hermes = new ethers.Contract(hermesAddress, Erc20Abi, provider);
  const minter = new ethers.Contract(minterAddress, MinterAbi, provider);
  const circulating_supply = await minter.circulatingSupply();
  const hermesTimelockBalance = await hermes.balanceOf(hermesTimelockAddress);

  const circulatingSupply = circulating_supply - hermesTimelockBalance;
  return (circulatingSupply / BigInt(10 ** 18)).toString();
}

async function getMaiaCirculatingSupply() {
  const maia = new ethers.Contract(maiaAddress, Erc20Abi, provider);
  const maiaTimelockBalance = await maia.balanceOf(maiaTimelockAddress);

  const totalSupply = BigInt(315000) * BigInt(10 ** 18);
  const circulatingSupply = totalSupply - maiaTimelockBalance;
  return (circulatingSupply / BigInt(10 ** 18)).toString();
}

async function getHermesTotalSupply() {
  try {
    const hermes = new ethers.Contract(hermesAddress, Erc20Abi, provider);
    console.log("Calling totalSupply...");
    const totalSupply = await hermes.totalSupply();
    console.log("Raw total supply:", totalSupply.toString());
    return (totalSupply / BigInt(10 ** 18)).toString();
  } catch (error) {
    console.error("Error in getHermesTotalSupply:", error);
    throw error;
  }
}

async function getMaiaTotalSupply() {
  const maia = new ethers.Contract(maiaAddress, Erc20Abi, provider);
  const totalSupply = await maia.totalSupply();
  return (totalSupply / BigInt(10 ** 18)).toString();
}

// API endpoint for Hermes Circulating Supply
app.get("/api/hermes-circulating-supply", async (req, res) => {
  try {
    const supply = await getHermesCirculatingSupply();
    res.json({ hermesCirculatingSupply: supply });
  } catch (error) {
    console.error("Hermes error:", error);
    res.status(500).json({ error: "Error fetching Hermes supply" });
  }
});

// API endpoint for Maia Circulating Supply
app.get("/api/maia-circulating-supply", async (req, res) => {
  try {
    const supply = await getMaiaCirculatingSupply();
    res.json({ maiaCirculatingSupply: supply });
  } catch (error) {
    console.error("Maia error:", error);
    res.status(500).json({ error: "Error fetching Maia supply" });
  }
});

// Add these new endpoints
app.get("/api/hermes-total-supply", async (req, res) => {
  try {
    console.log("Fetching Hermes total supply...");
    const supply = await getHermesTotalSupply();
    console.log("Processed supply:", supply);
    res.json({ hermesTotalSupply: supply });
  } catch (error) {
    console.error("Detailed Hermes error:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: "Error fetching Hermes total supply",
      details: error.message 
    });
  }
});

app.get("/api/maia-total-supply", async (req, res) => {
  try {
    const supply = await getMaiaTotalSupply();
    res.json({ maiaTotalSupply: supply });
  } catch (error) {
    console.error("Maia error:", error);
    res.status(500).json({ error: "Error fetching Maia total supply" });
  }
});

app.get("/api/hermes-supply", async (req, res) => {
  try {
    const [circulating, total] = await Promise.all([
      getHermesCirculatingSupply(),
      getHermesTotalSupply()
    ]);
    res.json({ 
      hermesCirculatingSupply: circulating,
      hermesTotalSupply: total 
    });
  } catch (error) {
    console.error("Hermes error:", error);
    res.status(500).json({ error: "Error fetching Hermes supply data" });
  }
});

app.get("/api/maia-supply", async (req, res) => {
  try {
    const [circulating, total] = await Promise.all([
      getMaiaCirculatingSupply(),
      getMaiaTotalSupply()
    ]);
    res.json({ 
      maiaCirculatingSupply: circulating,
      maiaTotalSupply: total 
    });
  } catch (error) {
    console.error("Maia error:", error);
    res.status(500).json({ error: "Error fetching Maia supply data" });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
