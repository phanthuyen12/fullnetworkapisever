const path = require("path");
const fs = require("fs");
const { Gateway, Wallets } = require("fabric-network");
const bcrypt = require('bcrypt');
const { connectToNetworkorgvalue ,connectToNetworkorg,connectToNetworkmedicalvalue} = require('../controllers/network');
const jwt = require('jsonwebtoken');
async function connectToNetwork() {
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
exports.updateRecords= async (req,res) =>{
  const {  cccd,tokenmedical, birthDate, gender, address, phoneNumber, identityCard} = req.body;

  console.log('Request body:', req.body);
  if (!cccd||!tokenmedical || !birthDate || !gender || !address || !phoneNumber ||!identityCard) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }

  try {
    // Connect to the network
    const { contract, gateway } = await connectToNetwork();
    const currentTime = new Date();


    // Submit transaction
    const result = await contract.submitTransaction('updateRecord',cccd, tokenmedical, birthDate, gender, address, phoneNumber, identityCard, currentTime.toISOString());

    if (result) {
      console.log('Transaction result:', result.toString());
      // Return success response
      const parsedResult = JSON.parse(result.toString());

      res.status(200).json({
        message: "Login has been processed successfully",
        transactionResult: parsedResult
      });
    } else {
      console.error('Result is undefined');
      res.status(500).json({ success: false, message: 'Unexpected result from transaction' });
    }

    // Disconnect from the gateway
    await gateway.disconnect();
  } catch (error) {
    console.error(`Failed to submit transaction: ${error.message}`);
    res.status(500).json({ success: false, message: `Failed to add organization: ${error.message}` });
  }
}
exports.registerMedical = async (req, res) => {
  const { name, email, cccd, passwordmedical } = req.body;
  console.log('Request body:', req.body);

  // Validate input
  if (!name || !email || !passwordmedical || !cccd) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }

  try {
    // Connect to the network
    const { contract, gateway } = await connectToNetwork();
    const currentTime = new Date();
    const saltRounds = 10;
    
    // Hash the password
    const passwordmedicalnew = await bcrypt.hash(passwordmedical, saltRounds);

    // Submit transaction
    const result = await contract.submitTransaction('registerMedical', name, email, cccd, passwordmedicalnew, currentTime.toISOString());

    if (result) {
      console.log('Transaction result:', result.toString());
      // Return success response
      res.status(200).json({ success: true, message: 'Organization has been added' });
    } else {
      console.error('Result is undefined');
      res.status(500).json({ success: false, message: 'Unexpected result from transaction' });
    }

    // Disconnect from the gateway
    await gateway.disconnect();
  } catch (error) {
    console.error(`Failed to submit transaction: ${error.message}`);
    res.status(500).json({ success: false, message: `Failed to add organization: ${error.message}` });
  }
};

exports.getfullRecords= async (req,res) =>{
  try{
    const { contract, gateway } = await connectToNetwork();
    await gateway.disconnect();
    
    const result =  await contract.submitTransaction('getAllMedicalRecords');
        if (result) {
          console.log("Transaction result:", result.toString());
          const parsedResult = JSON.parse(result.toString());

          res.status(200).json({
            message: "Organization has been added successfully",
            transactionResult: parsedResult
        });
        } else {
          console.error("Result is undefined");
          res.status(500).send("Unexpected result from transaction");
        }
  } catch (error) {
    // Xử lý lỗi kết nối hoặc lỗi bất ngờ
    console.error('Error in createUser handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
exports.loginmedical = async (req, res) => {
  let gateway;
  try {
    const { contract, gw } = await connectToNetwork();
    gateway = gw;
    const { cccd, passwordmedical } = req.body;

    const result = await contract.submitTransaction('loginMedical', cccd, passwordmedical);
    // if (!result) return res.status(500).json({ error: "Unexpected result from transaction" });

    const parsedResult = JSON.parse(result.toString());

    // // Check if the structure exists
  
    // console.log(parsedResult.existingRecord.passwordmedical)
    const passwordMatch = await bcrypt.compare(passwordmedical,parsedResult.existingRecord.passwordmedical);
    if (!passwordMatch) return res.status(401).json({ message: "Incorrect password. Please try again." });
    
    const payload = {
      tokenmedical: parsedResult.existingRecord.tokenmedical,
      name: parsedResult.existingRecord.name,
      email: parsedResult.existingRecord.email,
      cccd: parsedResult.existingRecord.cccd
    };

    const secretKey = 'ee2de3938caccb365423140f03873e7b3f2032696632c594131835fe88db55f76f5580f678835c22b578de32cc7ec35d9f0a42a65dec98a839625b5611296e70';
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
    
    res.status(200).json({
      message: "Login has been processed successfully",
      transactionResult: token
    });

  } catch (error) {
    console.error('Error in loginmedical handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });

  } finally {
    if (gateway) await gateway.disconnect();
  }
};


exports.hasAccess= async (req, res) => {
    try{
        const { contract, gateway } = await connectToNetwork();
        const {tokenmedical,tokenorg} =  req.body;
        console.log(req.body);
        if(!tokenmedical){
          return res.status(400).json({ error: 'Missing required fields' });
        }
        try{
       const result =  await contract.submitTransaction('hasAccess',tokenmedical,tokenorg);
        if (result) {
          console.log("Transaction result:", result.toString());
          const parsedResult = JSON.parse(result.toString());

          res.status(200).json({
            message: "Organization has been added successfully",
            transactionResult: parsedResult
        });
        } else {
          console.error("Result is undefined");
          res.status(500).send("Unexpected result from transaction");
        }
        } catch (error) {
        // Xử lý lỗi kết nối hoặc lỗi bất ngờ
        console.error('Error in createUser handler:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
      await gateway.disconnect();
    
    
      } catch (error) {
        // Xử lý lỗi kết nối hoặc lỗi bất ngờ
        console.error('Error in createUser handler:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
}
exports.approveAccess = async (req, res) => {
    try{
        const { contract, gateway } = await connectToNetwork();
        const {tokenmedical,tokenorg} =  req.body;
        console.log(req.body);
        if(!tokenmedical){
          return res.status(400).json({ error: 'Missing required fields' });
        }timerequest
        try{
       const result =  await contract.submitTransaction('approveAccess',tokenmedical,tokenorg);
        if (result) {
          console.log("Transaction result:", result.toString());
          res.status(200).send("Organization has been added");
        } else {
          console.error("Result is undefined");
          res.status(500).send("Unexpected result from transaction");
        }
        } catch (error) {
        // Xử lý lỗi kết nối hoặc lỗi bất ngờ
        console.error('Error in createUser handler:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
      await gateway.disconnect();
    
    
      } catch (error) {
        // Xử lý lỗi kết nối hoặc lỗi bất ngờ
        console.error('Error in createUser handler:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
}
exports.addrequestreacord = async (req,res)=>{
  try{
    const { value,cccd, tokeorg,content ,branch} =  req.body;

    const { contract, gateway } = await connectToNetworkorgvalue(value);
    console.log(req.body);
    const currentTime = new Date();

    if(!branch || !cccd || !content){
      return res.status(400).json({ error: 'Missing required fields' });
    }
    try{
   const result =  await contract.submitTransaction('addRecordStatusBranch',tokeorg, cccd, branch,content,currentTime);
    if (result) {
      console.log("Transaction result:", result.toString());
      res.status(200).send("Organization has been added");
    } else {
      console.error("Result is undefined");
      res.status(500).send("Unexpected result from transaction");
    }
    } catch (error) {
    // Xử lý lỗi kết nối hoặc lỗi bất ngờ
    console.error('Error in createUser handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
  await gateway.disconnect();


  } catch (error) {
    // Xử lý lỗi kết nối hoặc lỗi bất ngờ
    console.error('Error in createUser handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

exports.requestbookaccess = async (req, res) => {
  try {
    const { value, cccd, tokeorg, content, branch } = req.body;
    console.log(req.body);
    const { contract, gateway } = await connectToNetworkmedicalvalue(value);
    const currentTime = new Date();

    if (!branch || !cccd || !content) {
      return res.status(400).json({ error: 'Missing required fields 400' });
    }

    // Gửi giao dịch requestAccess
    try {
      const result = await contract.submitTransaction('requestAccess', cccd, branch, content, currentTime);
      // await gateway.disconnect();

      if (result) {
        console.log("Transaction result:", result.toString());
        // Sau khi thực hiện requestAccess thành công, gọi hàm addrequestreacord
        return await exports.addrequestreacord(req, res);  // Gọi hàm addrequestreacord

      } else {
        console.error("Result is undefined");
        return res.status(500).send("Unexpected result from transaction");
      }

    } catch (error) {
      console.error('Error in requestAccess handler:', error);
      return res.status(500).json({ error: 'An unexpected error occurred in requestAccess' });
    }
  } catch (error) {
    console.error('Error in requestbookaccess handler:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

exports.getDataRecord = async (req, res) => {
    const { cccd } = req.body;
    console.log(req.body);

    if (!cccd) {
        return res.status(400).send('Invalid input');
    }

    try {
        const { contract, gateway } = await connectToNetwork();
        
        // Sử dụng evaluateTransaction thay vì submitTransaction cho các thao tác đọc
        const result = await contract.evaluateTransaction('getDataRecord', cccd);
        
        if (result) {
            const medical = JSON.parse(result.toString());

            console.log('Transaction result:', medical);
            res.status(200).send(medical); // Trả lại kết quả từ chaincode
        } else {
            console.error('Result is undefined');
            res.status(500).send('Unexpected result from transaction');
        }
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error.message}`);
        res.status(500).send(`Failed to get data record: ${error.message}`);
    }             

}
exports.approveAccessRequest = async (req, res) => {
  const { cccd, tokeorg, approve, viewType, value } = req.body;
  console.log(req.body);
  const currentTime = new Date();

  // Kiểm tra các tham số
  if (!cccd || !tokeorg || (approve !== true && approve !== false) || !viewType) {
      return res.status(400).send('Thiếu thông tin yêu cầu hoặc thông tin không hợp lệ.');
  }

  try {
      // Tạo wallet và gateway
      const { contract, gateway } = await connectToNetworkmedicalvalue(value);

      // Gọi hàm approveAccessRequest trong chaincode
      const result = await contract.submitTransaction('approveAccessRequest', cccd, tokeorg, approve, viewType,currentTime);
      console.log(result);

      // Đóng gateway
      await gateway.disconnect();

      return res.status(200).send(result.toString());
  } catch (error) {
      console.error(`Lỗi khi phê duyệt yêu cầu: ${error}`);
      return res.status(500).send(`Lỗi khi phê duyệt yêu cầu: ${error.message}`);
  }
};
exports.postDataMedicalExaminationHistory = async (req, res) => {
  try {
      const { cccd, newData, timepost ,tokeorg} = req.body; // Get data from request body

      // Check if all required data is provided
      if (!cccd || !newData || !timepost) {
          return res.status(400).json({ error: 'CCCD, newData, and timepost are required' });
      }

      const { contract, gateway } = await connectToNetwork(); // Connect to the network

      // Call the chaincode function to update the medical record
      const result = await contract.submitTransaction('PostDataMedicalExaminationHistory', cccd,tokeorg, JSON.stringify(newData), timepost);
      
      if (result) {
          console.log("Transaction result:", result.toString());
          res.status(200).json({
              message: `Record with CCCD ${cccd} has been successfully updated`,
              transactionResult: result.toString()
          });
      } else {
          console.error("Result is undefined");
          res.status(500).send("Unexpected result from transaction");
      }

      await gateway.disconnect(); // Disconnect the gateway

  } catch (error) {
      // Handle connection errors or unexpected errors
      console.error('Error in postDataMedicalExaminationHistory handler:', error);
      res.status(500).json({ error: 'An unexpected error occurred' });
  }
};


exports.createrecord = async (req, res) => { 
    const {name, birthDate, gender, address, phoneNumber, identityCard,cccd,passwordmedical} = req.body;
    console.log('Request body:', req.body);

    if (!name || !birthDate || !gender || !address || !phoneNumber|| !identityCard||!cccd)  {
        return res.status(400).send('Invalid input');
    }

    try {
        const { contract, gateway } = await connectToNetwork();
        const currentTime = new Date();
        const saltRounds = 10;
        const passwordmedicalnew = await bcrypt.hash(passwordmedical, saltRounds);

    
        const result = await contract.submitTransaction('createRecord',name, birthDate, gender, address, phoneNumber, identityCard,cccd,currentTime,passwordmedicalnew);

        if (result) {
            console.log('Transaction result:', result.toString());
            res.status(200).send('Organization has been added');
        } else {
            console.error('Result is undefined');
            res.status(500).send('Unexpected result from transaction');
        }

        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error.message}`);
        res.status(500).send(`Failed to add organization: ${error.message}`);
    }
};
