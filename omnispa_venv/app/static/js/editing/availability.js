//Managing weekly availability on Edit page
function initializeTimeSlots() {
	document.querySelectorAll(".day--checkbox").forEach((checkbox) => {
		//Each day has a "Closed" checkbox
		checkbox.addEventListener("change", function () {
			const day = this.id.replace("Closed", "");
			const container = document.getElementById(`${day}SlotsContainer`);
			container.classList.toggle("d-none", this.checked);

			if (this.checked) {
				// If closed checkbox is checked then hide slot container and set badge to Closed
				updateDayBadge(day, 0, this.checked);
			} else {
				// If unchecked, show slots and update badge with slot count
				const slotCount = document
					.getElementById(`${day}SlotsList`)
					.querySelectorAll(".time-slot-entry").length;
				updateDayBadge(day, slotCount);
			}
		});
	});

	document.querySelectorAll(".add-slot-btn").forEach((btn) => {
		// Each day has an "Add slot" button to add/delete/edit time slots
		btn.addEventListener("click", function () {
			const day = this.dataset.day;
			addTimeSlot(day);
		});
	});

	document.querySelectorAll(".time-slots-list").forEach((container) => {
		container.addEventListener("click", function (e) {
			if (e.target.closest(".remove-slot")) {
				// Remove the slot for that day
				const slotEntry = e.target.closest(".time-slot-entry");
				const day = this.id.replace("SlotsList", "");
				slotEntry.remove();

				const slotCount = this.querySelectorAll(".time-slot-entry").length;
				updateDayBadge(day, slotCount); // Update badge with new count
			}
		});
	});
}

/*Updates the badge next to the day to reflect status:
Closed means red badge
No slots means grey badge
1+ slots means green badge with count */
function updateDayBadge(day, slotCount, isClosed = false) {
	const badge = document.getElementById(`${day}Badge`);
	if (badge) {
		if (isClosed) {
			badge.textContent = "Closed";
			badge.className = "badge bg-danger ms-2 day-badge";
		} else if (slotCount === 0) {
			badge.textContent = "Not set";
			badge.className = "badge bg-secondary ms-2 day-badge";
		} else {
			badge.textContent = `${slotCount} slot(s)`;
			badge.className = "badge bg-success ms-2 day-badge";
		}
	}
}
/*
Inserts a new slot input row (start + end + trash button)
Defaults are 09:00 to 10:00, after adding, updates badge with new count */
function addTimeSlot(day, startTime = "09:00", endTime = "10:00") {
	const slotsList = document.getElementById(`${day}SlotsList`);
	const slotHtml = `
        <div class="time-slot-entry mb-2">
            <div class="row g-2">
                <div class="col-5">
                    <label class="form-label small">Start Time</label>
                    <input type="time" class="form-control form-control-sm slot-start" 
                           value="${startTime}" required>
                </div>
                <div class="col-5">
                    <label class="form-label small">End Time</label>
                    <input type="time" class="form-control form-control-sm slot-end" 
                           value="${endTime}" required>
                </div>
                <div class="col-2 d-flex align-items-end">
                    <button type="button" class="btn btn-danger btn-sm remove-slot">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
	slotsList.insertAdjacentHTML("beforeend", slotHtml);

	const slotCount = slotsList.querySelectorAll(".time-slot-entry").length;
	updateDayBadge(day, slotCount);
}
// Gathers all days’ availability into an object
function collectTimeSlotsData() {
	const availabilityData = {};

	[
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday",
		"saturday",
		"sunday",
	].forEach((day) => {
		const isClosed = document.getElementById(`${day}Closed`).checked;
		const slots = [];

		if (!isClosed) {
			const slotEntries = document.querySelectorAll(
				`#${day}SlotsList .time-slot-entry`
			);
			slotEntries.forEach((entry) => {
				const start = entry.querySelector(".slot-start").value;
				const end = entry.querySelector(".slot-end").value;

				if (start && end) {
					slots.push({ start, end });
				}
			});
		}

		availabilityData[day] = {
			closed: isClosed,
			slots: slots,
		};
	});

	return availabilityData;
}
