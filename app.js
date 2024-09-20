const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const pdfParse = require('pdf-parse');
const cors = require('cors'); // Importing CORS

const app = express();
const port = 5000;

app.use(cors());

// Configure multer for file upload
const upload2 = multer({ dest: 'uploads2/' });


app.get('/testing', (req, res) => {
    res.send("true");
})
app.get('/', (req, res) => {
    res.send('<p> api working </p>');
})

app.post('/convert-to-text', upload2.single('file'), (req, res) => {
    const file = req.file;
    const filePath = path.join(__dirname, file.path);
  
    // Read the PDF file
    fs.readFile(filePath, (err, data) => {
      if (err) return res.status(500).send('Error reading file');
      
      // Parse PDF to extract text
      pdfParse(data).then(result => {
        const txtFilePath = path.join(__dirname, 'uploads2', file.filename + '.txt');
        
        // Write the extracted text to a .txt file
        fs.writeFile(txtFilePath, result.text, (err) => {
          if (err) return res.status(500).send('Error saving txt file');
          
          res.sendFile(txtFilePath); // send the .txt file back to the client
        });
      }).catch(err => res.status(500).send('Error converting PDF'));
    });
  });


  const upload = multer({ dest: 'uploads/' });

// Route to upload and convert TXT to PDF
app.post('/convert-to-pdf', upload.single('file'), (req, res) => {
  const file = req.file;
  const filePath = path.join(__dirname, file.path);

  // Read the TXT file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading file');

    // Create a new PDF document
    const doc = new PDFDocument();
    const pdfFilePath = path.join(__dirname, 'uploads', file.filename + '.pdf');
    const pdfStream = fs.createWriteStream(pdfFilePath);

    // Pipe the PDF document to the stream
    doc.pipe(pdfStream);

    // Add the text content to the PDF
    doc.text(data);

    // Finalize the PDF and end the stream
    doc.end();

    // When the PDF stream is finished, send the PDF file to the client
    pdfStream.on('finish', () => {
      res.sendFile(pdfFilePath);
    });

    // Handle errors in the PDF generation process
    pdfStream.on('error', (error) => {
      return res.status(500).send('Error creating PDF');
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
