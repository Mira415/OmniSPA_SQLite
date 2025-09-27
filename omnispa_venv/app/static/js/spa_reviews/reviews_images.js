// Stores the currently selected images
let selectedImages = [];

// Sets up the preview of uploaded images
function setupImagePreview() {
	const imageInput = document.getElementById("reviewImages"); // File input element
	const previewContainer = document.getElementById("imagePreview"); // Container where previews will be shown

	// Make sure both input and container exist before attaching logic
	if (imageInput && previewContainer) {
		imageInput.addEventListener("change", function (e) {
			// Clear old previews
			previewContainer.innerHTML = "";

			// Save the selected files into our global array
			selectedImages = Array.from(e.target.files);

			if (selectedImages.length > 0) {
				// Show the preview container if images exist
				previewContainer.style.display = "flex";

				// Loop through each selected file
				selectedImages.forEach((file, index) => {
					// Only handle image files
					if (file.type.startsWith("image/")) {
						const reader = new FileReader();

						// Once file is read, create a preview box
						reader.onload = function (e) {
							const preview = document.createElement("div");
							preview.className = "image-preview-item position-relative";

							// Show the image + a remove button
							preview.innerHTML = `
                                <img src="${e.target.result}" class="img-thumbnail" style="width: 100px; height: 100px; object-fit: cover">
                                <button type="button" class="btn-remove-image btn btn-sm btn-danger position-absolute top-0 end-0" data-index="${index}">
                                    <i class="bi bi-x"></i>
                                </button>
                            `;

							// Add the preview box to the container
							previewContainer.appendChild(preview);

							// Show the "remove" button so users can delete an image from selection
							preview
								.querySelector(".btn-remove-image")
								.addEventListener("click", function () {
									const index = parseInt(this.getAttribute("data-index"));
									removeImage(index);
								});
						};

						// Convert file into a base64 URL to show in <img>
						reader.readAsDataURL(file);
					}
				});
			} else {
				// Hide preview container if no files selected
				previewContainer.style.display = "none";
			}
		});
	}
}

// Removes an image from the selection and updates the preview
function removeImage(index) {
	// Remove from the array
	selectedImages.splice(index, 1);

	// Update the file input to reflect the new selection
	const dataTransfer = new DataTransfer();
	selectedImages.forEach((file) => dataTransfer.items.add(file));
	document.getElementById("reviewImages").files = dataTransfer.files;

	// Trigger "change" again to refresh the preview
	document.getElementById("reviewImages").dispatchEvent(new Event("change"));
}

// Clears all selected images (reset everything)
function clearSelectedImages() {
	selectedImages = []; // Empty the array
	document.getElementById("reviewImages").value = ""; // Reset the input
	document.getElementById("imagePreview").style.display = "none"; // Hide container
	document.getElementById("imagePreview").innerHTML = ""; // Remove previews
}
