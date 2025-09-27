// Adds a new service based on the form inputs
function addService() {
	const category = document.getElementById("serviceCategorySelector").value;
	const name = document.getElementById("serviceName").value.trim();
	const duration = document.getElementById("serviceDuration").value;
	const price = document.getElementById("servicePrice").value.trim();
	const description = document
		.getElementById("serviceDescription")
		.value.trim();

	// Convert duration and price into numbers
	const durationNum = parseInt(duration);
	const priceNum = parseFloat(price);

	// Validate required fields (must be valid numbers and not empty)
	if (!name || isNaN(durationNum) || isNaN(priceNum)) {
		showAlert("Please fill in all required fields with valid values", "danger");
		return;
	}

	// Extra validation for duration and price
	if (durationNum <= 0) {
		showAlert("Duration must be greater than 0", "danger");
		return;
	}

	if (priceNum <= 0) {
		showAlert("Price must be greater than 0", "danger");
		return;
	}

	// Add the new service to the global spaServices array
	spaServices.push({
		category: category,
		name: name,
		duration: durationNum,
		price: priceNum,
		description: description,
	});

	// Update the UI to show the added service
	displayCurrentServices();

	// Reset form fields so user can add another service
	resetServiceForm();
}

// Quickly add a service (used for pre-filled or suggested services)
function quickAddService(category, name, duration, price, description = "") {
	// Fill in the form with given values
	document.getElementById("serviceCategorySelector").value = category;
	document.getElementById("serviceName").value = name;
	document.getElementById("serviceDuration").value = duration;
	document.getElementById("servicePrice").value = price;
	document.getElementById("serviceDescription").value = description;

	// Submit the filled form
	addService();
}

// Displays all current services in the UI
function displayCurrentServices() {
	const container = document.getElementById("currentServices");

	// If no services yet, show a placeholder message
	container.innerHTML =
		spaServices.length === 0
			? '<div class="alert alert-light mb-0">No services added yet</div>'
			: spaServices
					.map(
						(service, index) => `
            <div class="badge bg-light text-dark p-2 d-flex align-items-center mb-2">
                <span class="me-1 fw-bold">${service.name}</span>
                <span class="me-1">(${getCategoryName(service.category)})</span>
                <span class="me-1">${service.duration}min</span>
                <span class="me-1">$${service.price}</span>
                ${
									service.description
										? `<span class="me-1">#${service.description}</span>`
										: ""
								}
                <button onclick="removeService(${index})" class="btn btn-sm ms-2 p-0">
                    &times;
                </button>
            </div>
        `
					)
					.join(""); // Join all service HTML into one string
}

// Removes a service by its index in spaServices array
function removeService(index) {
	spaServices.splice(index, 1); // Remove the service
	displayCurrentServices(); // Refresh UI
}

// Resets the add-service form back to default values
function resetServiceForm() {
	document.getElementById("serviceName").value = "";
	document.getElementById("serviceDuration").value = 60;
	document.getElementById("servicePrice").value = "";
	document.getElementById("serviceDescription").value = "";
}
