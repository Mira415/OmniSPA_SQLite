// Debounce function to limit API calls
function debounce(func, wait) {
	// Limits how often a function runs, eg. If the user types "spa" quickly,
	//  With debounce the API is called once, after typing stops, instead of three times, once per letter
	let timeout;
	return function executedFunction(...args) {
		// Each trigger cancels the previous timer and starts a new one
		const later = () => {
			clearTimeout(timeout);
			func.apply(this, args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

function highlightMatch(text, query) {
	// Highlights the matching part of search results by wrapping it in <mark>...</mark>.
	if (!query || !text) return text || "";

	const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
	return text.replace(regex, "<mark>$1</mark>");
}

function escapeRegex(string) {
	// Prevents regex errors if the query contains special regex characters
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Replaces characters like ., *, +, ?, (, ), etc., with escaped versions \.
}

function hideSuggestions(searchForm, searchSuggestions) {
	// Hides the dropdown suggestion box for search
	if (searchForm && searchSuggestions) {
		searchForm.classList.remove("search-active");
	}
}
