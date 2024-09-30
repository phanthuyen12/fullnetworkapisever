'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class MedicalBookContract extends Contract {

    async initLedger(ctx) {
        console.info('Khởi tạo sổ cái với dữ liệu mẫu');

        const sampleRecords = [
            {
                cccd: '3924982758347',
                tokenmedical: 'P0sdfsljdfjk01',
                name: 'Nguyen Van A',
                birthDate: '1980-01-01',
                gender: 'Nam',
                email: 'phangiathuyendev@gmail.com',
                address: '123 Main St, Hanoi',
                phoneNumber: '0901234567',
                identityCard: '123456789',
                passwordmedical: '',
                approvedOrgs: {}, // Chưa có tổ chức nào được phê duyệt quyền truy cập
                medicalRecords: [], // Chưa có hồ sơ khám bệnh
                accessRequests: {}, // Các yêu cầu truy cập từ các tổ chức
                có : [
                    { disease: 'Tăng huyết áp', treatment: 'Thuốc A' }
                ],
                currentStatus: {
                    symptoms: 'Đau đầu',
                    diagnosis: 'Tăng huyết áp',
                    treatmentPlan: 'Thuốc B'
                },
                authorizedEntities: [], // Các thực thể được phép truy cập bản ghi
            }
        ];

        for (const record of sampleRecords) {
            await ctx.stub.putState(record.cccd, Buffer.from(JSON.stringify(record)));
            console.info(`Đã thêm bản ghi với ID: ${record.cccd}`);
        }
    }
    async getAllMedicalRecords(ctx) {
        console.info('Lấy tất cả các sổ khám bệnh từ sổ cái');

        const iterator = await ctx.stub.getStateByRange('', ''); // Lấy toàn bộ dữ liệu trong range từ '' đến ''
        const allRecords = [];

        let result = await iterator.next();
        while (!result.done) {
            const recordKey = result.value.key;
            const recordValue = result.value.value.toString('utf8');

            // Parse dữ liệu JSON của bản ghi
            let record;
            try {
                record = JSON.parse(recordValue);
            } catch (err) {
                console.error(`Lỗi parse dữ liệu cho key: ${recordKey}`, err);
                record = recordValue;
            }

            allRecords.push({ Key: recordKey, Record: record });
            result = await iterator.next();
        }

        await iterator.close(); // Đảm bảo đóng iterator sau khi sử dụng

        console.info('Đã lấy xong tất cả các sổ khám bệnh.');
        return JSON.stringify(allRecords); // Trả về danh sách bản ghi dưới dạng chuỗi JSON
    }

    async createRecord(ctx, name, email, birthDate, gender, address, phoneNumber, identityCard, cccd, currentTime, passwordmedical) {
        // Tạo token y tế (một mã định danh duy nhất) cho bệnh án
        const tokenmedical = this.generateToken(name);
        // Tạo một đối tượng bệnh án với các thông tin cơ bản
        const record = {
            tokenmedical,            // Mã token của bệnh án
            name,                    // Tên bệnh nhân
            email,
            birthDate,               // Ngày sinh
            gender,                  // Giới tính
            address,                 // Địa chỉ
            phoneNumber,             // Số điện thoại
            identityCard,            // Số chứng minh nhân dân (hoặc ảnh mã hóa base64)
            cccd,                    // Số CCCD (Căn cước công dân)
            passwordmedical,         // Mật khẩu để bảo vệ hồ sơ y tế
            medicalHistory: [],      // Lịch sử y tế ban đầu là mảng rỗng
            currentStatus: {},       // Trạng thái hiện tại, khởi tạo rỗng
            authorizedEntities: [],   // Các thực thể được ủy quyền ban đầu, khởi tạo rỗng
            accessRequests: []        // Danh sách yêu cầu quyền truy cập ban đầu, khởi tạo rỗng
        };
        // Thêm sự kiện "TẠO_MEDICAL" vào lịch sử y tế
        record.medicalHistory.push({
            action: 'TẠO_MEDICAL',      // Hành động tạo hồ sơ
            timestamp: currentTime,     // Thời gian hiện tại khi hồ sơ được tạo
            data: { name, birthDate, gender, address, phoneNumber, identityCard, cccd, passwordmedical }  // Dữ liệu bệnh nhân
        });
        // Hiển thị thông tin đã tạo bệnh án với mã token y tế
        console.info(`Đã tạo bản ghi với ID: ${cccd}`);
        // Lưu bệnh án vào blockchain sử dụng tokenmedical làm khóa
        await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(record)));

        // Trả về mã token y tế sau khi tạo thành công
        return cccd;
    }
    async loginMedical(ctx, cccd, passwordmedical) {
        // Lấy tất cả hồ sơ y tế
        const allRecords = await this.getAllMedicalRecords(ctx);
        const parsedRecords = JSON.parse(allRecords);

        // Tìm hồ sơ dựa trên email
        const existingRecord = parsedRecords.find(record =>
            record.Record.cccd === cccd
        );

        if (!existingRecord) {
            throw new Error('cccd không tồn tại trong hệ thống.');
        }

        // // Kiểm tra mật khẩu
        // // const passwordMatch = await bcrypt.compare(passwordmedical, existingRecord.Record.passwordmedical);
        // // if (!passwordMatch) {
        // //     throw new Error('Mật khẩu không chính xác.');
        // // }

        // // Tạo JWT token
        // const payload = {
        //     tokenmedical: existingRecord.Record.tokenmedical,
        //     name: existingRecord.Record.name,
        //     email: existingRecord.Record.email,
        //     cccd: existingRecord.Record.cccd
        // };

        // const secretKey = 'ee2de3938caccb365423140f03873e7b3f2032696632c594131835fe88db55f76f5580f678835c22b578de32cc7ec35d9f0a42a65dec98a839625b5611296e70'; // Thay thế với khóa bí mật của bạn
        // const token = jwt.sign(payload, secretKey, { expiresIn: '1h' }); // Token hết hạn sau 1 giờ

        console.info(`Người dùng với email ${cccd} đã đăng nhập thành công.`);
        return {
            existingRecord
        };  // Trả về JWT token sau khi đăng nhập thành công
    }
    async registerMedical(ctx, name, email, cccd, passwordmedical, currentTime) {
        // Kiểm tra xem có email hoặc cccd đã tồn tại trong sổ cái hay không
        const iterator = await ctx.stub.getStateByRange('', ''); // Lấy toàn bộ dữ liệu
        let result = await iterator.next();
        while (!result.done) {
            const record = JSON.parse(result.value.value.toString('utf8'));
            if (record.email === email) {
                throw new Error(`Email ${email} đã tồn tại trong hệ thống.`);
            }
            if (record.cccd === cccd) {
                throw new Error(`CCCD ${cccd} đã tồn tại trong hệ thống.`);
            }

            result = await iterator.next();
        }
        await iterator.close(); // Đảm bảo đóng iterator sau khi sử dụng

        // Tạo token y tế dựa trên tên bệnh nhân
        const tokenmedical = this.generateToken(name);

        // Tạo hồ sơ y tế mới với các thông tin cơ bản
        const record = {
            tokenmedical: tokenmedical,      // Token bệnh án
            name: name,              // Tên bệnh nhân
            email: email,             // Email bệnh nhângetDataRecord
            passwordmedical: passwordmedical,   // Mật khẩu bệnh án
            cccd: cccd,              // Căn cước công dân
            medicalHistory: [],  // Lịch sử y tế ban đầu là mảng rỗng
            currentStatus: {},   // Trạng thái hiện tại khởi tạo rỗng
            authorizedEntities: [], // Thực thể được ủy quyền ban đầu là mảng rỗng
            accessRequests: []     // Danh sách yêu cầu quyền truy cập khởi tạo rỗng
        };

        // Thêm sự kiện "TẠO_MEDICAL" vào lịch sử y tế
        record.medicalHistory.push({
            action: 'TẠO_MEDICAL',      // Hành động tạo hồ sơ
            timestamp: currentTime,     // Thời gian hiện tại khi hồ sơ được tạo
            data: { name, email, passwordmedical, cccd }  // Dữ liệu bệnh nhân
        });

        // Lưu bản ghi vào sổ cái blockchain
        await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(record)));

        console.info(`Đã tạo bản ghi với ID: ${cccd}`);
        return cccd;  // Trả về token của bệnh án vừa được tạo
    }


    async updateRecord(ctx, cccd,tokenmedical, birthDate, gender, address, phoneNumber, identityCard, currentTime) {
        // Lấy bản ghi từ sổ cái dựa trên token y tế
        const recordAsBytes = await ctx.stub.getState(cccd);

        if (!recordAsBytes || recordAsBytes.length === 0) {
            throw new Error(`Bản ghi với ID ${cccd} không tồn tại`);
        }

        const record = JSON.parse(recordAsBytes.toString());

        // Cập nhật các giá trị còn lại của hồ sơ bệnh án
        record.birthDate = birthDate;
        record.gender = gender;
        record.address = address;
        record.phoneNumber = phoneNumber;
        record.identityCard = identityCard;
        record.medicalHistory.push({
            action: 'TẠO_MEDICAL',      // Hành động tạo hồ sơ
            timestamp: currentTime,     // Thời gian hiện tại khi hồ sơ được tạo
            data: { tokenmedical, birthDate, gender, address, phoneNumber, identityCard }  // Dữ liệu bệnh nhân
        });

        // Cập nhật bản ghi trên sổ cái
        await ctx.stub.putState(tokenmedical, Buffer.from(JSON.stringify(record)));

        // Lấy dữ liệu bản ghi đã cập nhật
        const updatedRecordAsBytes = await ctx.stub.getState(tokenmedical);

        if (!updatedRecordAsBytes || updatedRecordAsBytes.length === 0) {
            throw new Error(`Không thể lấy bản ghi đã cập nhật với ID ${tokenmedical}`);
        }

        const updatedRecord = JSON.parse(updatedRecordAsBytes.toString());

        // Tạo JWT token
        const secretKey = 'ee2de3938caccb365423140f03873e7b3f2032696632c594131835fe88db55f76f5580f678835c22b578de32cc7ec35d9f0a42a65dec98a839625b5611296e70'; // Thay thế với khóa bí mật của bạn
        const payload = {
            tokenmedical: updatedRecord.tokenmedical,
            name: updatedRecord.name,
            birthDate: updatedRecord.birthDate,
            gender: updatedRecord.gender,
            email: updatedRecord.email,
            address: updatedRecord.address,
            phoneNumber: updatedRecord.phoneNumber,
            identityCard: updatedRecord.identityCard,
            cccd: updatedRecord.cccd,
            medicalHistory: updatedRecord.medicalHistory,
            currentStatus: updatedRecord.currentStatus,
            authorizedEntities: updatedRecord.authorizedEntities,
            accessRequests: updatedRecord.accessRequests
        };

        const token = jwt.sign(payload, secretKey, { expiresIn: '1h' }); // Token hết hạn sau 1 giờ

        console.info(`Bản ghi với ID ${tokenmedical} đã được cập nhật và token JWT đã được tạo.`);
        return {
            token
        };  // Trả về JWT token chứa toàn bộ thông tin bản ghi
    }
    async requestAccess(ctx, cccd, tokeorg, content, timerequest) {
        // Lấy bản ghi từ sổ cái
        const recordAsBytes = await ctx.stub.getState(cccd);
        const clientMSPID = ctx.clientIdentity.getMSPID();


        if (!recordAsBytes || recordAsBytes.length === 0) {
            throw new Error(`Bản ghi với ID ${cccd} không tồn tại`);
        }

        const record = JSON.parse(recordAsBytes.toString());

        // Thêm yêu cầu quyền truy cập vào danh sách yêu cầu với trạng thái chưa được phê duyệt
        record.accessRequests.push({
            organization: tokeorg,
            nameorganization: clientMSPID,
            content: content,
            approved: false,
            timestamp: timerequest
        });

        // Thêm vào lịch sử y tế
        record.medicalHistory.push({
            action: 'Receive requests from the organization',
            timestamp: timerequest,
            content: content,
            data: { tokeorg, clientMSPID }
        });

        // Cập nhật bản ghi trên sổ cái
        await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(record)));
        console.info(`Tổ chức ${tokeorg} đã gửi yêu cầu quyền truy cập cho bản ghi với ID: ${cccd}`);
        return `Yêu cầu quyền truy cập từ tổ chức ${tokeorg} đã được thêm vào bản ghi với ID: ${cccd}`;

    }




    async approveAccess(ctx, cccd, tokenorg) {
        // Lấy bản ghi từ sổ cái
        const recordAsBytes = await ctx.stub.getState(cccd);
        const clientMSPID = ctx.clientIdentity.getMSPID();

        if (!recordAsBytes || recordAsBytes.length === 0) {
            throw new Error(`Bản ghi với ID ${cccd} không tồn tại`);
        }

        const record = JSON.parse(recordAsBytes.toString());

        // Tìm yêu cầu quyền truy cập tương ứng với tokenorg
        let requestFound = false;
        for (let request of record.accessRequests) {
            if (request.organization === tokenorg && !request.approved) {
                // Cập nhật trạng thái phê duyệt
                request.approved = true;
                requestFound = true;

                // Thêm vào lịch sử y tế
                record.medicalHistory.push({
                    action: 'Approved access request',
                    timestamp: new Date().toISOString(),
                    data: { tokenorg, clientMSPID }
                });

                break;
            }
        }

        if (!requestFound) {
            throw new Error(`Không tìm thấy yêu cầu quyền truy cập chưa được phê duyệt từ tổ chức ${tokenorg} cho bản ghi với ID ${cccd}`);
        }

        // Cập nhật bản ghi trên sổ cái
        await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(record)));
        console.info(`Tổ chức ${clientMSPID} đã phê duyệt quyền truy cập cho tổ chức ${tokenorg} đối với bản ghi với ID: ${cccd}`);
    }
    async hasAccess(ctx, tokenmedical, tokenorg) {
        // Lấy bản ghi từ sổ cái
        const recordAsBytes = await ctx.stub.getState(tokenmedical);

        if (!recordAsBytes || recordAsBytes.length === 0) {
            throw new Error(`Bản ghi với ID ${tokenmedical} không tồn tại`);
        }

        const record = JSON.parse(recordAsBytes.toString());

        // Tìm yêu cầu quyền truy cập từ tổ chức cụ thể và kiểm tra trạng thái phê duyệt
        const accessRequest = record.accessRequests.find(request =>
            request.organization === tokenorg && request.approved === true
        );

        // Kiểm tra xem tổ chức có quyền truy cập hay không
        if (accessRequest) {
            console.info(`Tổ chức ${tokenorg} có quyền truy cập vào bản ghi với ID ${tokenmedical}`);
            return {
                tokenmedical: record.tokenmedical,
                name: record.name,
                birthDate: record.birthDate,
                gender: record.gender,
                address: record.address,
                phoneNumber: record.phoneNumber,
                identityCard: record.identityCard,

                cccd: record.cccd
            };
        } else {
            console.info(`Tổ chức ${tokenorg} không có quyền truy cập vào bản ghi với ID ${tokenmedical}`);
            return false;
        }
    }

    async getDataRecord(ctx, cccd) {
        // Lấy tokenmedical từ cccd
        const cccdcalAsBytes = await ctx.stub.getState(cccd);

        if (!cccdcalAsBytes || cccdcalAsBytes.length === 0) {
            throw new Error(`Không tìm thấy bản ghi với CCCD ${cccd}`);
        }


        // Lấy bản ghi thực tế từ tokenmedical


        const record = JSON.parse(cccdcalAsBytes.toString());
        return record;
    }


    async approveAccessRequest(ctx, cccd, tokeorg, approve, viewType) {
        // Lấy bản ghi từ sổ cái
        const recordAsBytes = await ctx.stub.getState(cccd);
        const clientMSPID = ctx.clientIdentity.getMSPID();
    
        if (!recordAsBytes || recordAsBytes.length === 0) {
            throw new Error(`Bản ghi với ID ${cccd} không tồn tại`);
        }
    
        const record = JSON.parse(recordAsBytes.toString());
    
        // Tìm yêu cầu truy cập từ tổ chức
        const requestIndex = record.accessRequests.findIndex(req => req.organization === tokeorg);
    
        if (requestIndex === -1) {
            throw new Error(`Không tìm thấy yêu cầu truy cập từ tổ chức ${tokeorg} ------------- ${record.accessRequests}`);
        }
    
        // Cập nhật trạng thái phê duyệt
        if (approve) {
            record.accessRequests[requestIndex].approved = true;
    
            // Nếu được phê duyệt, thêm vào danh sách tổ chức được phê duyệt
            if (!record.approvedOrgs[tokeorg]) {
                record.approvedOrgs[tokeorg] = {
                    viewAll: viewType === 'all', // xem tất cả thông tin
                    viewLimited: viewType === 'limited' // chỉ xem thông tin cụ thể
                };
            }
    
            // Cập nhật lịch sử y tế
            record.medicalHistory.push({
                action: `Approved access request from ${tokeorg}`,
                timestamp: new Date().toISOString(),
                content: `Access granted to ${tokeorg} with view type: ${viewType}`,
                data: { tokeorg, clientMSPID }
            });
            
            console.info(`Tổ chức ${tokeorg} đã được phê duyệt quyền truy cập cho bản ghi với ID: ${cccd}`);
        } else {
            record.accessRequests[requestIndex].approved = false;
            console.info(`Tổ chức ${tokeorg} đã bị từ chối quyền truy cập cho bản ghi với ID: ${cccd}`);
        }
    
        // Cập nhật bản ghi trên sổ cái
        await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(record)));
        return `Yêu cầu quyền truy cập từ tổ chức ${tokeorg} đã được ${approve ? 'phê duyệt' : 'từ chối'}.`;
    }
    async getMedicalRecord(ctx, cccd, tokeorg) {
        // Lấy bản ghi từ sổ cái
        const recordAsBytes = await ctx.stub.getState(cccd);
    
        if (!recordAsBytes || recordAsBytes.length === 0) {
            throw new Error(`Bản ghi với ID ${cccd} không tồn tại`);
        }
    
        const record = JSON.parse(recordAsBytes.toString());
        const clientMSPID = ctx.clientIdentity.getMSPID();
    
        // Kiểm tra xem tổ chức có được phê duyệt quyền truy cập không
        if (!record.approvedOrgs[tokeorg]) {
            throw new Error(`Tổ chức ${tokeorg} chưa được phê duyệt quyền truy cập`);
        }
    
        // Xác định loại quyền truy cập
        const accessType = record.approvedOrgs[tokeorg];
    
        let result;
    
        // Nếu tổ chức được phê duyệt quyền xem tất cả thông tin
        if (accessType.viewAll) {
            result = {
                cccd: record.cccd,
                tokenmedical: record.tokenmedical,
                name: record.name,
                birthDate: record.birthDate,
                gender: record.gender,
                email: record.email,
                address: record.address,
                phoneNumber: record.phoneNumber,
                identityCard: record.identityCard,
                medicalRecords: record.medicalRecords,
                currentStatus: record.currentStatus,
                medicalHistory: record.medicalHistory,
                accessRequests: record.accessRequests
            };
        } 
        // Nếu tổ chức chỉ được phê duyệt quyền xem thông tin hạn chế
        else if (accessType.viewLimited) {
            result = {
                cccd: record.cccd,
                tokenmedical: record.tokenmedical,
                name: record.name,
                birthDate: record.birthDate,
                gender: record.gender,
                email: record.email
            };
        } else {
            throw new Error(`Tổ chức ${tokeorg} không có quyền truy cập vào thông tin này`);
        }
    
        return result;
    }
    

    generateToken(data) {
        const hash = crypto.createHash('sha256');
        hash.update(data);
        return hash.digest('hex');
    }
}

module.exports = MedicalBookContract;
