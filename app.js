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

// Route to upload images and convert them to PDF
app.post('/convert-images-to-pdf', upload.array('images', 10), (req, res) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).send('No images uploaded.');
  }

  // Create a new PDF document
  const doc = new PDFDocument();
  let chunks = [];
  let pdfStream = doc.on('data', (chunk) => chunks.push(chunk))
                     .on('end', () => {
                       const pdfBuffer = Buffer.concat(chunks);
                       res.setHeader('Content-Type', 'application/pdf');
                       res.send(pdfBuffer);
                     });

  // Add each image to a new page in the PDF
  files.forEach((file, index) => {
    const imageBuffer = file.buffer;
    const image = doc.openImage(imageBuffer);

    if (index > 0) doc.addPage(); // Add a new page for each image after the first
    doc.image(image, {
      fit: [500, 700], // Fit the image to the page size
      align: 'center',
      valign: 'center'
    });
  });

  // Finalize the PDF and end the stream
  doc.end();
});



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
