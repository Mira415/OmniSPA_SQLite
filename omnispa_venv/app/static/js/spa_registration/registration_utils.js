// Displays a Bootstrap-style alert message on the page
function showAlert(message, type = "info") {
	// Create a new <div> element for the alert
	const alertDiv = document.createElement("div");

	// Add Bootstrap classes to style the alert
	alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
	alertDiv.role = "alert";

	// Set the message and include a close (x) button
	alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

	// Find the alert container if it exists, otherwise attach to <body>
	const container = document.getElementById("alertsContainer") || document.body;

	// Insert the alert at the top of the container
	container.prepend(alertDiv);

	// Automatically hide the alert after 5 seconds
	setTimeout(() => {
		alertDiv.classList.remove("show"); // Trigger Bootstrap fade-out
		setTimeout(() => alertDiv.remove(), 150); // Remove from DOM after fade-out
	}, 5000);
}
