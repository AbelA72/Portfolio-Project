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



// Listen for the contact form submission and send the prompt to the server
document.getElementById('contact-form').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent the default page reload on submit

  const userPrompt = document.getElementById('messages').value;
  const responseDiv = document.getElementById('response');

  fetch('/submit-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: userPrompt })
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
      // Display the chatbot's response in the response div
      responseDiv.textContent = data.botResponse;
    })
    .catch(function(error) {
      // Log the error and show a message to the user
      console.error('Error submitting prompt:', error.message);
      responseDiv.textContent = 'An error occurred: ' + error.message;
    });
});