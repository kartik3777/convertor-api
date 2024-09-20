const express = require('express');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const pdfParse = require('pdf-parse');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());

app.get('/', (req, res) => {
  res.send('<p> working </p>');
})

// Use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route to upload and convert PDF to TXT
app.post('/convert-to-txt', upload.single('file'), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  // Use pdf-parse to extract text from the PDF
  pdfParse(file.buffer)
    .then(data => {
      res.setHeader('Content-Type', 'text/plain');
      res.send(data.text); // Send extracted text as response
    })
    .catch(err => {
      res.status(500).send('Error processing PDF: ' + err.message);
    });
});

// Route to upload and convert TXT to PDF
app.post('/convert-to-pdf', upload.single('file'), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  // Convert the uploaded file buffer to a string
  const textContent = file.buffer.toString('utf8');

  // Create a new PDF document
  const doc = new PDFDocument();
  let chunks = [];
  let pdfStream = doc.on('data', (chunk) => chunks.push(chunk))
                     .on('end', () => {
                       const pdfBuffer = Buffer.concat(chunks);
                       res.setHeader('Content-Type', 'application/pdf');
                       res.send(pdfBuffer);
                     });

  // Add the text content to the PDF
  doc.text(textContent);

  // Finalize the PDF and end the stream
  doc.end();
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
