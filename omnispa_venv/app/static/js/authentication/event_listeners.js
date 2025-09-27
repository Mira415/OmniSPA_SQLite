// eventListeners.js- connects DOM elements to the handler functions
function setupEventListeners() {
	console.log("Setting up event listeners");

	if (window.auth.loginBtn) {
		console.log("Adding click listener to login button"); // logs for debugging
		window.auth.loginBtn.addEventListener("click", handleLoginClick); // Calls handleLoginClick from authHandlers.js
	} else {
		console.error("Login button not found!");
	}

	if (window.auth.userForm) {
		console.log("Adding submit listener to user form");
		window.auth.userForm.addEventListener("submit", handleUserFormSubmit);
	} else {
		console.error("User form not found!");
	}

	// Add event listeners to modal close buttons
	const closeButtons = document.querySelectorAll(
		'#loginModal .btn-close, #loginModal [data-bs-dismiss="modal"]'
	);
	console.log("Found close buttons:", closeButtons.length);

	closeButtons.forEach((button, index) => {
		console.log(`Adding click listener to close button ${index}`);
		button.addEventListener("click", function (e) {
			console.log("Close button clicked", e);
			if (window.auth.loginModal) {
				window.auth.loginModal.hide();
			}
		});
	});
}
