const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const meidacaController = require('../controllers/medicaConroller');
const hospitalbrachController = require('../controllers/hospitalbrach');

const interfaceController = require('../controllers/interfaceController');
const runOrgController = require('../../network/controller/runOrg');
const userController = require('../controllers/userController');

router.post('/creater-org', orgController.createOrg);
router.post('/users/create', userController.createUser);

router.post('/users/login', userController.loginUser);



router.post('/getinfo-org', orgController.getorginformation);
router.post('/getall-org', orgController.getAllOrganizations);

router.post('/create-user', orgController.Createuser);
router.post('/login-org', orgController.loginorganization);
router.post('/update-user', orgController.updateUser);
router.post('/getinfo-user', orgController.getinfoUser);
router.post('/creater-org-folders', runOrgController.checkroleadmin);
router.post('/checkrole', orgController.checkroleadmin);
router.get('/show-all-org', orgController.getActiveOrganizations);
router.post('/create-brach', hospitalbrachController.create_brach);
router.post('/getfull-brach', hospitalbrachController.getFull_brach);
router.post('/getfull-personnel', hospitalbrachController.getFull_personnel);
router.post('/getpersonnel-bytoken', hospitalbrachController.getpersonnelBytoken);




router.post('/request-record',meidacaController.requestbookaccess);
router.post('/approveaccess-record',meidacaController.approveAccess);
router.post('/hasaccess-record',meidacaController.hasAccess);

router.post('/create-record', meidacaController.createrecord);
router.post('/getinfo-record', meidacaController.getDataRecord);
router.post('/getfull-record', meidacaController.getfullRecords);
router.post('/register-record', meidacaController.registerMedical);
router.post('/login-record', meidacaController.loginmedical);
router.post('/update-record', meidacaController.updateRecords);
router.post('/approve-access-request', meidacaController.approveAccessRequest);



// Route để đăng nhập
router.post('/login', userController.loginUser);
// router.get('/interface-options',interfaceController.index);
// router.get('/list-options',interfaceController.index);



router.get('/index', (req, res) => {
    res.json({ message: 'Xin chào các bạn!' });
});

module.exports = router;
