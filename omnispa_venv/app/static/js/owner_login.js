// Wait until the whole page is loaded before running this code
document.addEventListener("DOMContentLoaded", function () {
	// Get the "Register Spa" button
	const registerSpaBtn = document.getElementById("registerSpaBtn");

	// Get the login modal and set it up with Bootstrap
	const loginPromptModal = new bootstrap.Modal(
		document.getElementById("loginPromptModal")
	);

	// When the "Register Spa" button is clicked:
	registerSpaBtn.addEventListener("click", function (e) {
		e.preventDefault(); // Stop the default button action
		loginPromptModal.show(); // Show the login popup
	});

	// Handle the login form inside the modal
	document
		.getElementById("ownerLoginForm")
		?.addEventListener("submit", function (e) {
			e.preventDefault(); // Stop the form from refreshing the page

			// Get the values entered by the user
			const username = document.getElementById("ownerUsername").value;
			const password = document.getElementById("ownerPassword").value;

			// Send the login details to the backend
			fetch("/api/owner-login", {
				method: "POST", // Send data using POST
				headers: {
					"Content-Type": "application/json", // Tell server it's JSON
				},
				body: JSON.stringify({
					username: username, // Send username
					password: password, // Send password
				}),
			})
				.then((response) => {
					// If server says "not OK", throw an error
					if (!response.ok) {
						throw new Error("Login failed");
					}
					// Otherwise, turn the response into JSON
					return response.json();
				})
				.then((data) => {
					// If login was successful
					if (data.success) {
						loginPromptModal.hide(); // Close the popup
						window.location.href = "/registration.html"; // Redirect to registration page
					} else {
						// If login failed, show error message
						alert(data.message || "Invalid credentials");
					}
				})
				.catch((error) => {
					// If something goes wrong (network/server), log and show alert
					console.error("Error:", error);
					alert("Login failed. Please try again, Or contact admin.");
				});
		});

	// If the user clicks Contact admin link:
	document
		.getElementById("contactAdmin")
		?.addEventListener("click", function (e) {
			e.preventDefault(); // Stop link from doing anything
			// Show message telling them they can't self-register
			alert(
				"Please contact the system administrator to create an owner account."
			);
		});
});
