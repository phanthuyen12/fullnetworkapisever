const { Wallets, Gateway } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

async function main(orgname) {
    try {
        // Xác định đường dẫn đến file cấu hình mạng
        const ccpPath = path.resolve(__dirname, '../', 'organizations', 'peerOrganizations', `${orgname}.example.com`, `connection-${orgname}.json`);
        
        // Kiểm tra xem file cấu hình có tồn tại không
        if (!fs.existsSync(ccpPath)) {
            throw new Error(`Connection profile file does not exist at path: ${ccpPath}`);
        }
        
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        const caURL = ccp.certificateAuthorities[`ca.${orgname}.example.com`].url;
        const ca = new FabricCAServices(caURL);

        // Xác định đường dẫn đến wallet
        const walletPath = path.join(process.cwd(), 'wallet');
        console.log(`Wallet path: ${walletPath}`);
        
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Kiểm tra xem đã có adminIdentity chưa
        const adminIdentity = await wallet.get(`${orgname}`);
        if (!adminIdentity) {
            console.log(`An identity for the admin user "${orgname}" does not exist in the wallet`);
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, `${orgname}`);

        try {
            // Đăng ký và cấp chứng thực cho người dùng
            const secret = await ca.register({
                affiliation: `${orgname}.department1`,
                enrollmentID: `user${orgname}`,
                role: 'client'
            }, adminUser);

            const enrollment = await ca.enroll({
                enrollmentID: `user${orgname}`,
                enrollmentSecret: secret
            });

            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: `${orgname}MSP`,
                type: 'X.509',
            };
            await wallet.put(`user${orgname}`, x509Identity);
            console.log(`Successfully registered and enrolled user user${orgname} and imported it into the wallet`);
        } catch (registerError) {
            console.error(`Failed to register user user${orgname}: ${registerError.message}`);
        }
    } catch (error) {
        console.error(`Failed to register user user${orgname}: ${error.message}`);
        process.exit(1);
    }
}

const orgname = process.argv[2];
if (!orgname) {
    console.error('Organization name must be provided as a command-line argument');
    process.exit(1);
}
main(orgname);
