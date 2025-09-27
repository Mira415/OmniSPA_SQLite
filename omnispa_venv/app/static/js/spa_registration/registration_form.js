// registration-form.js
async function handleFormSubmit(e) {
	e.preventDefault(); // stops normal HTML form submission so JS can handle it

	if (!validateForm()) return; // If validation fails, stops everything and doesn't continue with the form submission

	const submitBtn = document.querySelector(
		"#spaRegistrationForm button[type='submit']"
	);
	const originalBtnText = submitBtn.innerHTML; // Disables the button and shows a spinner so the user can't submit twice and sees progress
	submitBtn.disabled = true;
	submitBtn.innerHTML =
		'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

	try {
		const formData = new FormData();
		addFormData(formData);

		// Check if user is an owner and add owner_id to the form data
		const isOwner = await checkIfOwner();
		if (isOwner) {
			// Get the current owner's ID from the auth status
			const authResponse = await checkIfOwner();
			if (authData.authenticated && authData.is_owner) {
				formData.append("owner_id", authData.user_id);
				// Also add owner_email to help backend identify this is the same owner
				formData.append("owner_email", authData.email);
			}
		}

		const response = await fetch("/register", {
			method: "POST",
			body: formData,
		}); // contains all the spa registration details

		// If the server responded with success (HTTP status 200–299)
		if (response.ok) {
			const result = await response.json(); // Parse the JSON response

			// If the backend confirmed registration success
			if (result.success) {
				showAlert("Registration successful! Redirecting...", "success");

				// Save the new spa details in sessionStorage for later use
				sessionStorage.setItem(
					"newSpa",
					JSON.stringify({
						id: result.spa_id,
						name: result.spa_name,
						description: result.spa_description,
						image: result.spa_image || "/static/img/default_spa.jpg", // fallback image
					})
				);

				// Redirect user to the success page
				window.location.href = "/success";
			} else {
				// If the backend response says failure, show error message
				showAlert(result.message || "Registration failed", "danger");
			}
		} else {
			// If the HTTP response was not ok (e.g., 400, 500)
			const error = await response.json();

			// Handle the specific case where email might still conflict
			if (
				error.message &&
				error.message.includes("email") &&
				error.message.includes("already exists")
			) {
				showAlert(
					"This email is already registered. Please use a different contact email for this spa location.",
					"danger"
				);
			} else {
				// General error handling
				showAlert(error.message || "Registration failed", "danger");
			}
		}
	} catch (error) {
		// If there was a network error (server unreachable, timeout, etc.)
		showAlert("Network error occurred", "danger");
	} finally {
		// Re-enable the submit button and restore its original text
		submitBtn.disabled = false;
		submitBtn.innerHTML = originalBtnText;
	}
}

// Add this function to check if the user is an owner
async function checkIfOwner() {
	try {
		const response = await fetch("/api/check-auth-status", {
			credentials: "include",
		});
		if (!response.ok) return null;

		const data = await response.json();
		// Return the full object only if authenticated & is_owner
		return data.authenticated && data.is_owner ? data : null;
	} catch (error) {
		console.error("Error checking owner status:", error);
		return false;
	}
}

// Function to validate the spa registration form before submitting
function validateForm() {
	// List of required text fields that must be filled
	const requiredFields = [
		"spaName",
		"spaDescription",
		"spaAddress",
		"spaPhone",
		"spaEmail",
		"spaArea",
	];

	// Loop through each required field
	for (const fieldId of requiredFields) {
		const field = document.getElementById(fieldId);
		// If the field is empty, show error and stop submission
		if (!field.value.trim()) {
			showAlert(
				`Please fill in the ${field.labels[0]?.textContent || fieldId} field`,
				"danger"
			);
			field.focus(); // Move cursor to the missing field
			return false; // Stop form validation
		}
	}

	// Check if at least one service has been added
	if (typeof spaServices === "undefined" || spaServices.length === 0) {
		showAlert("Please add at least one service to your spa", "danger");

		// Smoothly scroll to the services section so the user can add one
		const servicesSection = document.getElementById("servicesSection");
		if (servicesSection) {
			servicesSection.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
			return false;
		}
	}

	// Ensure the user agrees to terms and conditions
	if (!document.getElementById("termsCheck").checked) {
		showAlert("You must agree to the terms and conditions", "danger");
		return false;
	}

	// Require at least 3 spa images uploaded
	if (uploadedImages.length < 3) {
		showAlert("Please upload at least 3 images of your spa", "danger");
		return false;
	}

	// If everything is valid, allow submission
	return true;
}

// Function to collect form data and prepare it for submission
function addFormData(formData) {
	// Fields to extract values from
	const requiredFields = [
		"spaName",
		"spaDescription",
		"spaAddress",
		"spaPhone",
		"spaEmail",
		"spaArea",
		"weekdayOpening",
		"weekdayClosing",
		"weekendOpening",
		"weekendClosing",
		"termsCheck",
	];

	// Go through each field and add its value to FormData
	requiredFields.forEach((field) => {
		const element =
			document.getElementById(field) ||
			document.querySelector(`[name="${field}"]`);

		if (element) {
			if (element.type === "checkbox") {
				formData.append(field, element.checked); // Store true/false
			} else {
				formData.append(field, element.value); // Store field value
			}
		}
	});

	// Format spa services before adding them
	const validatedServices = spaServices.map((service) => {
		return {
			category: service.category,
			name: service.name,
			description: service.description || "",
			duration: Number(service.duration) || 0,
			price: Number(service.price) || 0,
		};
	});
	formData.append("services", JSON.stringify(validatedServices));

	// Add weekly availability schedule
	formData.append("availability", JSON.stringify(weeklyAvailability));

	// Attach uploaded images to the FormData
	uploadedImages.forEach((image, index) => {
		formData.append(
			`spaImages`,
			image.file,
			image.file.name || `image_${index}.jpg` // Use original name or fallback
		);
	});
}
