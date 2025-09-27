function setupSearchInputHandler(searchInput, searchSuggestions, searchForm) {
	searchInput.addEventListener(
		"input",
		debounce(function (e) {
			const query = e.target.value.trim();

			if (query.length < 2) {
				hideSuggestions(searchForm, searchSuggestions);
				return;
			}

			// Make API call to get search suggestions from both spas and services
			Promise.all([
				fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`),
				fetch(`/api/search/services?q=${encodeURIComponent(query)}`),
			])
				.then((responses) =>
					Promise.all(
						responses.map((response) => {
							if (!response.ok) throw new Error("Network response was not ok");
							return response.json();
						})
					)
				)
				.then(([spaResults, serviceResults]) => {
					// Combine results from both endpoints
					const combinedResults = [...spaResults, ...serviceResults];
					displaySuggestions(
						combinedResults,
						query,
						searchSuggestions,
						searchForm,
						searchInput
					);
				})
				.catch((error) => {
					console.error("Error fetching suggestions:", error);
					hideSuggestions(searchForm, searchSuggestions);
				});
		}, 300)
	);
}

function setupSearchFormHandler(searchForm, searchInput, searchSuggestions) {
	searchForm.addEventListener("submit", function (e) {
		e.preventDefault();
		const query = searchInput.value.trim();

		if (query === "") return;

		// Hide suggestions
		hideSuggestions(searchForm, searchSuggestions);

		// Check if this might be a service search
		const isLikelyServiceSearch =
			query.length > 3 && query.split(" ").length === 1;

		// Perform full search - try service search first if it looks like a service
		if (isLikelyServiceSearch) {
			fetch(`/api/search?q=${encodeURIComponent(query)}&type=service`)
				.then((response) => {
					if (!response.ok) {
						throw new Error("Network response was not ok");
					}
					return response.json();
				})
				.then((data) => {
					if (data.length === 0) {
						// If no service results, try regular spa search
						return fetch(`/api/search?q=${encodeURIComponent(query)}`).then(
							(response) => response.json()
						);
					}
					return data;
				})
				.then((data) => {
					displaySearchResults(data, query);
				})
				.catch((error) => {
					console.error("Error fetching search results:", error);
					displaySearchResults([], query);
				});
		} else {
			// Regular spa search
			fetch(`/api/search?q=${encodeURIComponent(query)}`)
				.then((response) => {
					if (!response.ok) {
						throw new Error("Network response was not ok");
					}
					return response.json();
				})
				.then((data) => {
					displaySearchResults(data, query);
				})
				.catch((error) => {
					console.error("Error fetching search results:", error);
					displaySearchResults([], query);
				});
		}
	});
}
