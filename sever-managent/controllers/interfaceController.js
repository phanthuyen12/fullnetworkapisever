const path = require("path");
const fs = require("fs");
const { Gateway, Wallets } = require("fabric-network");
const { connectToNetwork } = require('./network'); // Chỉnh đường dẫn tùy theo cấu trúc thư mục của bạn

async function connectToNetworklist() {
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
  const contract = network.getContract("mediaca");

  return { contract, gateway };
}

exports.listOrg = async (req, res) => {
    const { contract, gateway } = await connectToNetwork();

    console.log(model);
}
exports.index = async (req, res) => {
    const model = req.query.model;
    console.log(model);
}
