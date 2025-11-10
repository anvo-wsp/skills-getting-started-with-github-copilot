document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activity = name;
        activityCard.dataset.max = details.max_participants;

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <h5 class="participants-title">Participants</h5>
        `;

        // Participants list or empty state
        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants no-bullets";
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            // Use a span for the email so the delete icon can be styled separately
            const emailSpan = document.createElement("span");
            emailSpan.textContent = email;
            li.appendChild(emailSpan);
            const deleteIcon = document.createElement("span");
            deleteIcon.textContent = "🗑️";
            deleteIcon.title = "Unregister participant";
            deleteIcon.style.cursor = "pointer";
            deleteIcon.style.marginLeft = "8px";
            deleteIcon.onclick = () => unregisterParticipant(name, email);
            li.appendChild(deleteIcon);
            ul.appendChild(li);
          });
          activityCard.appendChild(ul);
        } else {
          const p = document.createElement("p");
          p.className = "participants-empty";
          p.textContent = "No participants yet.";
          activityCard.appendChild(p);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Update the corresponding activity card: add participant + update availability
        const cards = document.querySelectorAll(".activity-card");
        cards.forEach((card) => {
          if (card.dataset.activity === activity) {
            // ensure participants list exists
            let ul = card.querySelector(".participants");
            if (!ul) {
              const empty = card.querySelector(".participants-empty");
              if (empty) empty.remove();
              ul = document.createElement("ul");
              ul.className = "participants no-bullets";
              card.appendChild(ul);
            }
            const li = document.createElement("li");
            const emailSpan = document.createElement("span");
            emailSpan.textContent = email;
            li.appendChild(emailSpan);
            const deleteIcon = document.createElement("span");
            deleteIcon.textContent = "🗑️";
            deleteIcon.title = "Unregister participant";
            deleteIcon.style.cursor = "pointer";
            deleteIcon.style.marginLeft = "8px";
            deleteIcon.onclick = () => unregisterParticipant(activity, email);
            li.appendChild(deleteIcon);
            ul.appendChild(li);

            // Recalculate availability using data-max and current participants count
            const max = parseInt(card.dataset.max, 10) || 0;
            const current = card.querySelectorAll(".participants li").length;
            const avail = card.querySelector(".availability");
            if (avail) {
              const spots = Math.max(0, max - current);
              avail.innerHTML = `<strong>Availability:</strong> ${spots} spots left`;
            }
          }
        });
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Function to unregister a participant
  async function unregisterParticipant(activityName, participantEmail) {
    try {
      const response = await fetch(`/activities/${activityName}/participants/${participantEmail}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        messageDiv.textContent = `${participantEmail} has been unregistered from ${activityName}.`;
        fetchActivities(); // Refresh the activities list
      } else {
        messageDiv.textContent = 'Failed to unregister participant.';
      }
    } catch (error) {
      console.error('Error:', error);
      messageDiv.textContent = 'An error occurred while unregistering the participant.';
    }
  }

  // Initialize app
  fetchActivities();
});
