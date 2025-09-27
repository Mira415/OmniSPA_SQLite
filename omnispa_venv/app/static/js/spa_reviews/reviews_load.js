// Loads reviews for a specific spa from the backend API
function loadReviews() {
	const spaId = document.querySelector("input[name='spa_id']")?.value; // Get spa ID from hidden input
	const reviewsContainer = document.getElementById("reviewsContainer"); // Container for reviews
	if (!spaId) return; // Stop if spaId is missing

	// Fetch reviews for this spa
	fetch(`/api/spas/${spaId}/reviews`)
		.then((response) => response.json())
		.then((data) => {
			if (!reviewsContainer) return;

			// Clear placeholder message ("No reviews yet") if reviews exist
			if (
				data.reviews &&
				data.reviews.length > 0 &&
				reviewsContainer.querySelector(".text-center")
			) {
				reviewsContainer.innerHTML = "";
			}

			// If reviews exist, add them to the page
			if (data.reviews && data.reviews.length > 0) {
				data.reviews.forEach((review) => {
					addReviewToPage(review);
				});
			}
		})
		.catch((error) => {
			// Handle fetch errors
			console.error("Error loading reviews:", error);
			showAlert("Failed to load reviews. Please try again.", "danger");
		});
}

// Adds a single review card to the page
function addReviewToPage(review) {
	const reviewsContainer = document.getElementById("reviewsContainer");
	if (!reviewsContainer) return;

	// Create a card for the review
	const reviewCard = document.createElement("div");
	reviewCard.className = "card review-card mb-3";

	let imagesHTML = "";
	// If the review has images, generate thumbnail previews
	if (review.images && review.images.length > 0) {
		imagesHTML = `
        <div class="review-images mt-3">
            <div class="d-flex flex-wrap gap-2">
                ${review.images
									.map(
										(img) => `
                    <img src="${img.filepath}" 
                         class="img-thumbnail" 
                         style="width: 80px; height: 80px; object-fit: cover; cursor: pointer"
                         data-bs-toggle="modal" 
                         data-bs-target="#imageModal"
                         data-image="${img.filepath}"
                         alt="Review image">
                `
									)
									.join("")}
            </div>
        </div>
    `;
	}

	// Build review card content
	reviewCard.innerHTML = `
    <div class="card-body">
        <div class="d-flex align-items-center mb-3">
            <div>
                <h5 class="mb-0">${review.username}</h5>
                <div class="rating small">
                    ${'<i class="bi bi-star-fill"></i>'.repeat(
											review.rating
										)}   <!-- Filled stars -->
                    ${'<i class="bi bi-star"></i>'.repeat(
											5 - review.rating
										)}   <!-- Empty stars -->
                    <span class="ms-2 text-muted">${formatDate(
											review.created_at
										)}</span>
                </div>
            </div>
        </div>
        <p class="mb-3">${review.comment}</p>
        ${imagesHTML}
    </div>
`;

	// Insert the new review at the top of the list
	reviewsContainer.insertBefore(reviewCard, reviewsContainer.firstChild);

	// Add click handlers for image thumbnails to open in modal
	reviewCard.querySelectorAll('img[data-bs-toggle="modal"]').forEach((img) => {
		img.addEventListener("click", function () {
			document.getElementById("modalImage").src =
				this.getAttribute("data-image");
		});
	});
}
