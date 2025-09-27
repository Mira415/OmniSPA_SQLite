// Checks if the user is logged in and updates the "Add Review" button accordingly
function checkAuthStatus(addReviewBtn) {
	fetch("/api/user/check-auth") // Ask backend if user is authenticated
		.then((response) => response.json()) // Convert response to JSON
		.then((data) => {
			if (addReviewBtn) {
				// If the review button exists
				if (data.authenticated) {
					// If user is logged in then enable button and show "Add Review"
					addReviewBtn.innerHTML =
						'<i class="bi bi-plus-circle me-2"></i>Add Review';
					addReviewBtn.classList.remove("disabled");
				} else {
					// If user is not logged in then disable button and show "Login to Review"
					addReviewBtn.innerHTML =
						'<i class="bi bi-lock me-2"></i>Login to Review';
					addReviewBtn.classList.add("disabled");
				}
			}
		})
		.catch((error) => {
			// Log any fetch/connection errors
			console.error("Error checking auth status:", error);
		});
}

// Handles what happens when the review button is clicked
function handleReviewButtonClick(e) {
	fetch("/api/user/check-auth") // Check if user is authenticated again
		.then((response) => response.json())
		.then((data) => {
			if (!data.authenticated) {
				// If user is NOT logged in then stop normal click action
				e.preventDefault();

				// Show a Bootstrap modal asking them to log in
				const loginRedirectModal = new bootstrap.Modal(
					document.getElementById("loginRedirectModal")
				);
				loginRedirectModal.show();
			}
		})
		.catch((error) => {
			// Handle fetch/connection errors gracefully
			console.error("Error checking auth:", error);
			showAlert(
				"Failed to check authentication status. Please try again.",
				"danger"
			);
		});
}
