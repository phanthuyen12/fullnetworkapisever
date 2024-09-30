const path = require("path");
const fs = require("fs");
const { Gateway, Wallets } = require("fabric-network");

async function connectToNetworkmedical() {
  const ccpPath = path.resolve(
    __dirname,
    "..",
    "..",
    "network",
    "organizations",
    "peerOrganizations",
    "org1.example.com",
    "connection-org1.json"
  );
  const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

  const walletPath = path.join(process.cwd(), "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: "userorg1",
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork("channel1");
  const contract = network.getContract("medical");

  return { contract, gateway };
}
async function connectToNetworkorg() {
  const ccpPath = path.resolve(
    __dirname,
    "..",
    "..",
    "network",
    "organizations",
    "peerOrganizations",
    "org1.example.com",
    "connection-org1.json"
  );
  const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

  const walletPath = path.join(process.cwd(), "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: "userorg1",
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork("channel1");
  const contract = network.getContract("organization");

  return { contract, gateway };
}
async function connectToNetworkorgvalue(value) {
  const ccpPath = path.resolve(
    __dirname,
    "..",
    "..",
    "network",
    "organizations",
    "peerOrganizations",
    `${value}.example.com`,
    `connection-${value}.json`
  );
  const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

  const walletPath = path.join(process.cwd(), "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: `user${value}`,
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork("channel1");
  const contract = network.getContract("organization");

  return { contract, gateway };
}
async function connectToNetworkmedicalvalue(value) {
  const ccpPath = path.resolve(
    __dirname,
    "..",
    "..",
    "network",
    "organizations",
    "peerOrganizations",
    `${value}.example.com`,
    `connection-${value}.json`
  );
  const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

  const walletPath = path.join(process.cwd(), "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: `user${value}`,
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork("channel1");
  const contract = network.getContract("medical");

  return { contract, gateway };
}
module.exports = { connectToNetworkmedical ,connectToNetworkorg,connectToNetworkorgvalue,connectToNetworkmedicalvalue};
