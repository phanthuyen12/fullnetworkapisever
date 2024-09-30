const path = require('path');
const { exec } = require('child_process');
const { connectToNetworkorg } = require('../../sever-managent/controllers/network'); // Chỉnh đường dẫn tùy theo cấu trúc thư mục của bạn

exports.updateOrganizationStatus = async (req, res) => {
    const tokeorg = req.body.tokeorg;
  
    console.log("test");
    console.log(tokeorg); // Sửa lại biến value thành tokeorg
  
    let gateway;
    try {
        const { contract, gateway: gw } = await connectToNetworkorg();
        gateway = gw;
  
        const newStatus = true; 
        const currentTime = new Date();
  
        // Cập nhật trạng thái tổ chức
        const updateResult = await contract.submitTransaction("updateOrganizationStatus", tokeorg, newStatus, currentTime.toISOString());
        
        if (updateResult) {
            console.log("Transaction result:", updateResult.toString());
            // Trả về kết quả khi transaction hoàn tất
            res.json({ status: "true", output: updateResult.toString() });
        } else {
            console.error("Update result is undefined");
            return res.status(500).send("Unexpected result from update transaction");
        }
    } catch (error) {
        console.error(`Failed to submit transaction: ${error.message}`);
        if (!res.headersSent) { // Kiểm tra xem headers đã được gửi chưa
            return res.status(500).send(`Failed to update organization: ${error.message}`);
        }
    } finally {
        if (gateway) {
            try {
                await gateway.disconnect(); // Đảm bảo gọi disconnect để giải phóng tài nguyên
            } catch (disconnectError) {
                console.error(`Failed to disconnect gateway: ${disconnectError.message}`);
            }
        }
    }
};
