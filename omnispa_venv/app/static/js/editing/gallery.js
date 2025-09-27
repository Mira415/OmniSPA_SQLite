// Managing the spa’s photo gallery in the form

function handleGalleryUpload(files) {
	if (!files || files.length === 0) return; // If no files selected, just exit

	const existingCount = document.querySelectorAll(
		// Counts how many images are in gallery, ignoring those flagged for deletion
		"#galleryContainer .col:not(.marked-for-deletion)"
	).length;
	if (existingCount + files.length > 20) {
		// Enforces a max limit of 20 images in total
		alert("You can only upload up to 20 images total");
		return;
	}

	Array.from(files).forEach((file) => {
		if (!file.type.match("image.*")) {
			// Only allows image MIME types (jpg, png, gif, etc.)
			alert(`${file.name} is not an image file`);
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			// Rejects images larger than 5 MB
			alert(`${file.name} is too large (max 5MB)`);
			return;
		}

		const reader = new FileReader(); // lets you preview the image instantly in the browser, without needing to upload to the server yet
		reader.onload = function (e) {
			const galleryContainer = document.getElementById("galleryContainer");
			const newImage = document.createElement("div");
			newImage.className = "col";
			newImage.innerHTML = `
                <figure class="figure position-relative">
                    <img src="${e.target.result}" 
                         class="figure-img img-fluid rounded instagram-style" 
                         style="border: 3px solid palevioletred">
                    <button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                            onclick="removeGalleryImage(this)">
                        <i class="bi bi-trash"></i>
                    </button>
                    <figcaption class="figure-caption text-center">
                        <input type="text" 
                               class="form-control form-control-sm" 
                               name="gallery_captions"
                               placeholder="Add caption...">
                    </figcaption>
                </figure>
            `;
			galleryContainer.appendChild(newImage);
		};
		reader.readAsDataURL(file);
	});
}

function removeGalleryImage(button, imageId = null) {
	// Removing images from the gallery
	if (imageId) {
		// if image is found by id, don’t delete it immediately from DOM...
		const col = button.closest(".col");
		col.classList.add("marked-for-deletion"); // Instead mark it for deletion, to be deleted when form is submitted
		col.style.opacity = "0.5";
		button.disabled = true;

		const deleteInput = document.createElement("input");
		deleteInput.type = "hidden";
		deleteInput.name = "delete_images";
		deleteInput.value = imageId;
		col.appendChild(deleteInput);
	} else {
		button.closest(".col").remove(); // If the image is only just uploaded (not saved yet) then remove it from DOM
	}
}
