// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
	// Function to load carousel images dynamically from the server
	function loadCarouselImages() {
		// Fetch carousel image data from API
		fetch("/api/carousel-images")
			.then((response) => response.json())
			.then((data) => {
				const carouselInner = document.getElementById("carouselInner"); // Container for carousel slides
				const carouselIndicators =
					document.getElementById("carouselIndicators"); // Container for carousel indicators/buttons

				// Clear any existing content
				carouselInner.innerHTML = "";
				carouselIndicators.innerHTML = "";

				if (data.images && data.images.length > 0) {
					// Loop through images returned from API
					data.images.forEach((image, index) => {
						// Create carousel indicator button
						const indicator = document.createElement("button");
						indicator.type = "button";
						indicator.dataset.bsTarget = "#spaCarousel";
						indicator.dataset.bsSlideTo = index;
						indicator.setAttribute("aria-label", `Slide ${index + 1}`);
						if (index === 0) {
							indicator.className = "active";
							indicator.setAttribute("aria-current", "true");
						}
						carouselIndicators.appendChild(indicator);

						// Create carousel item (slide)
						const carouselItem = document.createElement("div");
						carouselItem.className =
							index === 0 ? "carousel-item active" : "carousel-item";

						// Container for image
						const imgContainer = document.createElement("div");
						imgContainer.className = "carousel-img-container";

						const img = document.createElement("img");
						img.src = image.filepath; // Set image source
						img.alt = image.caption || "Spa Image"; // Fallback alt text
						imgContainer.appendChild(img);

						// Overlay for captions and button
						const overlay = document.createElement("div");
						overlay.className = "carousel-overlay";

						const caption = document.createElement("div");
						caption.className = "carousel-caption";

						const title = document.createElement("h5");
						title.textContent = image.spa_name || "Spa Experience";

						const buttonContainer = document.createElement("p");
						const button = document.createElement("a");
						button.className = "btn btn-spa";
						button.href = `/spa/${image.spa_id}`; // Link to spa page
						button.textContent = "View Spa";

						buttonContainer.appendChild(button);
						caption.appendChild(title);
						caption.appendChild(buttonContainer);
						overlay.appendChild(caption);

						// Add image and overlay to carousel item
						carouselItem.appendChild(imgContainer);
						carouselItem.appendChild(overlay);

						// Add the carousel item to the carousel
						carouselInner.appendChild(carouselItem);
					});
				} else {
					// Fallback: If no images are returned, show default slides
					carouselInner.innerHTML = `
                        <div class="carousel-item active">
                            <div class="carousel-img-container">
                                <img src="https://miro.medium.com/v2/resize:fit:722/1*MIFpeMoCoaRVgMrqu8w50Q.jpeg" alt="Luxury Spa Interior">
                            </div>
                            <div class="carousel-overlay">
                                <div class="carousel-caption">
                                    <h5>Serenity Treatment Room</h5>
                                    <p>
                                        <a class="btn btn-spa" href="book.html">Book Now</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="carousel-item">
                            <div class="carousel-img-container">
                                <img src="https://www.communityamenitymanagement.com/wp-content/uploads/2022/05/93546969_presentation-wide.jpg" alt="Spa Pool Area">
                            </div>
                            <div class="carousel-overlay">
                                <div class="carousel-caption">
                                    <h5>Hydrotherapy Pool</h5>
                                    <p>
                                        <a class="btn btn-spa" href="#">Book Now</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    `;

					// Add default carousel indicators
					carouselIndicators.innerHTML = `
                        <button type="button" data-bs-target="#spaCarousel" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
                        <button type="button" data-bs-target="#spaCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
                    `;
				}
			})
			.catch((error) => {
				// Handle errors fetching carousel images
				console.error("Error loading carousel images:", error);
			});
	}

	// Load carousel images when the page loads
	loadCarouselImages();
});
