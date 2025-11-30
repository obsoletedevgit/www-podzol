import { fetchAPI } from "./utils/api.js";
import { showError, showSuccess, formatDate } from "./utils/auth.js";

let currentProfile = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadProfile();
    await loadPosts();
    setupSubscribeForm();
});

async function loadProfile() {
    try {
        currentProfile = await fetchAPI("/profile");
        displayProfile(currentProfile);
    } catch (error) {
        if (
            error.message.includes("Access denied") ||
            error.message.includes("requiresPassword")
        ) {
            showPrivateAccessModal();
        } else {
            showError("Failed to load profile");
        }
    }
}

function displayProfile(profile) {
    document.getElementById("profileName").textContent = profile.username;

    const metaParts = [];
    if (profile.pronouns) metaParts.push(profile.pronouns);
    if (profile.age) metaParts.push(`${profile.age} years old`);
    if (profile.location) metaParts.push(profile.location);

    const metaElement = document.getElementById("profileMeta");
    if (metaParts.length > 0) {
        metaElement.textContent = metaParts.join(" • ");
    } else {
        metaElement.style.display = "none";
    }

    document.getElementById("profileBio").textContent = profile.biography || "";

    const profilePicture = document.getElementById("profilePicture");
    if (profile.profile_picture) {
        profilePicture.src = profile.profile_picture;
        profilePicture.onerror = function () {
            this.src = createDefaultAvatar(profile.username);
        };
    } else {
        profilePicture.src = createDefaultAvatar(profile.username);
    }

    document.title = `${profile.username} - Podzol`;
}

function createDefaultAvatar(username) {
    const initial = username ? username.charAt(0).toUpperCase() : "?";
    const colors = ["#2d5016", "#4a7c2a", "#8b4513", "#556b2f", "#6b8e23"];
    const color = colors[username.length % colors.length];

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="60" fill="${color}"/>
      <text x="60" y="75" font-size="48" fill="white" 
            text-anchor="middle" font-family="sans-serif" 
            font-weight="bold">${initial}</text>
    </svg>
  `;

    return "data:image/svg+xml;base64," + btoa(svg);
}

async function loadPosts() {
    try {
        const posts = await fetchAPI("/posts");
        console.log("Loaded posts:", posts);
        displayPosts(posts);
    } catch (error) {
        console.error("Failed to load posts:", error);
        const container = document.getElementById("postsContainer");
        container.innerHTML = `
      <div class="text-center" style="padding: 40px; color: var(--text-light);">
        <p>Unable to load posts</p>
      </div>
    `;
    }
}

function displayPosts(posts) {
    const container = document.getElementById("postsContainer");

    if (!posts || posts.length === 0) {
        container.innerHTML = `
      <div class="text-center" style="padding: 40px; color: var(--text-light);">
        <p>No posts yet</p>
      </div>
    `;
        return;
    }

    container.innerHTML = posts
        .map((post) => {
            const content = post.content ? String(post.content) : "";
            const title = post.title ? String(post.title) : "";

            return `
        <div class="post">
          <div class="post-header">
            <span class="post-type">${post.type}</span>
            ${title ? `<h2 class="post-title">${escapeHtml(title)}</h2>` : ""}
            <div class="post-date">${formatDate(post.created_at)}</div>
          </div>
          ${
              content
                  ? `<div class="post-content">${escapeHtml(content)}</div>`
                  : ""
          }
          ${displayPostImages(post.images)}
          ${displayPostLink(post)}
        </div>
      `;
        })
        .join("");

    enableLightbox();
}

function displayPostImages(images) {
    if (!images || images.length === 0) return "";

    return `
    <div class="post-images">
      ${images
          .map(
              (img) => `
        <img src="${img}" alt="Post image" class="post-image" 
             onerror="this.style.display='none'">
      `
          )
          .join("")}
    </div>
  `;
}

function displayPostLink(post) {
    if (post.type !== "link" || !post.link_url) return "";

    return `
    <div class="post-link" style="margin-top: 15px; padding: 15px; 
         background: var(--bg); border-radius: 8px;">
      <a href="${escapeHtml(post.link_url)}" target="_blank" 
         rel="noopener noreferrer" 
         style="color: var(--primary); text-decoration: none;">
        <strong>${escapeHtml(post.link_title || post.link_url)}</strong>
      </a>
      ${
          post.link_description
              ? `
        <p style="margin-top: 5px; color: var(--text-light); font-size: 14px;">
          ${escapeHtml(post.link_description)}
        </p>
      `
              : ""
      }
    </div>
  `;
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

function setupSubscribeForm() {
    const form = document.getElementById("subscribeForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("subscribeEmail").value;

        try {
            await fetchAPI("/subscribe", {
                method: "POST",
                body: JSON.stringify({ email }),
            });

            showSuccess("Successfully subscribed to updates!");
            form.reset();
        } catch (error) {
            showError(error.message || "Failed to subscribe");
        }
    });
}

function showPrivateAccessModal() {
    const modal = document.getElementById("privateAccessModal");
    const form = document.getElementById("privateAccessForm");

    modal.classList.add("active");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const password = document.getElementById("privatePassword").value;

        try {
            await fetchAPI("/auth/private/verify", {
                method: "POST",
                body: JSON.stringify({ password }),
            });

            modal.classList.remove("active");
            await loadProfile();
            await loadPosts();
        } catch (error) {
            showError("Invalid password", "privateAccessError");
        }
    });
}

function enableLightbox() {
    const modal = document.getElementById("lightboxModal");
    const img = document.getElementById("lightboxImage");

    document.querySelectorAll(".post-image").forEach((thumb) => {
        thumb.addEventListener("click", () => {
            img.src = thumb.src;
            modal.classList.add("active");
        });
    });

    modal.addEventListener("click", () => {
        modal.classList.remove("active");
        img.src = "";
    });
}
