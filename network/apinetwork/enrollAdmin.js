const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main(orgname) {
    try {
        console.log('Starting the script...');

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

        // Kiểm tra xem admin đã tồn tại trong wallet chưa
        const identity = await wallet.get(`${orgname}`);
        if (identity) {
            console.log(`An identity for the admin user "${orgname}" already exists in the wallet`);
            return;
        }

        // Đăng ký và cấp chứng thực cho admin
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: `${orgname}MSP`,
            type: 'X.509',
        };
        await wallet.put(`${orgname}`, x509Identity);

        console.log(`Successfully enrolled admin user "${orgname}" and imported it into the wallet`);
    } catch (error) {
        console.error(`Failed to enroll admin user "${orgname}": ${error.message}`);
        process.exit(1);
    }
}

const orgname = process.argv[2];
if (!orgname) {
    console.error('Organization name must be provided as a command-line argument');
    process.exit(1);
}
main(orgname);
