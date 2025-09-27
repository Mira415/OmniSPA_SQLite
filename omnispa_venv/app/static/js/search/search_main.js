// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
	initializeSearchFunctionality();
});

function initializeSearchFunctionality() {
	// DOM elements
	const searchInput = document.getElementById("searchInput");
	const searchForm = document.getElementById("searchForm");
	const searchSuggestions = document.getElementById("searchSuggestions");

	// Check if search elements exist - if not, exit early
	if (!searchInput || !searchForm) {
		console.log(
			"Search elements not found on this page, skipping search initialization"
		);
		return;
	}

	console.log("Initializing search functionality");

	// Setup event handlers
	setupSearchInputHandler(searchInput, searchSuggestions, searchForm);
	setupSearchFormHandler(searchForm, searchInput, searchSuggestions);

	// Close suggestions when clicking outside
	document.addEventListener("click", function (e) {
		if (searchForm && !searchForm.contains(e.target)) {
			hideSuggestions(searchForm, searchSuggestions);
		}
	});
}
