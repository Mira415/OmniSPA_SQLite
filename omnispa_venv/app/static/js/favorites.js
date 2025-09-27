document.addEventListener("DOMContentLoaded", function () {
	// Get references to DOM elements
	const likesList = document.getElementById("likesList");
	const noFavoritesMessage = document.getElementById("noFavoritesMessage");
	const favoritesModal = new bootstrap.Modal(
		document.getElementById("favoritesModal")
	);
	const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
	const favoritesBtn = document.getElementById("favoritesBtn");

	// Initialize event listeners
	function init() {
		setupEventListeners();
	}

	function setupEventListeners() {
		if (favoritesBtn) {
			// Open favorites modal when favorites button is clicked
			favoritesBtn.addEventListener("click", handleFavoritesClick);
		}

		// Listen for clicks on heart icons to toggle favorite
		document.addEventListener("click", handleHeartClick);
	}

	// Handle click on favorites button
	async function handleFavoritesClick(e) {
		e.preventDefault();

		try {
			// Check if user is logged in
			const authResponse = await fetch("/api/user/check-auth", {
				credentials: "include",
			});
			const authData = await authResponse.json();

			if (!authData.authenticated) {
				loginModal.show(); // Show login modal if not logged in
				return;
			}

			if (!authData.user_id) {
				throw new Error("User ID not available");
			}

			// Fetch the user's favorite spas
			const favResponse = await fetch(
				`/api/users/${authData.user_id}/favorites`,
				{ credentials: "include" }
			);

			if (!favResponse.ok) throw new Error("Failed to fetch favorites");

			const favorites = await favResponse.json();
			updateFavoritesModal(favorites); // Update modal content
			favoritesModal.show(); // Show modal
		} catch (error) {
			console.error("Error loading favorites:", error);
			alert("Failed to load favorites. Please try again.");
		}
	}

	// Handle click on heart icons to add/remove favorite
	async function handleHeartClick(e) {
		const heart = e.target.closest(".like-heart"); // Find clicked heart
		if (!heart) return;

		try {
			const authResponse = await fetch("/api/user/check-auth");
			const authData = await authResponse.json();

			if (!authData.authenticated) {
				loginModal.show(); // Show login modal if not logged in
				return;
			}

			const spaId = heart.dataset.spaId;
			// Send request to toggle favorite
			const response = await fetch("/api/favorites", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ spa_id: spaId }),
				credentials: "include",
			});

			const result = await response.json();

			// Update heart icon based on action
			if (result.success) {
				heart.innerHTML =
					result.action === "added"
						? '<i class="bi bi-heart-fill" style="color: palevioletred;"></i>'
						: '<i class="bi bi-heart"></i>';
			}
		} catch (error) {
			console.error("Error toggling favorite:", error);
			alert("Failed to update favorite. Please try again.");
		}
	}

	// Update modal content with favorite spas
	function updateFavoritesModal(favorites) {
		if (!likesList) return;

		likesList.innerHTML = "";

		if (favorites.length === 0) {
			noFavoritesMessage.style.display = "block"; // Show message if empty
			return;
		}

		noFavoritesMessage.style.display = "none";

		favorites.forEach((spa) => {
			const likeItem = document.createElement("div");
			likeItem.className = "col-md-6 liked-item mb-3";
			likeItem.innerHTML = `
                <img src="/static/${
									spa.spa_image || "/static/img/default_spa.jpg"
								}"
                     width="140" height="140" class="rounded-circle" alt="${
												spa.spa_name
											}">
                <div>
                    <h3>${spa.spa_name}</h3>
                    <p>${spa.spa_description.substring(0, 50)}...</p>
                    <a href="/spa/${spa.spa_id}" class="btn btn-sm" 
                       style="background-color: palevioletred; color: white;">
                        View Details
                    </a>
                </div>
            `;
			likesList.appendChild(likeItem); // Add each favorite to the modal
		});
	}

	init(); // Start the script
});
