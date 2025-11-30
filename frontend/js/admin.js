import { fetchAPI, uploadFile } from "./utils/api.js";
import { showError, showSuccess, formatDate } from "./utils/auth.js";

let isLoggedIn = false;
let currentTab = "posts";

document.addEventListener("DOMContentLoaded", () => {
    setupLoginForm();
    setupTabs();
    setupPostCreation();
    setupPrivacyToggle();
});

function setupLoginForm() {
    const form = document.getElementById("loginForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const password = document.getElementById("adminPassword").value;

        try {
            await fetchAPI("/auth/admin/login", {
                method: "POST",
                body: JSON.stringify({ password }),
            });

            isLoggedIn = true;
            document.getElementById("loginSection").classList.add("hidden");
            document.getElementById("adminSection").classList.remove("hidden");

            loadAdminData();
        } catch (error) {
            showError("Invalid password", "loginError");
        }
    });
}

function setupTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");

    tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const tabName = btn.dataset.tab;

            tabBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            document.querySelectorAll(".tab-content").forEach((content) => {
                content.classList.remove("active");
            });
            document.getElementById(`${tabName}Tab`).classList.add("active");

            currentTab = tabName;
            loadTabData(tabName);
        });
    });
}

function setupPrivacyToggle() {
    const privacySelect = document.getElementById("setPrivacy");
    const privatePassGroup = document.getElementById("privatePassGroup");

    if (!privacySelect || !privatePassGroup) return;

    privacySelect.addEventListener("change", () => {
        if (privacySelect.value === "private") {
            privatePassGroup.classList.remove("hidden");
        } else {
            privatePassGroup.classList.add("hidden");
            document.getElementById("setPrivatePassword").value = "";
        }
    });
}

function setupPostCreation() {
    const typeBtns = document.querySelectorAll(".post-type-btn");
    const postForm = document.getElementById("createPostForm");

    typeBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const type = btn.dataset.type;

            typeBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            document.querySelectorAll(".post-form-fields").forEach((fields) => {
                fields.classList.remove("active");
            });
            document.getElementById(`${type}Fields`).classList.add("active");
        });
    });

    postForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const activeTypeBtn = document.querySelector(".post-type-btn.active");
        if (!activeTypeBtn) {
            showError("Please select a post type");
            return;
        }

        const type = activeTypeBtn.dataset.type;
        const formData = new FormData();
        formData.append("type", type);

        if (type === "status") {
            const content = document.getElementById("statusContent").value;
            formData.append("content", content);
        } else if (type === "longform") {
            const title = document.getElementById("longformTitle").value;
            const content = document.getElementById("longformContent").value;
            formData.append("title", title);
            formData.append("content", content);
        } else if (type === "image") {
            const title = document.getElementById("imageTitle").value;
            const content = document.getElementById("imageContent").value;
            const files = document.getElementById("imageFiles").files;

            if (files.length === 0) {
                showError("Please select at least one image");
                return;
            }

            formData.append("title", title);
            formData.append("content", content);

            for (let i = 0; i < files.length; i++) {
                formData.append("images", files[i]);
            }
        } else if (type === "link") {
            const linkTitle = document.getElementById("linkTitle").value;
            const linkUrl = document.getElementById("linkUrl").value;
            const linkDescription =
                document.getElementById("linkDescription").value;

            if (!linkUrl) {
                showError("Link URL is required");
                return;
            }

            formData.append("linkTitle", linkTitle);
            formData.append("linkUrl", linkUrl);
            formData.append("linkDescription", linkDescription);
        }

        try {
            const submitBtn = postForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = "Creating...";

            await uploadFile("/posts", formData);

            showSuccess("Post created successfully!");
            postForm.reset();
            typeBtns.forEach((b) => b.classList.remove("active"));
            document.querySelectorAll(".post-form-fields").forEach((fields) => {
                fields.classList.remove("active");
            });

            await loadPosts();

            submitBtn.disabled = false;
            submitBtn.textContent = "Create Post";
        } catch (error) {
            showError(error.message || "Failed to create post");
            const submitBtn = postForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = "Create Post";
        }
    });
}

async function loadAdminData() {
    await loadPosts();
}

async function loadTabData(tab) {
    switch (tab) {
        case "posts":
            await loadPosts();
            break;
        case "comments":
            await loadCommentsTab();
            break;
        case "profile":
            await loadProfileSettings();
            break;
        case "subscribers":
            await loadSubscribers();
            break;
        case "settings":
            await loadSettingsTab();
            break;
    }
}

async function loadPosts() {
    try {
        const posts = await fetchAPI("/posts");
        displayPostsList(posts);
    } catch (error) {
        showError("Failed to load posts");
    }
}

function displayPostsList(posts) {
    const container = document.getElementById("postsList");

    if (posts.length === 0) {
        container.innerHTML = `
      <div class="text-center" style="padding: 40px; color: var(--text-light);">
        <p>No posts yet</p>
      </div>
    `;
        return;
    }

    container.innerHTML = posts
        .map(
            (post) => `
    <div class="post-item">
      <div class="post-item-header">
        <div>
          <span class="post-type">${post.type}</span>
          ${post.title ? `<h3>${post.title}</h3>` : ""}
          <div class="post-date">${formatDate(post.created_at)}</div>
        </div>
        <div class="post-item-actions">
          <button class="btn btn-sm btn-danger" onclick="deletePost(${
              post.id
          })">Delete</button>
        </div>
      </div>
      ${
          post.content
              ? `<p>${post.content.substring(0, 150)}${
                    post.content.length > 150 ? "..." : ""
                }</p>`
              : ""
      }
    </div>
  `
        )
        .join("");
}

window.deletePost = async (id) => {
    if (!confirm("Are you sure you want to delete this post?")) {
        return;
    }

    try {
        await fetchAPI(`/posts/${id}`, {
            method: "DELETE",
        });

        showSuccess("Post deleted successfully!");
        await loadPosts();
    } catch (error) {
        showError("Failed to delete post");
    }
};

async function loadProfileSettings() {
    try {
        const profile = await fetchAPI("/profile");
        displayProfileSettings(profile);
    } catch (error) {
        showError("Failed to load profile settings");
    }
}

function displayProfileSettings(profile) {
    document.getElementById("editUsername").value = profile.username;
    document.getElementById("editBiography").value = profile.biography || "";
    document.getElementById("editPronouns").value = profile.pronouns || "";
    document.getElementById("editAge").value = profile.age || "";
    document.getElementById("editLocation").value = profile.location || "";

    const form = document.getElementById("profileSettingsForm");
    form.onsubmit = async (e) => {
        e.preventDefault();

        const data = {
            username: document.getElementById("editUsername").value,
            biography: document.getElementById("editBiography").value,
            pronouns: document.getElementById("editPronouns").value,
            age: document.getElementById("editAge").value,
            location: document.getElementById("editLocation").value,
        };

        try {
            await fetchAPI("/profile", {
                method: "PUT",
                body: JSON.stringify(data),
            });

            showSuccess("Profile updated successfully!");
        } catch (error) {
            showError("Failed to update profile");
        }
    };

    const pictureForm = document.getElementById("profilePictureForm");
    pictureForm.onsubmit = async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById("profilePictureInput");
        if (!fileInput.files || fileInput.files.length === 0) {
            showError("Please select a file");
            return;
        }

        const formData = new FormData();
        formData.append("profilePicture", fileInput.files[0]);

        try {
            await uploadFile("/profile/picture", formData);
            showSuccess("Profile picture updated!");
            fileInput.value = "";
        } catch (error) {
            showError("Failed to upload profile picture");
        }
    };
}

async function loadSubscribers() {
    try {
        const subscribers = await fetchAPI("/subscribers");
        displaySubscribers(subscribers);
    } catch (error) {
        showError("Failed to load subscribers");
    }
}

function displaySubscribers(subscribers) {
    const container = document.getElementById("subscribersList");

    if (subscribers.length === 0) {
        container.innerHTML = `
      <div class="text-center" style="padding: 40px; color: var(--text-light);">
        <p>No subscribers yet</p>
      </div>
    `;
        return;
    }

    container.innerHTML = subscribers
        .map(
            (sub) => `
    <div class="subscriber-item">
      <div class="subscriber-item-info">
        <div><strong>${sub.email}</strong></div>
        <div style="font-size: 12px; color: var(--text-light);">
          Subscribed: ${formatDate(sub.subscribed_at)}
        </div>
      </div>
      <div class="subscriber-item-actions">
        <span class="subscriber-status ${
            sub.is_active ? "active" : "inactive"
        }">
          ${sub.is_active ? "Active" : "Inactive"}
        </span>
        ${
            sub.is_active
                ? `<button class="btn btn-sm btn-danger" onclick="unsubscribeUser('${sub.email}')">Unsubscribe</button>`
                : ""
        }
      </div>
    </div>
  `
        )
        .join("");
}

window.unsubscribeUser = async (email) => {
    if (
        !confirm(
            `Are you sure you want to unsubscribe ${email} from notifications?`
        )
    ) {
        return;
    }

    try {
        await fetchAPI("/subscribers/unsubscribe-user", {
            method: "POST",
            body: JSON.stringify({ email }),
        });

        showSuccess("User unsubscribed successfully!");
        await loadSubscribers();
    } catch (error) {
        showError("Failed to unsubscribe user");
    }
};

async function loadSettingsTab() {
    try {
        const data = await fetchAPI("/settings");

        if (data.profile) {
            document.getElementById("setUsername").value =
                data.profile.username || "";
            document.getElementById("setBio").value =
                data.profile.biography || "";
            document.getElementById("setPronouns").value =
                data.profile.pronouns || "";
            document.getElementById("setAge").value = data.profile.age || "";
            document.getElementById("setLocation").value =
                data.profile.location || "";
            document.getElementById("setPrivacy").value =
                data.profile.privacy_mode || "public";

            const privatePassGroup =
                document.getElementById("privatePassGroup");
            if (data.profile.privacy_mode === "private") {
                privatePassGroup.classList.remove("hidden");
            } else {
                privatePassGroup.classList.add("hidden");
            }
        }

        if (data.mail) {
            document.getElementById("smtpHost").value =
                data.mail.smtp_host || "";
            document.getElementById("smtpPort").value =
                data.mail.smtp_port || 587;
            document.getElementById("smtpSecure").checked =
                data.mail.smtp_secure === 1;
            document.getElementById("smtpUser").value =
                data.mail.smtp_user || "";
            document.getElementById("fromEmail").value =
                data.mail.from_email || "";
            document.getElementById("fromName").value =
                data.mail.from_name || "";
        }
    } catch (error) {
        showError("Failed to load settings");
    }
}

async function saveSettings() {
    const data = {
        username: document.getElementById("setUsername").value,
        biography: document.getElementById("setBio").value,
        pronouns: document.getElementById("setPronouns").value,
        age: document.getElementById("setAge").value,
        location: document.getElementById("setLocation").value,
        privacy_mode: document.getElementById("setPrivacy").value,
        private_password: document.getElementById("setPrivatePassword").value,
        smtp_host: document.getElementById("smtpHost").value,
        smtp_port: document.getElementById("smtpPort").value,
        smtp_secure: document.getElementById("smtpSecure").checked,
        smtp_user: document.getElementById("smtpUser").value,
        smtp_pass: document.getElementById("smtpPass").value,
        from_email: document.getElementById("fromEmail").value,
        from_name: document.getElementById("fromName").value,
    };

    try {
        await fetchAPI("/settings", {
            method: "POST",
            body: JSON.stringify(data),
        });
        showSuccess("Settings updated successfully");

        document.getElementById("setPrivatePassword").value = "";
        document.getElementById("smtpPass").value = "";
    } catch (err) {
        showError(err.message || "Failed to update settings");
    }
}

document
    .getElementById("saveSettingsButton")
    ?.addEventListener("click", saveSettings);

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    try {
        await fetchAPI("/auth/admin/logout", {
            method: "POST",
        });

        window.location.href = "/";
    } catch (error) {
        showError("Failed to logout");
    }
});

async function loadCommentsTab() {
    try {
        const comments = await fetchAPI("/comments");
        const container = document.getElementById("commentsList");

        container.innerHTML = comments
            .map(
                (c) => `
        <div class="comment-item">
          <div>
            <strong>${escapeHtml(c.name)}</strong>
            <p>${escapeHtml(c.content)}</p>
            <small>${formatDate(c.created_at)} on ${escapeHtml(
                    c.post_title || "Post"
                )}</small>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteComment(${
              c.id
          })">
            Delete
          </button>
        </div>`
            )
            .join("");
    } catch (err) {
        console.log(err);
        showError("Failed to load comments");
    }
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

window.deleteComment = async (id) => {
    if (!confirm("Delete this comment?")) return;
    await fetchAPI(`/comments/${id}`, { method: "DELETE" });
    showSuccess("Comment deleted");
    loadCommentsTab();
};
