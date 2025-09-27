function handleReviewSubmit(e) {
	// Prevent the form's default behavior (page refresh on submit)
	e.preventDefault();

	// Get the rating, review text, and spa ID from the form
	const rating = parseInt(document.getElementById("ratingValue").value);
	const comment = document.getElementById("reviewText").value.trim();
	const spaId = document.querySelector("input[name='spa_id']")?.value;

	// Validate spa ID (must exist)
	if (!spaId) {
		showAlert("Invalid spa reference", "danger");
		return;
	}

	// Validate rating (must be between 1 and 5)
	if (!rating || rating < 1 || rating > 5) {
		showAlert("Please select a rating between 1-5 stars", "danger");
		return;
	}

	// Validate review comment (must not be empty)
	if (!comment) {
		showAlert("Please write your review", "danger");
		return;
	}

	// Build form data with spa ID, rating, comment, and any uploaded images
	const formData = new FormData();
	formData.append("spa_id", spaId);
	formData.append("rating", rating);
	formData.append("comment", comment);

	// Add selected review images (if any) to the form data
	selectedImages.forEach((file, index) => {
		formData.append("review_images", file);
	});

	// Send review to the backend API via POST request
	fetch("/api/reviews", {
		method: "POST",
		body: formData,
	})
		.then((response) => response.json())
		.then((result) => {
			if (result.success) {
				// Add the new review to the page dynamically
				addReviewToPage(result.review);

				// Reset the review form and rating stars
				document.getElementById("reviewForm").reset();
				document.getElementById("ratingValue").value = "0";
				highlightStars(0);
				clearSelectedImages();

				// Close the review modal after submission
				const reviewModal = bootstrap.Modal.getInstance(
					document.getElementById("reviewModal")
				);
				reviewModal.hide();

				// Show a success alert
				showAlert("Review submitted successfully!", "success");
			} else {
				// If backend returns an error, throw it to be caught below
				throw new Error(result.message || "Failed to submit review");
			}
			// Force reload the page to ensure latest reviews are displayed
			window.location.reload(true); // reload page
		})
		.catch((error) => {
			// Handle any network or server errors
			console.error("Error submitting review:", error);
			showAlert(
				error.message || "Failed to submit review. Please try again.",
				"danger"
			);
		});
}
