// Handle profile image preview and removal before saving the form

function previewProfileImage(input) {
	// ensures the user actually picked an image
	if (input.files && input.files[0]) {
		const reader = new FileReader(); // browser API that can convert files into base64 strings, making them usable in <img> tags
		reader.onload = function (e) {
			document.getElementById("profileImagePreview").src = e.target.result; // #profileImagePreview gets updated immediately with the uploaded file
		};
		reader.readAsDataURL(input.files[0]); // converts the image file into a data URL so that browsers can display
	}
}

function removeProfileImage() {
	// Removing current profile picture
	const preview = document.getElementById("profileImagePreview");
	preview.src = "/static/img/default_spa.jpg"; // Resetting profile picture replaces it with the default fallback image
	preview.dataset.isRemoved = "true"; // mark it as removed
	document.getElementById("removeProfileImageFlag").value = "true"; // mark for backend removal
	document.getElementById("profileImageUpload").value = ""; // if the user had chosen a new file but clicked remove, it won’t accidentally upload
}
