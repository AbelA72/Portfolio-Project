function greetUser(name) {
    document.getElementById("greeting").textContent = "Hello " + name + "!";
}

function checkAge(age) {
    if (age >= 5) {
        document.getElementById("age-check").textContent = "Welcome to the quiz!";
    } else {
        document.getElementById("age-check").textContent = "You're too young to take this quiz.";
    }
}

function startQuiz() {
    const name = document.getElementById("username").value;
    const age = Number(document.getElementById("age").value);

    greetUser(name);
    checkAge(age);

    const skillsText = skills.map(skill => "Skill: " + skill).join(" | ");
    document.getElementById("skills-list").textContent = skillsText;
}


if (document.getElementById("startQuiz")) {
    document.getElementById("startQuiz").addEventListener("click", startQuiz);
}

/* 
Listens for a click on the About Me heading and toggles the visibility of the
bio paragraph, allowing the user to collapse or expand the section.
*/

if (document.getElementById("about-heading")) {
    document.getElementById("about-heading").addEventListener("click", function () {
        const bio = document.querySelector("#about .highlight");
        if (bio.style.display === "none") {
            bio.style.display = "block";
        } else {
            bio.style.display = "none";
        }
    });
}



function logEvent(type, element) {
  fetch('/log-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType: type, elementName: element, timestamp: new Date() })
  }).catch(function(err) {
    console.error('Error logging event:', err.message);
  });
}

const submitBtn = document.getElementById('submit-btn');
const messageInput = document.getElementById('messages');

if (submitBtn) {
  submitBtn.addEventListener('click', function() {
    logEvent('click', 'submit-btn');
  });
}

if (messageInput) {
  messageInput.addEventListener('mouseover', function() {
    logEvent('hover', 'messages');
  });

  messageInput.addEventListener('focus', function() {
    logEvent('focus', 'messages');
  });
}

document.getElementById("upload-btn").addEventListener("click", async () => {
  const fileInput = document.getElementById("document-upload");
  const file = fileInput.files[0];

  if (!file) {
    alert("Choose a file first.");
    return;
  }

  const formData = new FormData();
  formData.append("document", file);

  const response = await fetch("/upload-document", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  console.log(data);

  loadDocuments();
});

async function loadDocuments() {
  const response = await fetch("/documents");
  const docs = await response.json();

  const documentsList = document.getElementById("documents-list");
  documentsList.innerHTML = "";

  docs.forEach(function(doc) {
    const li = document.createElement("li");
    li.textContent = doc.filename + " — " + doc.processingStatus;
    documentsList.appendChild(li);
  });
}

loadDocuments();

// Listen for the contact form submission and send the prompt to the server
document.getElementById('contact-form').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent the default page reload on submit

  const userPrompt = document.getElementById('messages').value;
  const retrievalMethod = document.getElementById('retrieval-method').value;
  const responseDiv = document.getElementById('response');
  const retrievedDocsDiv = document.getElementById('retrieved-docs');
  const confidenceDiv = document.getElementById('confidence-metrics');

  fetch('/submit-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: userPrompt, retrievalMethod: retrievalMethod })
  })
    .then(function(response) {
      if (!response.ok) {
        return response.json().then(function(data) {
          throw new Error(data.error || 'Server error: ' + response.status);
        });
      }
      return response.json();
    })
    .then(function(data) {
      // Display the chatbot's response
      responseDiv.textContent = data.botResponse;

      // Display retrieved evidence
      retrievedDocsDiv.innerHTML = '';
      if (data.retrievedDocuments && data.retrievedDocuments.length > 0) {
        const heading = document.createElement('h3');
        heading.textContent = 'Retrieved Evidence';
        retrievedDocsDiv.appendChild(heading);

        data.retrievedDocuments.forEach(function(doc, i) {
          const item = document.createElement('div');
          item.style.border = '1px solid #ccc';
          item.style.padding = '8px';
          item.style.marginBottom = '6px';
          item.innerHTML =
            '<strong>[' + (i + 1) + '] ' + (doc.docName || 'Unknown') + ' — Chunk ' + doc.chunkIndex + '</strong>' +
            '<br>Relevance Score: ' + (doc.relevanceScore ? doc.relevanceScore.toFixed(4) : 'N/A') +
            '<br><em>' + doc.chunkText + '</em>';
          retrievedDocsDiv.appendChild(item);
        });
      } else {
        retrievedDocsDiv.innerHTML = '<p>No documents retrieved.</p>';
      }

      // Display confidence metrics
      confidenceDiv.innerHTML = '';
      if (data.confidenceMetrics) {
        const m = data.confidenceMetrics;
        const heading = document.createElement('h3');
        heading.textContent = 'Confidence Metrics';
        confidenceDiv.appendChild(heading);

        const info = document.createElement('p');
        info.innerHTML =
          'Method: <strong>' + m.retrievalMethod + '</strong><br>' +
          'Overall Confidence: <strong>' + (m.overallConfidence * 100).toFixed(1) + '%</strong><br>' +
          'Retrieval Confidence: ' + (m.retrievalConfidence * 100).toFixed(1) + '%' +
          (m.responseConfidence !== null ? '<br>Response Confidence: ' + (m.responseConfidence * 100).toFixed(1) + '%' : '');
        confidenceDiv.appendChild(info);
      }
    })
    .catch(function(error) {
      // Log the error and show a message to the user
      console.error('Error submitting prompt:', error.message);
      responseDiv.textContent = 'An error occurred: ' + error.message;
    });
});