// Highlights the star rating visually based on the number of stars selected
function highlightStars(count) {
	const stars = document.querySelectorAll("#ratingStars i"); // Select all star icons
	stars.forEach((star, index) => {
		if (index < count) {
			// Fill in stars up to the selected count
			star.classList.remove("bi-star"); // remove empty star class
			star.classList.add("bi-star-fill"); // add filled star class
		} else {
			// Unfill remaining stars
			star.classList.remove("bi-star-fill"); // remove filled star class
			star.classList.add("bi-star"); // add empty star class
		}
	});
}

// Formats a date string into a human-readable format like "September 19, 2025"
function formatDate(dateString) {
	const options = { year: "numeric", month: "long", day: "numeric" };
	return new Date(dateString).toLocaleDateString(undefined, options);
}

// Displays an alert message above the reviews section
function showAlert(message, type) {
	// Remove any existing alert first
	const existingAlert = document.querySelector(".review-alert");
	if (existingAlert) {
		existingAlert.remove();
	}

	// Create a new alert element
	const alertDiv = document.createElement("div");
	alertDiv.className = `alert alert-${type} review-alert alert-dismissible fade show`;
	alertDiv.role = "alert";
	alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

	// Insert the alert at the top of the reviews container (or body if container not found)
	const reviewsContainer = document.getElementById("reviewsContainer");
	if (reviewsContainer) {
		reviewsContainer.insertBefore(alertDiv, reviewsContainer.firstChild);
	} else {
		document.body.insertBefore(alertDiv, document.body.firstChild);
	}

	// Automatically close the alert after 5 seconds using Bootstrap's alert component
	setTimeout(() => {
		const bsAlert = new bootstrap.Alert(alertDiv);
		bsAlert.close();
	}, 5000);
}
