// registration-images.js
function initImageUpload() {
	// Set up event listeners for the drop zone and file input
	const dropZone = document.getElementById("imageDropZone");
	const fileInput = document.getElementById("spaImages");

	if (!dropZone || !fileInput) {
		// If dropzone or files are missing, it exits early
		return;
	}

	dropZone.addEventListener("click", () => fileInput.click()); // Clicking the drop zone simulates clicking the hidden file input

	dropZone.addEventListener("dragover", (e) => {
		e.preventDefault(); // Prevents the browser from opening the dragged file
		dropZone.classList.add("border-primary", "bg-light");
	});

	// dropZone.addEventListener("dragleave", () => {
	// 	dropZone.classList.remove("border-primary", "bg-light");
	// });

	dropZone.addEventListener("drop", (e) => {
		// Handles files dropped into the zone
		e.preventDefault();
		dropZone.classList.remove("border-primary", "bg-light");
		if (e.dataTransfer.files.length) {
			handleImageUpload(e.dataTransfer.files); // Passes dragged files to handleImageUpload()
		}
	});

	fileInput.addEventListener("change", (e) => {
		// Handles manual file selection
		if (e.target.files.length) {
			handleImageUpload(e.target.files); // Passes selected files to handleImageUpload()
		}
	});
}

function handleImageUpload(files) {
	// Validate and store uploaded images
	const MAX_SIZE = 5 * 1024 * 1024; // Restricts each image to 5 MB max
	const MAX_IMAGES = 20;

	const remainingSlots = MAX_IMAGES - uploadedImages.length;
	if (remainingSlots <= 0) {
		// Checks how many images can still be uploaded
		showAlert(`Maximum ${MAX_IMAGES} images allowed`, "danger");
		return; // Stops if the user already reached 20
	}
	// Converts FileList into an array and takes only the allowed number of files
	const filesToProcess = Array.from(files).slice(0, remainingSlots);

	let invalidFiles = []; // Arrays to track errors
	let oversizedFiles = [];

	filesToProcess.forEach((file) => {
		if (!file.type.match("image.*")) {
			// Rejects non-images file type
			invalidFiles.push(file.name);
			return;
		}

		if (file.size > MAX_SIZE) {
			// Rejects files > 5 MB
			oversizedFiles.push(file.name);
			return;
		}

		uploadedImages.push({
			// Pushes into uploadedImages the global array
			file: file,
			previewUrl: URL.createObjectURL(file), // previewing image without upload
		});
	});

	updateImagePreviews(); // Refreshes thumbnails
}

function updateImagePreviews() {
	// Render image thumbnails and counter
	const container = document.getElementById("imagePreviewContainer"); // Finds the preview container
	if (!container) return;

	container.innerHTML = uploadedImages // Loops through uploadedImages
		.map(
			// generates thumbnail <img>, and remove button (&times;)
			(image, index) => `
        <div class="position-relative" style="width: 100px; height: 100px;">
            <img src="${image.previewUrl}" 
                 class="img-thumbnail w-100 h-100 object-fit-cover">
            <button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 p-1" 
                    onclick="removeImage(${index})">
                &times;
            </button>
        </div>
        `
		)
		.join("");

	const counter = document.getElementById("imageCounter"); // Updates the image counter
	if (counter) {
		counter.textContent = `${uploadedImages.length}/20 images`;
	}
}

function removeImage(index) {
	// Delete an image in preview
	if (index >= 0 && index < uploadedImages.length) {
		URL.revokeObjectURL(uploadedImages[index].previewUrl); // Removes the image from array
		uploadedImages.splice(index, 1);
		updateImagePreviews(); // Refreshes previews
	}
}
