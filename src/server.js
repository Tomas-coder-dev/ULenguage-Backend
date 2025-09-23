const express = require('express');
const ocrRoutes = require('./services/ocr/ocr.routes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use('/api/ocr', ocrRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});