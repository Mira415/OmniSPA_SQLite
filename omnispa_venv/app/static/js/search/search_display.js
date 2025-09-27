// Handling the search suggestions and displaying full search results for spas and services

function displaySuggestions(
	results,
	query,
	searchSuggestions,
	searchForm,
	searchInput
) {
	// Shows the dropdown suggestions while typing in the search bar
	if (!searchSuggestions) return; // Check if suggestions container exists

	if (results.length === 0) {
		// If no results show message
		searchSuggestions.innerHTML =
			'<div class="no-results">No matching spas or services found</div>';
		searchForm.classList.add("search-active");
		return;
	}
	// Otherwise, displays the number of matches
	let html = `<div class="search-result-count">${results.length} results found</div>`;

	results.forEach((item) => {
		// Determine icon and category based on result type depending on whether it’s a spa or a service
		let icon = "bi-spa";
		let category = "spa";

		if (item.type === "service") {
			icon = "bi-scissors";
			category = "service";
		}
		// Builds clickable suggestion HTML
		html += `
            <div class="search-suggestion-item" data-item-id="${
							item.id
						}" data-item-type="${item.type || "spa"}">
                <i class="bi ${icon}"></i>
                <div>
                    <div>${highlightMatch(item.name, query)}</div>
                    <small class="text-muted">${item.area || ""} • ${
			item.address || ""
		}</small>
				${
					item.matching_services
						? `<small class="text-muted">Services: ${item.matching_services.join(
								", "
						  )}</small>`
						: ""
				}
                </div>
                <span class="search-category">${category}</span>
            </div>
        `;
	});
	// Insert into suggestions container & activate UI
	searchSuggestions.innerHTML = html;
	searchForm.classList.add("search-active");

	// Add click event to suggestions
	searchSuggestions
		.querySelectorAll(".search-suggestion-item")
		.forEach((item) => {
			item.addEventListener("click", function () {
				const itemId = this.getAttribute("data-item-id");
				const itemType = this.getAttribute("data-item-type");

				let searchQuery = "";

				if (itemType === "service") {
					// For service suggestions, use the first matching service name
					const matchingServicesElement = this.querySelector(
						"small.text-muted:last-child"
					);
					if (
						matchingServicesElement &&
						matchingServicesElement.textContent.includes("Services:")
					) {
						// Extract the first service name from "Services: Honey Scrub, Massage"
						const servicesText = matchingServicesElement.textContent
							.replace("Services:", "")
							.trim();
						const firstService = servicesText.split(",")[0].trim();
						searchQuery = firstService;
						searchInput.value = firstService;
					} else {
						// Fallback: use the spa name
						const nameElement = this.querySelector("div > div:first-child");
						searchQuery = nameElement ? nameElement.textContent.trim() : "";
						searchInput.value = searchQuery;
					}
				} else {
					// For spa suggestions, use the spa name
					const nameElement = this.querySelector("div > div:first-child");
					searchQuery = nameElement ? nameElement.textContent.trim() : "";
					searchInput.value = searchQuery;
				}

				hideSuggestions(searchForm, searchSuggestions);

				// Perform appropriate search based on item type
				if (itemType === "service") {
					// For services, search by service name
					fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=service`)
						.then((response) => response.json())
						.then((data) => displaySearchResults(data, searchQuery))
						.catch((error) => {
							console.error("Error fetching details:", error);
							displaySearchResults([], searchQuery);
						});
				} else {
					// For spas, use regular search
					fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
						.then((response) => response.json())
						.then((data) => displaySearchResults(data, searchQuery))
						.catch((error) => {
							console.error("Error fetching details:", error);
							displaySearchResults([], searchQuery);
						});
				}
			});
		});
}

function displaySearchResults(results, query) {
	const searchResultsSection = document.getElementById("searchResultsSection");
	const searchResults = document.getElementById("searchResults");

	if (!searchResultsSection || !searchResults) return;

	if (results.length === 0) {
		// If no results then show “no results found” message
		searchResultsSection.style.display = "block";
		searchResults.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-search" style="font-size: 3rem; color: #ccc;"></i>
                <h3 class="mt-3">No results found for "${query}"</h3>
                <p>Try different keywords or browse all our spas</p>
            </div>
        `;

		// Hide the regular spa listings
		hideRegularListings();
		return;
	}

	searchResultsSection.style.display = "block";
	// Otherwise, build spa result cards
	let html = "";
	results.forEach((spa) => {
		// Use placeholder image
		const imageUrl = spa.image_url || "/static/img/default_spa.jpg";
		// Generate random features for demo purposes
		const features = [
			"Beauty Treatment",
			"Facial",
			"Hair Treament",
			"Massage",
			"Body Treatment",
		];
		const randomFeatures = [...features]
			.sort(() => 0.5 - Math.random())
			.slice(0, 3);
		html += `
		<div class="col-lg-4 col-md-6 spa-card" id="spa-${spa.id}">
			<div class="spa-card">
				<div class="spa-image-container">
					<img src=${imageUrl} 
						alt="${spa.name}">
				</div>
				<div class="spa-card-content">
					<h5 class="card-title mt-3">${spa.name}</h5>
					
					<p class="spa-description">
						${
							spa.description
								? spa.description.substring(0, 100) +
								  (spa.description.length > 100 ? "..." : "")
								: "No description available"
						}
					</p>
					<div class="spa-features">
						${randomFeatures
							.map((feature) => `<span class="spa-feature">${feature}</span>`)
							.join("")}
					</div>
					<div class="mb-2">
						<small class="text-muted">
							<i class="bi bi-geo-alt"></i> 
							${spa.area || "Unknown area"}
						</small>
					</div>
					
					<div class="mb-2">
						<small class="text-muted">
							<i class="bi bi-telephone"></i> 
							${spa.phone || "No phone"}
						</small>
					</div>
					<div class="spa-card-actions">
						<a class="btn view-details-btn" href="/spa/${spa.id}">
							View Details
						</a>
					</div>
				</div>
			</div>
		</div>
	`;
	});

	searchResults.innerHTML = html;

	// Hide the regular spa listings and carousel when showing search results
	hideRegularListings();
}

function hideRegularListings() {
	// hides the main spas list, carousel, and section title
	const spasSection = document.getElementById("spas");
	const carouselContainer = document.querySelector(".carousel-container");
	const sectionTitle = document.querySelector(".section-title");

	if (spasSection) spasSection.style.display = "none";
	if (carouselContainer) carouselContainer.style.display = "none";
	if (sectionTitle) sectionTitle.style.display = "none";
}

function showRegularListings() {
	// restores them (used when clearing search)
	const spasSection = document.getElementById("spas");
	const carouselContainer = document.querySelector(".carousel-container");
	const sectionTitle = document.querySelector(".section-title");

	if (spasSection) spasSection.style.display = "block";
	if (carouselContainer) carouselContainer.style.display = "block";
	if (sectionTitle) sectionTitle.style.display = "block";
}
