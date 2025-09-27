// registration-availability.js
// Letting a spa owner set their weekly availability with time slots during registration
function initTimeSelectors() {
	const startSelect = document.getElementById("startTime"); // Gets the start and end times
	const endSelect = document.getElementById("endTime");

	for (let hour = 6; hour < 22; hour++) {
		// Adds options for startTime and endTime
		for (let minute = 0; minute < 60; minute += 30) {
			// time goes up by 30 mins
			// Creates the value that will be stored in the <option> element
			const timeValue = `${hour.toString().padStart(2, "0")}:${minute
				.toString()
				.padStart(2, "0")}`; // eg. hour = 6, minute = 0 to "06:00" and hour = 6, minute = 30 to "06:30"
			// Converts the 24-hour time to 12-hour format with AM/PM for human-friendly display
			const displayHour = hour > 12 ? hour - 12 : hour;
			const ampm = hour >= 12 ? "PM" : "AM";
			const displayText = `${displayHour}:${minute
				.toString()
				.padStart(2, "0")} ${ampm}`;
			// Creates a new <option> for both the start and end <select> dropdowns
			startSelect.add(new Option(displayText, timeValue));
			endSelect.add(new Option(displayText, timeValue));
		}
	}
	// When a start time is selected, it automatically sets the end time to 1 hour later
	startSelect.addEventListener("change", function () {
		const startTime = this.value;
		if (startTime) {
			const [hours, minutes] = startTime.split(":").map(Number);
			let endHours = hours + 1;
			if (endHours >= 22) {
				endHours = 21;
				minutes = 30; // final time at 9:30 PM
			}
			// ensures two digits (e.g., 6 to "06") and sets the <select> element’s selected option automatically
			endSelect.value = `${endHours.toString().padStart(2, "0")}:${minutes
				.toString()
				.padStart(2, "0")}`;
		}
	});
	// Toggles visibility of the time slots if a day is marked as closed
	document
		.getElementById("dayClosedToggle")
		.addEventListener("change", function () {
			document.getElementById("timeSlotsContainer").style.display = this.checked
				? "none"
				: "block";
		});
	/*When switching between weekdays (Mon–Sun):
	Loads whether that day is closed.
	Shows/hides time slots.
	Displays the current slots for that day. */
	document
		.getElementById("daySelector")
		.addEventListener("change", function () {
			const day = this.value;
			document.getElementById("dayClosedToggle").checked =
				weeklyAvailability[day].closed;
			document.getElementById("timeSlotsContainer").style.display =
				weeklyAvailability[day].closed ? "none" : "block";
			displayCurrentSlots(day);
		});
}

function addTimeSlot() {
	// Gets the selected day and start/end times from form inputs
	const day = document.getElementById("daySelector").value;
	const startTime = document.getElementById("startTime").value;
	const endTime = document.getElementById("endTime").value;

	if (!startTime || !endTime) {
		// If either time is missing then show an error.
		showAlert("Please select both start and end times", "danger");
		return;
	}

	if (startTime >= endTime) {
		// If startTime >= endTime then show an error
		showAlert("End time must be after start time", "danger");
		return;
	}
	// If valid, it pushes the slot into weeklyAvailability[day].slots
	weeklyAvailability[day].slots.push({ start: startTime, end: endTime });
	displayCurrentSlots(day); // calls displayCurrentSlots(day) to update the UI
}

function quickAddSlot(start, end) {
	// quickly add a startTime and endTime input without manually selecting times
	document.getElementById("startTime").value = start;
	document.getElementById("endTime").value = end;
	addTimeSlot();
}

function displayCurrentSlots(day) {
	// Shows the list of existing slots for a given day
	const container = document.getElementById("currentSlots");
	const slots = weeklyAvailability[day].slots;

	container.innerHTML =
		slots.length === 0 // If no slots inside weeklyAvailability[day].slots
			? '<div class="alert alert-light mb-0">No time slots added yet</div>' // displays "No time slots added yet"
			: slots // Otherwise then loops through each slot and creates a small "badge" element
					.map(
						(slot, index) => `
            <div class="badge bg-light text-dark p-2 d-flex align-items-center mb-2">
                ${formatTimeDisplay(slot.start)} - ${formatTimeDisplay(
							slot.end
						)}
                <button onclick="removeSlot('${day}', ${index})" class="btn btn-sm ms-2 p-0">
                    &times;
                </button>
            </div>
        ` // Each slot gets a remove button that calls removeSlot(day, index)
					)
					.join("");
}

function removeSlot(day, index) {
	// Removes a slot from the array by its index
	weeklyAvailability[day].slots.splice(index, 1);
	displayCurrentSlots(day); // Refreshes the slot display by calling displayCurrentSlots(day)
}

function formatTimeDisplay(time) {
	const [hours, minutes] = time.split(":").map(Number); // Takes a time string like "13:05", splits it ["13", "05"] and converts into numbers
	const displayHour = hours > 12 ? hours - 12 : hours; // Converts 24-hour format into 12-hour format
	const ampm = hours >= 12 ? "PM" : "AM";
	return `${displayHour}:${minutes.toString().padStart(2, "0")} ${ampm}`; // Builds the final string and ensures two digits
}
