document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const signupContainer = document.getElementById("signup-container");
  const staffStatus = document.getElementById("staff-status");
  const staffLoginButton = document.getElementById("staff-login-button");
  const staffLogoutButton = document.getElementById("staff-logout-button");
  const staffLoginDialog = document.getElementById("staff-login-dialog");
  const staffLoginForm = document.getElementById("staff-login-form");
  const staffLoginMessage = document.getElementById("staff-login-message");
  let isStaff = false;

  function updateStaffControls(session) {
    isStaff = session.authenticated;
    signupContainer.classList.toggle("hidden", !isStaff);
    staffLoginButton.classList.toggle("hidden", isStaff || !session.configured);
    staffLogoutButton.classList.toggle("hidden", !isStaff);
    staffStatus.textContent = isStaff
      ? `Signed in as ${session.username}`
      : session.configured
        ? "Staff access only"
        : "No staff accounts configured";
  }

  async function refreshSession() {
    const response = await fetch("/session");
    if (!response.ok) {
      throw new Error("Unable to check staff session");
    }
    updateStaffControls(await response.json());
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) => `<li><span class="participant-email">${email}</span>${
                      isStaff
                        ? `<button class="delete-btn" data-activity="${name}" data-email="${email}" aria-label="Remove ${email} from ${name}">Remove</button>`
                        : ""
                    }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  staffLoginButton.addEventListener("click", () => {
    staffLoginMessage.textContent = "";
    staffLoginMessage.className = "hidden";
    staffLoginForm.reset();
    staffLoginDialog.showModal();
  });

  document.getElementById("staff-login-cancel").addEventListener("click", () => {
    staffLoginDialog.close();
  });

  staffLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(staffLoginForm);

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Unable to sign in");
      }

      staffLoginDialog.close();
      await refreshSession();
      await fetchActivities();
    } catch (error) {
      staffLoginMessage.textContent = error.message;
      staffLoginMessage.className = "error";
    }
  });

  staffLogoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Unable to log out");
      }
      signupForm.reset();
      await refreshSession();
      await fetchActivities();
    } catch (error) {
      messageDiv.textContent = error.message;
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });

  // Initialize app
  refreshSession()
    .catch((error) => {
      console.error("Error checking staff session:", error);
      updateStaffControls({ authenticated: false, configured: false });
    })
    .finally(fetchActivities);
});
