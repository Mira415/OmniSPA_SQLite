// Handling the Profile Edit Form submission

function setupFormSubmission() {
	document
		.getElementById("profileEditForm")
		.addEventListener("submit", function (e) {
			e.preventDefault();
			// Show "Saving…" state on button
			const submitBtn = e.target.querySelector('button[type="submit"]');
			const originalBtnText = submitBtn.innerHTML;
			submitBtn.innerHTML =
				'<i class="bi bi-arrow-repeat spinner"></i> Saving...';
			submitBtn.disabled = true;

			const availabilityData = collectTimeSlotsData();

			const formData = new FormData(this); // collects all input already in the form
			if (document.getElementById("profileImageUpload").files.length > 0) {
				formData.append("is_primary", "true"); // adds is_primary: true if a profile image is uploaded
			}
			// Append spa-specific fields to formData
			formData.append("availability", JSON.stringify(availabilityData));
			formData.append("spaName", document.getElementById("spaName").value);
			formData.append("spaEmail", document.getElementById("spaEmail").value);
			formData.append("spaPhone", document.getElementById("spaPhone").value);
			formData.append(
				"spaAddress",
				document.getElementById("spaAddress").value
			);
			formData.append("spaAbout", document.getElementById("spaAbout").value);
			formData.append(
				"weekdayOpen",
				document.getElementById("weekdayOpen").value
			);
			formData.append(
				"weekdayClose",
				document.getElementById("weekdayClose").value
			);
			formData.append(
				"weekendOpen",
				document.getElementById("weekendOpen").value
			);
			formData.append(
				"weekendClose",
				document.getElementById("weekendClose").value
			);

			const galleryItems = document.querySelectorAll("#galleryContainer .col");
			galleryItems.forEach((item, index) => {
				// Loops over gallery items
				if (item.classList.contains("marked-for-deletion")) return; // Skip deleted items

				const captionInput = item.querySelector(
					// Adds caption text to form data
					'input[name="gallery_captions"]'
				);
				if (captionInput) {
					formData.append(`gallery_captions`, captionInput.value);
				}
			});
			// Submits form
			fetch(window.location.href, {
				method: "POST",
				body: formData,
				headers: {
					"X-Requested-With": "XMLHttpRequest",
				},
			})
				// If the backend responds with a redirect, follow it
				.then((response) => {
					if (response.redirected) {
						window.location.href = response.url;
					} else if (response.ok) {
						// if it’s JSON: If success then redirect to new spa profile page
						return response.json();
					}
					throw new Error("Network response was not ok");
				})
				.then((data) => {
					// handles the JSON response
					if (data && data.success) {
						window.location.href = `/spa/${data.spa_id}`;
					} else if (data && data.error) {
						alert(data.error);
					}
				})
				.catch((error) => {
					console.error("Error:", error);
					return response.text().then((text) => {
						console.error("Response text:", text);
						alert("An error occurred while saving. Please try again.");
					});
				})
				.finally(() => {
					// Re-enables button after request finishes
					submitBtn.innerHTML = originalBtnText;
					submitBtn.disabled = false;
				});
		});
}
