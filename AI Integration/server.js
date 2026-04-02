const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');
const {OpenAI} = require('openai');

// Load env var from .env file
require('dotenv').config(); 

// Load Api key from .env file
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
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


// POST route to handle form submission and call the OpenAI API
app.post('/submit-prompt', async (req, res) => {
  const { messages } = req.body; // Extract the user's prompt from the form field

  if (!messages || messages.trim() === '') {
    return res.status(400).json({ error: 'Prompt cannot be empty.' });
  }

  try {
    // Call OpenAI API with the user's prompt
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: messages }],
      max_tokens: 100,
    });

    // Extract and send back the chatbot's response
    const botResponse = completion.choices[0].message.content.trim();
    res.json({ botResponse });
  } catch (error) {
    console.error('Error calling OpenAI API:', error.message);
    res.status(500).json({ error: 'Failed to get a response from the API. Please try again.' });
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


// 7. Start the server
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



