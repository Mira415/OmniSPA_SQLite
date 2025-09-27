// registration-main.js
document.addEventListener("DOMContentLoaded", function () {
	document.getElementById("serviceDuration").value = 60; // Set default service duration

	initTimeSelectors(); // sets up start/end time pickers for weekly availability and
	initImageUpload(); // Sets up drag-and-drop, click-to-select files and vent listeners for previews and removal

	document
		.getElementById("spaRegistrationForm")
		.addEventListener("submit", handleFormSubmit);
});
