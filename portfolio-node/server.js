const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');
const {OpenAI} = require('openai');
const mongoose = require('mongoose');
const multer = require('multer');

// Load env var from .env file — must be before any service imports that use env vars
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Interaction = require('./models/Interaction');
const EventLog = require('./models/EventLog');
const Document = require('./models/Document');
const documentProcessor = require('./services/documentProcessor');
const embeddingService = require('./services/embeddingService');
const retrievalService = require('./services/retrievalService');
const confidenceCalculator = require('./services/confidenceCalculator');

const upload = multer({ dest: 'uploads/' });

// Load Api key from .env file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Creates the Express app
const app = express();

// Serves static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// 3. Middleware to parse JSON data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route to serve the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Route to serve the contact page
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});


// // Route to handle form submission using the fetch() API
// app.post('/contact', (req, res) => {
//   const { name, email, message } = req.body;
//   console.log(`Contact form submission — Name: ${name}, Email: ${email}, Message: ${message}`);
//   res.json({ confirmation: `Thank you, ${name}! Your message has been received.` });
// });


// POST route to handle form submission with RAG
app.post('/submit-prompt', async (req, res) => {
  const { messages, input, retrievalMethod = 'semantic' } = req.body;
  const userInput = input || messages;

  if (!userInput || userInput.trim() === '') {
    return res.status(400).json({ error: 'Prompt cannot be empty.' });
  }

  try {
    // Retrieve relevant chunks from uploaded documents
    const retrievedChunks = await retrievalService.retrieve(userInput, {
      method: retrievalMethod,
      topK: 3
    });

    // Build RAG-augmented prompt
    let augmentedPrompt = userInput;
    if (retrievedChunks.length > 0) {
      const context = retrievedChunks
        .map((chunk, i) => `[${i + 1}] ${chunk.chunkText || chunk.text}`)
        .join('\n\n');
      augmentedPrompt = `Use the following context to help answer the question.\n\nContext:\n${context}\n\nQuestion: ${userInput}`;
    }

    // Call OpenAI API with augmented prompt
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: augmentedPrompt }],
      max_tokens: 500,
    });

    const botResponse = completion.choices[0].message.content.trim();

    // Calculate confidence metrics
    const confidenceMetrics = confidenceCalculator.calculate({
      retrievedDocs: retrievedChunks,
      retrievalMethod
    });

    // Format retrieved documents for storage and response
    const retrievedDocuments = retrievedChunks.map(chunk => ({
      docName: chunk.documentName,
      chunkIndex: chunk.chunkIndex,
      chunkText: chunk.chunkText || chunk.text,
      relevanceScore: chunk.relevanceScore || chunk.score
    }));

    // Save to MongoDB
    await Interaction.create({
      userInput,
      botResponse,
      retrievalMethod,
      retrievedDocuments,
      confidenceMetrics
    });

    res.json({ botResponse, retrievedDocuments, confidenceMetrics });
  } catch (error) {
    console.error('Error calling OpenAI API:', error.message);
    res.status(500).json({ error: 'Failed to get a response from the API. Please try again.' });
  }
});


// POST route to log user events
app.post('/log-event', async (req, res) => {
  const { eventType, elementName, timestamp } = req.body;
  try {
    await EventLog.create({ eventType, elementName, timestamp });
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving event log:', error.message);
    res.status(500).json({ error: 'Failed to save event log.' });
  }
});


// POST route to handle user input and send it to OpenAI
app.post('/chat', async (req, res) => {
  const { input } = req.body; // Extract user input
  if (!input) {
    return res.status(400).send('Invalid input');
}

  try {
      // Call OpenAI API to generate a response based on user input
      const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini", // Specify the OpenAI model
      messages: [{ role: 'user', content: input }], // Send user input
      max_tokens: 100, // Limit the length of the generated response
    });
    // Extract and trim the chatbot's response
    const botResponse = response.choices[0].message.content.trim();
    // Send the chatbot's response back to the client
    res.json({ botResponse });
  } catch (error) {
    console.error('Error interacting with OpenAI API:', error.message); // Log error
    res.status(500).send('Server Error'); // Send error response to the client
  }
});


// POST route to upload and process a document
app.post('/upload-document', upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const processed = await documentProcessor.processDocument(req.file);

    // Generate embeddings for each chunk
    const chunksWithEmbeddings = await embeddingService.generateEmbeddings(
      processed.chunks.map((chunk, i) => ({
        chunkIndex: i,
        text: chunk.text
      }))
    );

    const doc = await Document.create({
      filename: req.file.originalname,
      text: processed.fullText,
      chunks: chunksWithEmbeddings,
      processingStatus: 'completed',
    });

    // Rebuild TF-IDF index so the new document is immediately searchable
    await retrievalService.rebuildIndex();

    res.json({ status: 'completed', filename: doc.filename, chunkCount: doc.chunks.length });
  } catch (error) {
    console.error('Error uploading document:', error.message);
    res.status(500).json({ error: 'Failed to process document' });
  }
});


// GET route to list all uploaded documents
app.get('/documents', async (req, res) => {
  try {
    const docs = await Document.find()
      .select('_id filename processingStatus processedAt')
      .sort({ processedAt: -1 });
    res.json(docs);
  } catch (error) {
    console.error('Error fetching documents:', error.message);
    res.status(500).json({ error: 'Failed to fetch documents.' });
  }
});


// Start the server after connecting to MongoDB and initializing retrieval service
const PORT = 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    await retrievalService.initialize();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));


