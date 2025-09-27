// Wait until the page (DOM) has fully loaded before running the code
document.addEventListener("DOMContentLoaded", function () {
	const addReviewBtn = document.getElementById("addReviewBtn"); // Button to add a review
	const reviewForm = document.getElementById("reviewForm"); // Review submission form

	// Initialize event listeners, check login status, and load existing reviews
	setupEventListeners();
	checkAuthStatus(addReviewBtn);
	loadReviews();

	// Set up all event listeners for review-related interactions
	function setupEventListeners() {
		// Handle "Add Review" button click (requires authentication)
		if (addReviewBtn) {
			addReviewBtn.addEventListener("click", handleReviewButtonClick);
		}

		// Handle review form submission
		if (reviewForm) {
			reviewForm.addEventListener("submit", handleReviewSubmit);
		}

		// Handle star rating hover and click
		const stars = document.querySelectorAll("#ratingStars i"); // All star icons
		const ratingValue = document.getElementById("ratingValue");

		stars.forEach((star) => {
			// Highlight stars when hovered over
			star.addEventListener("mouseover", function () {
				const value = parseInt(this.getAttribute("data-value"));
				highlightStars(value);
			});

			// Save selected rating when clicked
			star.addEventListener("click", function () {
				const value = parseInt(this.getAttribute("data-value"));
				ratingValue.value = value;
			});
		});

		// Set up image preview functionality for uploaded review images
		setupImagePreview();
	}
});
