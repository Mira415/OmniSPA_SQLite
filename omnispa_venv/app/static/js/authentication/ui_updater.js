// uiUpdater.js- updates how the button looks and behaves depending on whether the user is logged in or not
function updateLoginButton(userId, username) {
	// Takes userId and username, if both exist then user is logged in otherwise user is logged out
	console.log("updateLoginButton called", { userId, username });

	const loginBtn = window.auth.loginBtn || document.querySelector(".btn-light");
	if (!loginBtn) {
		console.error("Login button not found for update!");
		return;
	}

	if (userId && username) {
		console.log("Updating button to logout state");
		loginBtn.innerHTML = `Logout (${username})`;
		loginBtn.style.backgroundColor = "var(--pink)";
		loginBtn.style.color = "var(--text-color)";
		loginBtn.onclick = handleLogout;
	} else {
		console.log("Updating button to login state");
		loginBtn.innerHTML = "<i class='bi bi-person'></i>User Login";
		loginBtn.style.backgroundColor = "white";
		loginBtn.style.color = "var(--text-color)";
		loginBtn.onclick = handleLoginClick;
	}
}
