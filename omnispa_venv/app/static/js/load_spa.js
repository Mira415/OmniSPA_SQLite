document.addEventListener("DOMContentLoaded", async function () {
	// Get new SPA data from session storage if user just registered one
	const newSpa = JSON.parse(sessionStorage.getItem("newSpa"));

	try {
		// Check if user is authenticated
		const authResponse = await fetch("/api/user/check-auth", {
			credentials: "include",
		});
		const authData = await authResponse.json();

		let userFavorites = [];
		if (authData.authenticated && authData.user_id) {
			// Fetch user’s favorite spas
			const favResponse = await fetch(
				`/api/users/${authData.user_id}/favorites`,
				{ credentials: "include" }
			);
			if (favResponse.ok) {
				const favorites = await favResponse.json();
				userFavorites = favorites.map((fav) => fav.spa_id); // Keep IDs for quick check
			}
		}

		// Fetch all spas
		const response = await fetch("/api/spas");
		const data = await response.json();
		const container = document.getElementById("spaListings");

		if (container && data.spas) {
			// Build SPA cards dynamically
			container.innerHTML = data.spas
				.map((spa) => {
					const isFavorited = userFavorites.includes(spa.id);

					// Generate 3 random features for demo purposes
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

					return `
                        <div class="col-lg-4 col-md-6 spa-card" id="spa-${
													spa.id
												}">
                            <div class="spa-card">
                                <div class="spa-image-container">
                                    <img src="${spa.image}" alt="${spa.name}">
                                </div>
                                <div class="spa-card-content">
                                    <h3 class="spa-name">${spa.name}</h3>
                                    <p class="spa-description">${
																			spa.description
																		}</p>
                                    <div class="spa-features">
                                        ${randomFeatures
																					.map(
																						(feature) =>
																							`<span class="spa-feature">${feature}</span>`
																					)
																					.join("")}
                                    </div>
                                    <div class="spa-card-actions">
                                        <a class="btn view-details-btn" href="/spa/${
																					spa.id
																				}">View Details</a>
                                        <button class="btn like-heart" data-spa-id="${
																					spa.id
																				}">
                                            <i class="bi bi-heart${
																							isFavorited ? "-fill" : ""
																						}" style="${
						isFavorited ? "color: palevioletred;" : ""
					}"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
				})
				.join("");

			// If a new SPA was just registered, add it to the list
			if (newSpa) {
				const existingSpa = data.spas.find((spa) => spa.id === newSpa.id);

				if (!existingSpa) {
					const isFavorited = userFavorites.includes(newSpa.id);

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

					const spaCard = `
                        <div class="col-lg-4 col-md-6 spa-card" id="spa-${
													newSpa.id
												}">
                            <div class="spa-card">
                                <div class="spa-card-badge">New</div>
                                <div class="spa-image-container">
                                    <img src="${newSpa.image}" alt="${
						newSpa.name
					}">
                                </div>
                                <div class="spa-card-content">
                                    <h3 class="spa-name">${newSpa.name}</h3>
                                    <p class="spa-description">${
																			newSpa.description
																		}</p>
                                    <div class="spa-features">
                                        ${randomFeatures
																					.map(
																						(feature) =>
																							`<span class="spa-feature">${feature}</span>`
																					)
																					.join("")}
                                    </div>
                                    <div class="spa-card-actions">
                                        <a class="btn view-details-btn" href="/spa/${
																					newSpa.id
																				}">View Details</a>
                                        <button class="btn like-heart" data-spa-id="${
																					newSpa.id
																				}">
                                            <i class="bi bi-heart${
																							isFavorited ? "-fill" : ""
																						}" style="${
						isFavorited ? "color: palevioletred;" : ""
					}"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

					container.insertAdjacentHTML("beforeend", spaCard);
				}

				// Remove newSpa from session storage to prevent duplication
				sessionStorage.removeItem("newSpa");
			}
		}
	} catch (error) {
		console.error("Error loading SPAs:", error);
		loadSpasFallback(newSpa); // Optional fallback if fetch fails
	}
});
