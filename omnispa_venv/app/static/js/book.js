// Wait until the page is fully loaded
document.addEventListener("DOMContentLoaded", function () {
	let selectedServices = []; // Stores the services the user selects
	let totalAmount = 0; // Total cost of selected services
	let totalDuration = 0; // Total duration of selected services

	// Listen for changes on each service checkbox
	document.querySelectorAll(".service-checkbox").forEach((checkbox) => {
		checkbox.addEventListener("change", function () {
			const serviceId = this.dataset.serviceId;
			const serviceName = this.dataset.service;
			const price = parseFloat(this.value);
			const duration = parseInt(this.dataset.duration);

			if (this.checked) {
				// Add selected service
				selectedServices.push({
					id: serviceId,
					name: serviceName,
					price,
					duration,
				});
				totalAmount += price;
				totalDuration += duration;
			} else {
				// Remove deselected service
				selectedServices = selectedServices.filter((s) => s.id !== serviceId);
				totalAmount -= price;
				totalDuration -= duration;
			}

			updateSelectedServicesList();
			updateTotalDisplay();
			updateTimeSlots();
		});
	});

	// Recalculate available time slots when the booking date changes
	document
		.getElementById("bookingDate")
		.addEventListener("change", function () {
			updateTimeSlots();
		});

	// Updates the displayed list of selected services
	function updateSelectedServicesList() {
		const list = document.getElementById("selectedServicesList");
		list.innerHTML = selectedServices
			.map(
				(service) => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                ${service.name}
                <span class="badge bg-primary rounded-pill">SCR ${service.price}</span>
            </li>
        `
			)
			.join("");

		// Store selected services in hidden input for form submission
		document.getElementById("servicesInput").value =
			JSON.stringify(selectedServices);
	}

	// Updates the total cost and total duration displays
	function updateTotalDisplay() {
		document.getElementById("totalAmount").textContent = totalAmount.toFixed(2);
		document.getElementById("totalInput").value = totalAmount.toFixed(2);
		document.getElementById("durationInput").value = totalDuration;
	}

	// Fetches available time slots based on selected date and services
	function updateTimeSlots() {
		const dateInput = document.getElementById("bookingDate");
		const timeSlotSelect = document.getElementById("timeSlot");
		const bookNowBtn = document.getElementById("bookNowBtn");

		if (!dateInput.value || selectedServices.length === 0) {
			timeSlotSelect.innerHTML =
				'<option value="">Select a date and services first</option>';
			timeSlotSelect.disabled = true;
			bookNowBtn.disabled = true;
			return;
		}

		timeSlotSelect.innerHTML =
			'<option value="">Loading available slots...</option>';
		timeSlotSelect.disabled = true;

		const spaId = document.getElementById("bookingWidget").dataset.spaId;
		const cacheBuster = new Date().getTime(); // Prevent caching

		// Fetch available slots from API
		fetch(
			`/api/spa/${spaId}/availability?date=${dateInput.value}&_=${cacheBuster}`
		)
			.then((response) => {
				if (!response.ok) throw new Error("Network response was not ok");
				return response.json();
			})
			.then((data) => {
				if (data.available_slots && data.available_slots.length > 0) {
					// Populate time slot dropdown
					timeSlotSelect.innerHTML =
						'<option value="">Select a time slot</option>' +
						data.available_slots
							.map(
								(slot) => `<option value="${slot.start}">
                                  ${formatTimeDisplay(
																		slot.start
																	)} - ${formatTimeDisplay(slot.end)}
                                </option>`
							)
							.join("");
					timeSlotSelect.disabled = false;

					timeSlotSelect.addEventListener("change", function () {
						document.getElementById("dateInput").value = dateInput.value;
						document.getElementById("timeInput").value = this.value;
						bookNowBtn.disabled = !this.value;
					});
				} else {
					// Handle cases with no availability or spa closed
					let message = "No available time slots for this date";
					if (data.message && data.message.includes("closed"))
						message = "Spa is closed on this day";
					else if (data.message && data.message.includes("No availability"))
						message = "No availability set for this day";
					else if (data.message) message = data.message;

					timeSlotSelect.innerHTML = `<option value="">${message}</option>`;
					timeSlotSelect.disabled = true;
					bookNowBtn.disabled = true;
				}
			})
			.catch((error) => {
				console.error("Error fetching time slots:", error);
				timeSlotSelect.innerHTML =
					'<option value="">Error loading slots. Please refresh the page.</option>';
				timeSlotSelect.disabled = true;
				bookNowBtn.disabled = true;
			});
	}

	// Formats time from 24-hour to 12-hour AM/PM format
	function formatTimeDisplay(time) {
		const [hours, minutes] = time.split(":").map(Number);
		const displayHour = hours > 12 ? hours - 12 : hours;
		const ampm = hours >= 12 ? "PM" : "AM";
		return `${displayHour}:${minutes.toString().padStart(2, "0")} ${ampm}`;
	}

	// Handle booking form submission
	document
		.getElementById("bookingForm")
		.addEventListener("submit", function (e) {
			e.preventDefault();

			const customerName = document.getElementById("customerName").value.trim();
			const customerPhone = document
				.getElementById("customerPhone")
				.value.trim();
			const customerNotes = document
				.getElementById("customerNotes")
				.value.trim();
			const selectedDate = document.getElementById("bookingDate").value;
			const selectedTime = document.getElementById("timeSlot").value;

			if (!validateBookingForm()) return;

			// Populate inputs with booking details for form submission
			document.getElementById("servicesInput").value =
				JSON.stringify(selectedServices);
			document.getElementById("totalInput").value = totalAmount.toFixed(2);
			document.getElementById("dateInput").value = selectedDate;
			document.getElementById("timeInput").value = selectedTime;
			document.getElementById("durationInput").value = totalDuration;

			this.submit();
		});

	// Validate booking form before submission
	function validateBookingForm() {
		const name = document.getElementById("customerName").value.trim();
		const phone = document.getElementById("customerPhone").value.trim();
		const date = document.getElementById("bookingDate").value;
		const time = document.getElementById("timeSlot").value;

		if (!name || !phone || !date || !time || selectedServices.length === 0) {
			alert(
				"Please fill in all required fields, select services, and choose a time slot"
			);
			return false;
		}

		if (!/^[\d\s\+\-\(\)]{7,}$/.test(phone)) {
			alert("Please enter a valid phone number");
			return false;
		}

		return true;
	}
});
