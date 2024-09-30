const express = require('express');
const bodyParser = require('body-parser');
const orgRoutes = require('./routes/orgrouter');
const hospital = require('./routes/hospital');
const cors = require('cors');

const app = express();
const PORT = 3002;
app.use(bodyParser.json({ limit: '500mb' }));  // Giới hạn tối đa 50MB cho JSON payload
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));  // Giới hạn 50MB cho form data

// Sử dụng body-parser để xử lý các yêu cầu có JSON payload
app.use(bodyParser.json());
app.use(cors());

// Sử dụng body-parser để xử lý các yêu cầu có dữ liệu URL-encoded
app.use(bodyParser.urlencoded({ extended: true }));

// Định nghĩa các route
app.use('/', orgRoutes);
app.use('/hospital', hospital);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
