// formHandlers.js- Core authentication workflow for login and registration
async function handleUserFormSubmit(e) {
	// runs when the user submits the login form
	console.log("handleUserFormSubmit called", e);
	e.preventDefault();
	// Reads the form fields
	const username = document.getElementById("username").value.trim();
	const email = document.getElementById("email").value.trim();
	const password = document.getElementById("password").value;

	console.log("Form values:", {
		username,
		email,
		password: password ? "***" : "empty",
	});

	try {
		const loginResponse = await fetch("/api/user/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username: username,
				email: email,
				password: password,
			}),
			credentials: "include",
		});

		console.log("Login response status:", loginResponse.status);

		// If login succeeds, hides the login modal, updates login button to show username and loads user’s favorites if any
		const loginResult = await loginResponse.json();
		console.log("Login result:", loginResult);

		if (loginResult.success) {
			console.log("Login successful, hiding modal");
			if (window.auth.loginModal) {
				window.auth.loginModal.hide();
			}
			updateLoginButton(loginResult.user.id, loginResult.user.username);

			if (loginResult.favorites) {
				loginResult.favorites.forEach((spaId) => {
					const heart = document.querySelector(
						`.like-heart[data-spa-id="${spaId}"]`
					);
					if (heart) {
						heart.innerHTML =
							'<i class="bi bi-heart-fill" style="color: palevioletred;"></i>';
					}
				});
			}
			window.location.reload(true); // forces reload from server, not cache
			return;
		}
		// If login fails, it assumes the user is new and tries to register them instead
		console.log("Login failed, trying registration");

		const registerResponse = await fetch("/api/user/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username: username,
				email: email,
				password: password,
			}),
			credentials: "include",
		});

		console.log("Register response status:", registerResponse.status);
		// If registration works: Automatically logs them in right away, no need to re-enter details
		const registerResult = await registerResponse.json();
		console.log("Register result:", registerResult);

		if (registerResult.success) {
			console.log("Registration successful, trying auto-login");
			const newLoginResponse = await fetch("/api/user/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username: username,
					password: password,
				}),
				credentials: "include",
			});

			console.log("Auto-login response status:", newLoginResponse.status);

			const newLoginResult = await newLoginResponse.json();
			console.log("Auto-login result:", newLoginResult);
			// If auto-login succeeds, hides modal, updates button but if it fails, hides modal and tells user to log in manually.
			if (newLoginResult.success) {
				console.log("Auto-login successful, hiding modal");
				if (window.auth.loginModal) {
					window.auth.loginModal.hide();
				}
				updateLoginButton(newLoginResult.user.id, newLoginResult.user.username);
			} else {
				console.log("Auto-login failed, hiding modal and showing alert");
				if (window.auth.loginModal) {
					window.auth.loginModal.hide();
				}
				alert("Registration successful! Please log in.");
			}
		} else {
			console.log("Registration failed, showing alert");
			alert(registerResult.message || "Registration failed");
		}
	} catch (error) {
		console.error("Authentication error:", error);
		alert("Could not connect to server. Please try again later.");
	}
}
