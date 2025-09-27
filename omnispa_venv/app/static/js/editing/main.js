// Spa profile edit page initializer

document.addEventListener("DOMContentLoaded", function () {
	/* If the <img> for profile preview exists and has a data-original-src attribute, use that as the initial image
	ensuring the correct profile photo is shown when page loads*/
	const profileImg = document.getElementById("profileImagePreview");
	if (profileImg && profileImg.dataset.originalSrc) {
		profileImg.src = profileImg.dataset.originalSrc;
	}

	initializeTimeSlots(); // sets up the time slot UI (e.g. "open from 9am–5pm")

	// Load availability data
	const availabilityDataElement = document.getElementById("availabilityData");
	let dayAvailability = [];

	if (availabilityDataElement) {
		try {
			dayAvailability = JSON.parse(
				availabilityDataElement.dataset.availability || "[]"
			);
		} catch (e) {
			console.error("Error parsing availability data:", e);
			dayAvailability = [];
		}
	}

	[
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday",
		"saturday",
		"sunday",
	].forEach((day) => {
		// Populate availability for each day
		const currentDayAvailability = dayAvailability.find((a) => a.day === day);
		const isClosedCheckbox = document.getElementById(`${day}Closed`);

		if (currentDayAvailability) {
			// Set checkbox state
			if (isClosedCheckbox) {
				isClosedCheckbox.checked = currentDayAvailability.is_closed || false;
				isClosedCheckbox.dispatchEvent(new Event("change")); // Triggers "change" so other UI reacts (e.g. disables slot inputs)
			}

			// Add time slots if not closed
			if (
				!currentDayAvailability.is_closed &&
				currentDayAvailability.time_slots
			) {
				const slotsList = document.getElementById(`${day}SlotsList`);
				// Clear existing demo slots
				slotsList.innerHTML = "";

				currentDayAvailability.time_slots.forEach((slot) => {
					addTimeSlot(day, slot.start, slot.end);
				});
			}
		} else if (isClosedCheckbox && !isClosedCheckbox.checked) {
			// Add default slot if no availability data and not closed
			addTimeSlot(day);
		}
	});

	// Event listeners
	// Changing profile photo
	document
		.getElementById("changePhotoBtn")
		.addEventListener("click", function () {
			document.getElementById("profileImageUpload").click();
		});
	// Preview profile picture
	document
		.getElementById("profileImageUpload")
		.addEventListener("change", function () {
			previewProfileImage(this);
		});
	// Delete or reset profile picture
	document
		.getElementById("removePhotoBtn")
		.addEventListener("click", function () {
			removeProfileImage();
		});
	// Opens file picker when gallery area is clicked
	document
		.getElementById("galleryUploadArea")
		.addEventListener("click", function () {
			document.getElementById("galleryUpload").click();
		});
	// Adds preview thumbnails for selected images
	document
		.getElementById("galleryUpload")
		.addEventListener("change", function () {
			handleGalleryUpload(this.files);
		});
	// Handles deleting gallery images, either from DOM or mark for backend deletion
	document
		.getElementById("galleryContainer")
		.addEventListener("click", function (e) {
			if (e.target.closest(".remove-gallery-image")) {
				const btn = e.target.closest(".remove-gallery-image");
				const imageId = btn.dataset.imageId || null;
				removeGalleryImage(btn, imageId);
			}
		});
	// Clicking Cancel navigates back to the spa’s profile page
	document.getElementById("cancelBtn").addEventListener("click", function () {
		window.location.href =
			"{{ url_for('profile.spa_profile', spa_id=spa.id) }}";
	});

	// Setup form submission
	setupFormSubmission();
});
