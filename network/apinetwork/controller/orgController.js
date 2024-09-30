const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const ccpPath = path.resolve(__dirname, '..', '..', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

async function connectToNetwork() {
    const walletPath = path.join(process.cwd(),'apinetwork','wallet');
    console.log(walletPath);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: 'userorg1', // Thay đổi từ 'user1' thành 'user1admin'
        discovery: { enabled: true, asLocalhost: true }
    });

    const network = await gateway.getNetwork('channel1');
    const contract = network.getContract('organization');
    return { contract, gateway };
}
exports.hello= async(req,res)=>{
    const walletPath = path.join(process.cwd(),'apinetwork','wallet');
    console.log(walletPath);
    console.log('hellodata');
}
exports.createOrg = async (req, res) => { 
    const { nameadmin, emailadmin, addressadmin, phoneadmin, tokeorg} = req.body;
    console.log(req.body);
    // if (!nameadmin || !emailadmin || !addressadmin || !phoneadmin || !tokeorg)  {
    //     return res.status(400).send('Invalid input');
    // }

    try {
        const { contract, gateway } = await connectToNetwork();
        await contract.submitTransaction('createOrganization', nameadmin, emailadmin, addressadmin, phoneadmin, tokeorg);
        await gateway.disconnect();
        res.status(200).send('org has been added');
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send('Failed to add org');
    }
};

exports.getAllHospital = async (req, res) => {
    try {
        const { contract, gateway } = await connectToNetwork();
        const result = await contract.evaluateTransaction('getAllHospitals');
        await gateway.disconnect();
        res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).send('Failed to get all students');
    }
};