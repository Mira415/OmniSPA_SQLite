// authHandlers.js - functions for authentication
async function handleLogout() {
	console.log("handleLogout called");
	try {
		const response = await fetch("/api/user/logout", {
			method: "POST",
			credentials: "include", // cookies/session info are sent with the request to log out
		});
		/*If logout succeeds,  resets the login button to “User Login” instead of showing username and 
		loops through all .like-heart icons and resets them to the empty*/
		if (response.ok) {
			const result = await response.json();
			console.log("Logout response:", result);
			if (result.success) {
				updateLoginButton(null, null);
				document.querySelectorAll(".like-heart").forEach((heart) => {
					heart.innerHTML = '<i class="bi bi-heart"></i>';
				});
			}
		} else {
			console.error("Logout failed with status:", response.status);
		}
	} catch (error) {
		// incase of any other errors
		console.error("Logout failed:", error);
		alert("Logout failed. Please try again.");
	}
	// window.location.reload(true); // forces reload from server, not cache
}

async function checkAuthStatus() {
	console.log("checkAuthStatus called");
	try {
		const response = await fetch("/api/user/check-auth", {
			// Sends a GET request to /api/user/check-auth
			credentials: "include", // uses cookies to check the session
		});
		console.log("Auth status response status:", response.status); // logs for debugging

		const data = await response.json();
		console.log("Auth status data:", data);
		// If user is authenticated, update the login button to display username...
		if (data.authenticated) {
			updateLoginButton(data.user_id, data.username);
			if (data.is_owner) {
				// ...and if user is an owner adds the attributes below to <body>
				document.body.setAttribute("data-is-owner", "true");
				document.body.setAttribute("data-owner-username", data.username);
				document.body.setAttribute("data-owner-email", data.email);
			}
		}
	} catch (error) {
		console.error("Error checking auth status:", error);
	}
}

async function handleLoginClick(e) {
	// Runs when the login button is clicked
	console.log("handleLoginClick called", e);
	e.preventDefault();
	e.stopPropagation();

	try {
		// Checks again if the user is already logged in
		const response = await fetch("/api/user/check-auth", {
			credentials: "include",
		});
		console.log("Auth check response status:", response.status);

		const data = await response.json();
		console.log("Auth check data:", data);

		if (data.authenticated) {
			// if they are logged in...
			console.log("User is authenticated, logging out");
			await handleLogout(); // ... wait for them to log out
		} else {
			console.log("User is not authenticated, showing modal");
			if (window.auth.loginModal) {
				window.auth.loginModal.show(); // otherwise show login modal
			}
		}
	} catch (error) {
		console.error("Error checking auth status:", error);
		// If checking fails it still shows the login modal so the user can try logging in again
		if (window.auth.loginModal) {
			window.auth.loginModal.show();
		}
	}
}
