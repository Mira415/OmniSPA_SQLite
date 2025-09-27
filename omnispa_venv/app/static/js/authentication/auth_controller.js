// authController.js
document.addEventListener("DOMContentLoaded", function () {
	console.log("DOM fully loaded, auth.js initializing");

	// Global variables
	window.auth = window.auth || {};
	window.auth.loginBtn = document.querySelector(".btn-light"); // login button with .btn-light class
	window.auth.userForm = document.getElementById("userForm"); // login/signup form
	window.auth.loginModalElement = document.getElementById("loginModal");

	if (window.auth.loginModalElement) {
		// Initialize Bootstrap modal
		window.auth.loginModal = new bootstrap.Modal(window.auth.loginModalElement);
	}
	// Logs useful for debugging
	console.log("Elements found:", {
		loginBtn: !!window.auth.loginBtn,
		userForm: !!window.auth.userForm,
		loginModalElement: !!window.auth.loginModalElement,
		loginModal: !!window.auth.loginModal,
	});

	function init() {
		console.log("Initializing auth module");
		setupEventListeners(); // will attach click/submit listeners
		checkAuthStatus(); // check user authentication status
	}

	init(); // Executes the auth module setup as soon as the DOM is ready
});
