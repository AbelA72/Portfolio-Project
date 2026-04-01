// Event listener for the form submission
document.getElementById('contact-form').addEventListener('submit', async (event) => {
  event.preventDefault();  // Prevent form from submitting the traditional way

  // Gather form data
  const formData = {
    message: document.getElementById('message').value,
  };

  // Send the form data to the server using fetch()
  const response = await fetch('/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });

  // Get the server's response
  const data = await response.json();

  // Display the server's response in the browser
  document.getElementById('confirmation-message').textContent = data.confirmation;

  // Log the server's response to the console
  console.log(data);

});