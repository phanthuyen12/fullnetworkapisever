const express = require('express');
const bodyParser = require('body-parser');
const studentRoutes = require('./routes/hospitalrouter2');

const app = express();
const PORT = 3002;


app.use(express.json());
app.use('/api', studentRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
