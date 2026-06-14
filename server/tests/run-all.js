require("dotenv").config();
const chalk = (() => {
  try {
    return require("chalk");
  } catch {
    return {
      green: (t) => `\x1b[32m${t}\x1b[0m`,
      red: (t) => `\x1b[31m${t}\x1b[0m`,
      yellow: (t) => `\x1b[33m${t}\x1b[0m`,
      cyan: (t) => `\x1b[36m${t}\x1b[0m`,
      gray: (t) => `\x1b[90m${t}\x1b[0m`,
      bold: (t) => `\x1b[1m${t}\x1b[0m`,
      blue: (t) => `\x1b[34m${t}\x1b[0m`,
    };
  }
})();

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000/api/v1";
const HEALTH_URL =
  (process.env.TEST_BASE_URL || "http://localhost:5000").replace(
    "/api/v1",
    "",
  ) + "/health";

/* ─── Test State ──────────────────────────────────────────────── */
const state = {
  tokens: { admin: null, user1: null, user2: null },
  users: {},
  posts: { text: null, image: null, video: null, link: null },
  comments: { main: null, reply: null },
  notice: null,
  notification: null,
  announcement: null,
};

const results = { passed: 0, failed: 0, skipped: 0, errors: [] };

/* ─── Utilities ───────────────────────────────────────────────── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const request = async (method, path, body = null, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const options = { method, headers };
  if (body && !(body instanceof FormData)) {
    options.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    delete headers["Content-Type"];
    options.body = body;
  }

  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { error: err.message } };
  }
};

const assert = (name, condition, details = "") => {
  if (condition) {
    results.passed++;
    console.log(`  ${chalk.green("✓")} ${name}`);
    return true;
  } else {
    results.failed++;
    results.errors.push({ name, details });
    console.log(`  ${chalk.red("✗")} ${name}`);
    if (details) console.log(`    ${chalk.gray(details)}`);
    return false;
  }
};

const skip = (name, reason) => {
  results.skipped++;
  console.log(`  ${chalk.yellow("⊘")} ${name} ${chalk.gray(`(${reason})`)}`);
};

const section = (title) => {
  console.log(
    "\n" +
      chalk.bold(chalk.cyan(`── ${title} ──────────────────────────────────`)),
  );
};

const subsection = (title) => {
  console.log(chalk.gray(`\n  ${title}`));
};

/* ─── Test Suites ─────────────────────────────────────────────── */

/* 1. HEALTH & INFRASTRUCTURE */
const testHealth = async () => {
  section("1. Health & Infrastructure");

  const health = await request("GET", HEALTH_URL.replace(BASE_URL, ""));
  // Fallback: try direct health URL
  const directHealth = await request("GET", HEALTH_URL);

  const h = health.ok ? health : directHealth;

  assert("Server is reachable", h.ok || h.status === 200);
  assert(
    "Health endpoint returns healthy",
    h.data?.status === "healthy",
    `Got: ${JSON.stringify(h.data)}`,
  );
};

/* 2. AUTHENTICATION */
const testAuth = async () => {
  section("2. Authentication");

  subsection("Login with seeded admin");
  const adminLogin = await request("POST", "/auth/login", {
    identifier: "admin@zimhub.ac.zw",
    password: "Admin@1234",
  });
  assert(
    "Admin login succeeds",
    adminLogin.ok,
    JSON.stringify(adminLogin.data),
  );
  assert(
    "Admin login returns access token",
    !!adminLogin.data?.data?.accessToken,
  );
  assert(
    "Admin login returns refresh token",
    !!adminLogin.data?.data?.refreshToken,
  );
  assert(
    "Admin user has admin role",
    adminLogin.data?.data?.user?.role === "admin",
  );

  if (adminLogin.ok) {
    state.tokens.admin = adminLogin.data.data.accessToken;
    state.users.admin = adminLogin.data.data.user;
  }

  subsection("Login with seeded student");
  const studentLogin = await request("POST", "/auth/login", {
    identifier: "tendai@uni.ac.zw",
    password: "Student@1234",
  });
  assert("Student login succeeds", studentLogin.ok);

  if (studentLogin.ok) {
    state.tokens.user1 = studentLogin.data.data.accessToken;
    state.users.user1 = studentLogin.data.data.user;
  }

  subsection("Login with username (not email)");
  const usernameLogin = await request("POST", "/auth/login", {
    identifier: "chidi_o",
    password: "Student@1234",
  });
  assert("Username login works", usernameLogin.ok);

  if (usernameLogin.ok) {
    state.tokens.user2 = usernameLogin.data.data.accessToken;
    state.users.user2 = usernameLogin.data.data.user;
  }

  subsection("Invalid login attempts");
  const wrongPass = await request("POST", "/auth/login", {
    identifier: "tendai@uni.ac.zw",
    password: "wrongpassword",
  });
  assert("Wrong password rejected", !wrongPass.ok && wrongPass.status === 401);

  const wrongUser = await request("POST", "/auth/login", {
    identifier: "nonexistent@user.com",
    password: "anything",
  });
  assert("Non-existent user rejected", !wrongUser.ok);

  subsection("Get current user");
  if (state.tokens.user1) {
    const me = await request("GET", "/auth/me", null, state.tokens.user1);
    assert("GET /auth/me works with token", me.ok);
    assert("Returns user with profile", !!me.data?.data?.profile);
    assert("Returns user stats", me.data?.data?.stats !== undefined);
  }

  subsection("Protected route without token");
  const noAuth = await request("GET", "/auth/me");
  assert(
    "Protected route rejects no token",
    !noAuth.ok && noAuth.status === 401,
  );

  subsection("Token refresh");
  if (state.tokens.user1) {
    // Note: We need the refresh token, login again to get a fresh pair
    const login = await request("POST", "/auth/login", {
      identifier: "tendai@uni.ac.zw",
      password: "Student@1234",
    });
    if (login.ok) {
      const refresh = await request("POST", "/auth/refresh", {
        refreshToken: login.data.data.refreshToken,
      });
      assert("Token refresh works", refresh.ok);
      assert("New tokens issued", !!refresh.data?.data?.accessToken);
    }
  }

  subsection("OTP registration request");
  const timestamp = Date.now();
  const otpRequest = await request("POST", "/auth/register/request", {
    fullName: "Test User",
    username: `testuser_${timestamp}`,
    email: `test_${timestamp}@example.com`,
    password: "TestPass@123",
    bio: "Test account",
  });
  assert(
    "OTP registration request succeeds",
    otpRequest.ok,
    `Status: ${otpRequest.status}, ${JSON.stringify(otpRequest.data)}`,
  );

  subsection("Duplicate email rejection");
  const dupEmail = await request("POST", "/auth/register/request", {
    fullName: "Duplicate User",
    username: `dup_email_${timestamp}`,
    email: "tendai@uni.ac.zw", // existing email
    password: "TestPass@123",
  });
  assert(
    "Duplicate email rejected",
    !dupEmail.ok && (dupEmail.status === 409 || dupEmail.status === 429),
    `Status: ${dupEmail.status}, ${JSON.stringify(dupEmail.data)}`,
  );

  // Small delay to avoid rate limit interfering
  await sleep(1500);

  subsection("Duplicate username rejection");
  const dupUsername = await request("POST", "/auth/register/request", {
    fullName: "Duplicate User",
    username: "chidi_o", // existing username
    email: `unique_${timestamp}@example.com`,
    password: "TestPass@123",
  });
  assert(
    "Duplicate username rejected",
    !dupUsername.ok &&
      (dupUsername.status === 409 || dupUsername.status === 429),
    `Status: ${dupUsername.status}, ${JSON.stringify(dupUsername.data)}`,
  );

  subsection("Password reset OTP");
  const resetOtp = await request("POST", "/auth/password-reset/request", {
    email: "tendai@uni.ac.zw",
  });
  assert("Password reset OTP request works", resetOtp.ok);
};

/* 3. USER PROFILES */
const testProfiles = async () => {
  section("3. User Profiles");

  if (!state.tokens.user1) return skip("Profile tests", "no auth token");

  subsection("Get own profile");
  const ownProfile = await request(
    "GET",
    `/users/${state.users.user1.username}`,
    null,
    state.tokens.user1,
  );
  assert("Get own profile works", ownProfile.ok);
  assert("Own profile shows email", !!ownProfile.data?.data?.email);
  assert(
    "Own profile flag is set",
    ownProfile.data?.data?.isOwnProfile === true,
  );

  subsection("Get other user profile");
  const otherProfile = await request(
    "GET",
    `/users/${state.users.user2.username}`,
    null,
    state.tokens.user1,
  );
  assert("Get other profile works", otherProfile.ok);
  assert("Other profile hides email", otherProfile.data?.data?.email === null);
  assert(
    "Other profile flag is false",
    otherProfile.data?.data?.isOwnProfile === false,
  );

  subsection("Non-existent profile");
  const notFound = await request(
    "GET",
    "/users/nonexistentuser123456",
    null,
    state.tokens.user1,
  );
  assert("Non-existent user returns 404", notFound.status === 404);

  subsection("Update profile");
  const formData = new FormData();
  formData.append("fullName", "Tendai Updated");
  formData.append("bio", "Updated bio with **markdown** support");

  // Use raw fetch for multipart
  const updateRes = await fetch(`${BASE_URL}/users/me`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: formData,
  });
  const updateData = await updateRes.json().catch(() => ({}));

  assert("Profile update works", updateRes.ok, JSON.stringify(updateData));
  if (updateRes.ok) {
    assert(
      "Full name updated",
      updateData.data?.profile?.fullName === "Tendai Updated",
    );
    assert("Bio updated", updateData.data?.profile?.bio?.includes("markdown"));
  }
};

/* 4. POSTS */
const testPosts = async () => {
  section("4. Posts");

  if (!state.tokens.user1) return skip("Post tests", "no auth token");

  subsection("Get feed (initial)");
  const feed = await request(
    "GET",
    "/posts/feed?page=1&limit=10",
    null,
    state.tokens.user1,
  );
  assert("Get feed works", feed.ok);
  assert("Feed returns array", Array.isArray(feed.data?.data));
  assert("Feed has pagination meta", !!feed.data?.meta);

  subsection("Create text post");
  const textPost = await request(
    "POST",
    "/posts/text",
    {
      content: "Test post with **bold** and *italic* formatting! @admin #test",
      backgroundStyle: "default",
    },
    state.tokens.user1,
  );
  assert("Create text post works", textPost.ok, JSON.stringify(textPost.data));
  if (textPost.ok) {
    state.posts.text = textPost.data.data.id;
    assert("Text post has id", !!state.posts.text);
    assert("Text post type is text", textPost.data.data.type === "text");
    assert(
      "Text content saved",
      textPost.data.data.text?.content?.includes("bold"),
    );
  }

  subsection("Create link post");
  const linkPost = await request(
    "POST",
    "/posts/link",
    {
      url: "https://react.dev",
      title: "React",
      description: "A JavaScript library",
      caption: "Check this out!",
    },
    state.tokens.user1,
  );
  assert("Create link post works", linkPost.ok);
  if (linkPost.ok) {
    state.posts.link = linkPost.data.data.id;
  }

  subsection("Feed includes new posts");
  const updatedFeed = await request(
    "GET",
    "/posts/feed?page=1&limit=20",
    null,
    state.tokens.user1,
  );
  const hasNewPost = updatedFeed.data?.data?.some(
    (p) => p.id === state.posts.text,
  );
  assert("New text post appears in feed", hasNewPost);

  subsection("Filter feed by type");
  const textOnly = await request(
    "GET",
    "/posts/feed?type=text&limit=10",
    null,
    state.tokens.user1,
  );
  assert("Filter by type works", textOnly.ok);
  assert(
    "All returned posts are text",
    textOnly.data?.data?.every((p) => p.type === "text"),
  );

  subsection("Get single post");
  if (state.posts.text) {
    const single = await request(
      "GET",
      `/posts/${state.posts.text}`,
      null,
      state.tokens.user1,
    );
    assert("Get single post works", single.ok);
    assert("Single post matches", single.data?.data?.id === state.posts.text);
  }

  subsection("Get user posts");
  const userPosts = await request(
    "GET",
    `/posts/user/${state.users.user1.id}`,
    null,
    state.tokens.user1,
  );
  assert("Get user posts works", userPosts.ok);
  assert("User posts is array", Array.isArray(userPosts.data?.data));

  subsection("Check new posts endpoint");
  const checkNew = await request(
    "GET",
    `/posts/check-new?since=${new Date(Date.now() - 60000).toISOString()}`,
    null,
    state.tokens.user1,
  );
  assert("Check new posts works", checkNew.ok);
  assert("Returns count", typeof checkNew.data?.data?.count === "number");
};

/* 5. LIKES */
const testLikes = async () => {
  section("5. Likes");

  if (!state.tokens.user1 || !state.posts.text) {
    return skip("Like tests", "no auth or post");
  }

  subsection("Like a post (user2 likes user1's post)");
  const like = await request(
    "POST",
    `/likes/posts/${state.posts.text}`,
    null,
    state.tokens.user2,
  );
  assert("Like post works", like.ok);
  assert('Action is "liked"', like.data?.data?.action === "liked");
  assert("isLiked is true", like.data?.data?.isLiked === true);
  assert("Like count is 1", like.data?.data?.likeCount === 1);

  subsection("Unlike the post");
  const unlike = await request(
    "POST",
    `/likes/posts/${state.posts.text}`,
    null,
    state.tokens.user2,
  );
  assert("Unlike works", unlike.ok);
  assert('Action is "unliked"', unlike.data?.data?.action === "unliked");
  assert("isLiked is false", unlike.data?.data?.isLiked === false);
  assert("Like count is 0", unlike.data?.data?.likeCount === 0);

  subsection("Re-like for next tests");
  await request(
    "POST",
    `/likes/posts/${state.posts.text}`,
    null,
    state.tokens.user2,
  );

  subsection("Get list of users who liked");
  const likers = await request(
    "GET",
    `/likes/posts/${state.posts.text}`,
    null,
    state.tokens.user1,
  );
  assert("Get likers works", likers.ok);
  assert(
    "Likers list contains user2",
    likers.data?.data?.some((u) => u.id === state.users.user2.id),
  );
};

/* 6. COMMENTS */
const testComments = async () => {
  section("6. Comments");

  if (!state.tokens.user2 || !state.posts.text) {
    return skip("Comment tests", "no auth or post");
  }

  subsection("Create top-level comment");
  const comment = await request(
    "POST",
    `/comments/posts/${state.posts.text}`,
    { content: "Great post! **Loving it** @tendai_m" },
    state.tokens.user2,
  );
  assert("Create comment works", comment.ok, JSON.stringify(comment.data));
  if (comment.ok) {
    state.comments.main = comment.data.data.id;
    assert("Comment has id", !!state.comments.main);
    assert(
      "Author is user2",
      comment.data.data.author?.id === state.users.user2.id,
    );
  }

  subsection("Get post comments");
  const comments = await request(
    "GET",
    `/comments/posts/${state.posts.text}`,
    null,
    state.tokens.user1,
  );
  assert("Get comments works", comments.ok);
  assert("Comments is array", Array.isArray(comments.data?.data));

  subsection("Create reply");
  if (state.comments.main) {
    const reply = await request(
      "POST",
      `/comments/posts/${state.posts.text}`,
      {
        content: "Thanks for the comment!",
        parentCommentId: state.comments.main,
      },
      state.tokens.user1,
    );
    assert("Create reply works", reply.ok);
    if (reply.ok) {
      state.comments.reply = reply.data.data.id;
      assert(
        "Reply has parentCommentId",
        reply.data.data.parentCommentId === state.comments.main,
      );
    }
  }

  subsection("Get replies for comment");
  if (state.comments.main) {
    const replies = await request(
      "GET",
      `/comments/${state.comments.main}/replies`,
      null,
      state.tokens.user1,
    );
    assert("Get replies works", replies.ok);
    assert("Reply count > 0", replies.data?.data?.length > 0);
  }

  subsection("Delete own comment");
  if (state.comments.reply) {
    const del = await request(
      "DELETE",
      `/comments/${state.comments.reply}`,
      null,
      state.tokens.user1,
    );
    assert("Delete own comment works", del.ok);
  }

  subsection("Cannot delete others' comments");
  if (state.comments.main) {
    const del = await request(
      "DELETE",
      `/comments/${state.comments.main}`,
      null,
      state.tokens.user1,
    );
    assert("Cannot delete other user's comment", !del.ok && del.status === 403);
  }
};

/* 7. NOTICES */
const testNotices = async () => {
  section("7. Notices");

  if (!state.tokens.user1) return skip("Notice tests", "no auth");

  subsection("Get all notices");
  const notices = await request("GET", "/notices", null, state.tokens.user1);
  assert("Get notices works", notices.ok);
  assert("Notices is array", Array.isArray(notices.data?.data));

  subsection("Create notice");
  const formData = new FormData();
  formData.append("title", "Test Notice from API Tests");
  formData.append("description", "This is a test notice with **markdown**");
  formData.append("phoneNumber", "+263 77 123 4567");
  formData.append("emailAddress", "test@example.com");

  const createRes = await fetch(`${BASE_URL}/notices`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: formData,
  });
  const createData = await createRes.json().catch(() => ({}));

  assert("Create notice works", createRes.ok, JSON.stringify(createData));
  if (createRes.ok) {
    state.notice = createData.data.id;
    assert("Notice has id", !!state.notice);
    assert("Notice is active", createData.data.status === "active");
  }

  subsection("Filter notices");
  const activeOnly = await request(
    "GET",
    "/notices?status=active",
    null,
    state.tokens.user1,
  );
  assert("Filter by status works", activeOnly.ok);

  const myNotices = await request(
    "GET",
    "/notices?mine=true",
    null,
    state.tokens.user1,
  );
  assert("Get my notices works", myNotices.ok);
  assert(
    "My notices include the new one",
    myNotices.data?.data?.some((n) => n.id === state.notice),
  );

  subsection("Search notices");
  const search = await request(
    "GET",
    "/notices?search=test",
    null,
    state.tokens.user1,
  );
  assert("Search notices works", search.ok);

  subsection("Toggle notice status");
  if (state.notice) {
    const toggle = await request(
      "PATCH",
      `/notices/${state.notice}/toggle-status`,
      null,
      state.tokens.user1,
    );
    assert("Toggle status works", toggle.ok);
    assert("Status is now closed", toggle.data?.data?.status === "closed");
  }

  subsection("Cannot toggle others' notices");
  if (state.notice) {
    const toggle = await request(
      "PATCH",
      `/notices/${state.notice}/toggle-status`,
      null,
      state.tokens.user2,
    );
    assert(
      "Cannot toggle other user's notice",
      !toggle.ok && toggle.status === 403,
    );
  }
};

/* 8. SEARCH */
const testSearch = async () => {
  section("8. Search");

  if (!state.tokens.user1) return skip("Search tests", "no auth");

  subsection("Global search");
  const global = await request(
    "GET",
    "/search?q=test",
    null,
    state.tokens.user1,
  );
  assert("Global search works", global.ok);
  assert("Returns users array", Array.isArray(global.data?.data?.users));
  assert("Returns posts array", Array.isArray(global.data?.data?.posts));
  assert("Returns notices array", Array.isArray(global.data?.data?.notices));
  assert("Returns counts", !!global.data?.data?.counts);

  subsection("Search users");
  const users = await request(
    "GET",
    "/search/users?q=tendai",
    null,
    state.tokens.user1,
  );
  assert("User search works", users.ok);

  subsection("Search posts");
  const posts = await request(
    "GET",
    "/search/posts?q=bold",
    null,
    state.tokens.user1,
  );
  assert("Post search works", posts.ok);

  subsection("Search notices");
  const notices = await request(
    "GET",
    "/search/notices?q=test",
    null,
    state.tokens.user1,
  );
  assert("Notice search works", notices.ok);

  subsection("Short query rejection");
  const short = await request("GET", "/search?q=a", null, state.tokens.user1);
  assert("Short query rejected", !short.ok && short.status === 400);
};

/* 9. NOTIFICATIONS */
const testNotifications = async () => {
  section("9. Notifications");

  if (!state.tokens.user1) return skip("Notification tests", "no auth");

  subsection("Get notifications");
  const notifs = await request(
    "GET",
    "/notifications",
    null,
    state.tokens.user1,
  );
  assert("Get notifications works", notifs.ok);
  assert("Notifications is array", Array.isArray(notifs.data?.data));

  subsection("Get unread count");
  const count = await request(
    "GET",
    "/notifications/unread-count",
    null,
    state.tokens.user1,
  );
  assert("Unread count works", count.ok);
  assert("Count is number", typeof count.data?.data?.count === "number");

  subsection("Polling endpoint");
  const poll = await request(
    "GET",
    "/notifications/poll",
    null,
    state.tokens.user1,
  );
  assert("Poll works", poll.ok);
  assert("Returns timestamp", !!poll.data?.data?.timestamp);

  subsection("Like creates notification");
  // user2 likes user1's post (if not already)
  if (state.posts.text) {
    // Unlike first to remove existing
    await request(
      "POST",
      `/likes/posts/${state.posts.text}`,
      null,
      state.tokens.user2,
    );
    // Like again to trigger notification
    await request(
      "POST",
      `/likes/posts/${state.posts.text}`,
      null,
      state.tokens.user2,
    );
    await sleep(100);

    const updated = await request(
      "GET",
      "/notifications",
      null,
      state.tokens.user1,
    );
    const hasLikeNotif = updated.data?.data?.some(
      (n) => n.type === "post_liked",
    );
    assert("Like generated a notification", hasLikeNotif);

    if (hasLikeNotif) {
      state.notification = updated.data.data.find(
        (n) => n.type === "post_liked",
      )?.id;
    }
  }

  subsection("Mark as read");
  if (state.notification) {
    const markRead = await request(
      "PATCH",
      `/notifications/${state.notification}/read`,
      null,
      state.tokens.user1,
    );
    assert("Mark as read works", markRead.ok);
  }

  subsection("Mark all as read");
  const markAll = await request(
    "PATCH",
    "/notifications/read-all",
    null,
    state.tokens.user1,
  );
  assert("Mark all as read works", markAll.ok);
};

/* 10. ADMIN PANEL */
const testAdmin = async () => {
  section("10. Admin Panel");

  if (!state.tokens.admin) return skip("Admin tests", "no admin token");

  subsection("Get dashboard");
  const dashboard = await request(
    "GET",
    "/admin/dashboard",
    null,
    state.tokens.admin,
  );
  assert("Get dashboard works", dashboard.ok);
  assert("Has user stats", !!dashboard.data?.data?.users);
  assert("Has post stats", !!dashboard.data?.data?.posts);
  assert("Has growth data", Array.isArray(dashboard.data?.data?.growth));
  assert(
    "Has recent activity",
    Array.isArray(dashboard.data?.data?.recentActivity),
  );

  subsection("Non-admin cannot access");
  const blocked = await request(
    "GET",
    "/admin/dashboard",
    null,
    state.tokens.user1,
  );
  assert("Student blocked from admin", !blocked.ok && blocked.status === 403);

  subsection("Get users");
  const users = await request(
    "GET",
    "/admin/users?limit=10",
    null,
    state.tokens.admin,
  );
  assert("Get users works", users.ok);
  assert("Returns user list", Array.isArray(users.data?.data));

  subsection("Search users");
  const searchUsers = await request(
    "GET",
    "/admin/users?search=tendai",
    null,
    state.tokens.admin,
  );
  assert("Search users works", searchUsers.ok);

  subsection("Get posts for moderation");
  const adminPosts = await request(
    "GET",
    "/admin/posts?limit=10",
    null,
    state.tokens.admin,
  );
  assert("Get all posts (admin) works", adminPosts.ok);

  subsection("Get notices for moderation");
  const adminNotices = await request(
    "GET",
    "/admin/notices?limit=10",
    null,
    state.tokens.admin,
  );
  assert("Get all notices (admin) works", adminNotices.ok);

  subsection("Get announcements");
  const announcements = await request(
    "GET",
    "/admin/announcements",
    null,
    state.tokens.admin,
  );
  assert("Get announcements works", announcements.ok);

  subsection("Create announcement");
  const newAnnouncement = await request(
    "POST",
    "/admin/announcements",
    {
      title: "Test Announcement from API Tests",
      content: "This is a test announcement with **markdown**.",
    },
    state.tokens.admin,
  );
  assert("Create announcement works", newAnnouncement.ok);
  if (newAnnouncement.ok) {
    state.announcement = newAnnouncement.data.data.id;
  }

  subsection("Update announcement");
  if (state.announcement) {
    const update = await request(
      "PATCH",
      `/admin/announcements/${state.announcement}`,
      { title: "Updated Title" },
      state.tokens.admin,
    );
    assert("Update announcement works", update.ok);
  }

  subsection("Toggle announcement active");
  if (state.announcement) {
    const toggle = await request(
      "PATCH",
      `/admin/announcements/${state.announcement}`,
      { isActive: false },
      state.tokens.admin,
    );
    assert("Toggle active works", toggle.ok);
  }

  subsection("Cache stats endpoint");
  const cacheStats = await request(
    "GET",
    "/admin/cache/stats",
    null,
    state.tokens.admin,
  );
  assert("Cache stats works", cacheStats.ok);
};

/* 11. ANNOUNCEMENTS (Public) */
const testAnnouncements = async () => {
  section("11. Public Announcements");

  if (!state.tokens.user1) return skip("Announcement tests", "no auth");

  const announcements = await request(
    "GET",
    "/announcements",
    null,
    state.tokens.user1,
  );
  assert("Get announcements works", announcements.ok);
  assert("Returns array", Array.isArray(announcements.data?.data));
};

/* 12. RATE LIMITING */
const testRateLimits = async (quick = false) => {
  if (quick) return skip("Rate limit tests", "skipped in quick mode");

  section("12. Rate Limiting");

  subsection("Auth rate limit (rapid login attempts)");
  let blocked = false;
  for (let i = 0; i < 25; i++) {
    const res = await request("POST", "/auth/login", {
      identifier: "fake@user.com",
      password: "wrong",
    });
    if (res.status === 429) {
      blocked = true;
      break;
    }
  }
  assert("Rate limiter blocks after threshold", blocked);
};

/* 13. CLEANUP — Delete test data */
const cleanup = async () => {
  section("13. Cleanup");

  subsection("Deleting test data");

  // Delete test announcement
  if (state.announcement && state.tokens.admin) {
    const res = await request(
      "DELETE",
      `/admin/announcements/${state.announcement}`,
      null,
      state.tokens.admin,
    );
    assert("Delete test announcement", res.ok);
  }

  // Delete test notice
  if (state.notice && state.tokens.user1) {
    const res = await request(
      "DELETE",
      `/notices/${state.notice}`,
      null,
      state.tokens.user1,
    );
    assert("Delete test notice", res.ok);
  }

  // Delete test posts
  for (const [type, postId] of Object.entries(state.posts)) {
    if (postId && state.tokens.user1) {
      const res = await request(
        "DELETE",
        `/posts/${postId}`,
        null,
        state.tokens.user1,
      );
      assert(`Delete test ${type} post`, res.ok);
    }
  }
};

/* ─── Main Runner ─────────────────────────────────────────────── */

const main = async () => {
  const quick = process.argv.includes("--quick");

  console.clear();
  console.log(
    chalk.bold(
      chalk.blue("\n╔══════════════════════════════════════════════╗"),
    ),
  );
  console.log(
    chalk.bold(chalk.blue("║         ZimHub Automated Test Suite          ║")),
  );
  console.log(
    chalk.bold(chalk.blue("╚══════════════════════════════════════════════╝")),
  );
  console.log(chalk.gray(`\nBase URL: ${BASE_URL}`));
  console.log(
    chalk.gray(`Mode    : ${quick ? "Quick (skips rate limits)" : "Full"}`),
  );
  console.log(chalk.gray(`Started : ${new Date().toLocaleString()}\n`));

  const startTime = Date.now();

  try {
    await testHealth();
    await testAuth();
    await testProfiles();
    await testPosts();
    await testLikes();
    await testComments();
    await testNotices();
    await testSearch();
    await testNotifications();
    await testAdmin();
    await testAnnouncements();
    await testRateLimits(quick);
    await cleanup();
  } catch (err) {
    console.log(chalk.red(`\n💥 Fatal error: ${err.message}`));
    console.log(err.stack);
  }

  /* ─── Summary ─────────────────────────────────────────────── */
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const total = results.passed + results.failed + results.skipped;
  const passRate =
    total > 0
      ? ((results.passed / (results.passed + results.failed)) * 100).toFixed(1)
      : 0;

  console.log("\n" + chalk.bold(chalk.cyan("═".repeat(50))));
  console.log(chalk.bold("TEST SUMMARY"));
  console.log(chalk.bold(chalk.cyan("═".repeat(50))));
  console.log(`  Total tests : ${chalk.bold(total)}`);
  console.log(
    `  ${chalk.green("Passed      :")} ${chalk.bold(results.passed)}`,
  );
  console.log(`  ${chalk.red("Failed      :")} ${chalk.bold(results.failed)}`);
  console.log(
    `  ${chalk.yellow("Skipped     :")} ${chalk.bold(results.skipped)}`,
  );
  console.log(`  Pass rate   : ${chalk.bold(passRate + "%")}`);
  console.log(`  Duration    : ${chalk.bold(duration + "s")}`);

  if (results.failed > 0) {
    console.log("\n" + chalk.red(chalk.bold("FAILED TESTS:")));
    results.errors.forEach((err) => {
      console.log(`  ${chalk.red("✗")} ${err.name}`);
      if (err.details)
        console.log(`    ${chalk.gray(err.details.substring(0, 200))}`);
    });
  }

  console.log(
    "\n" +
      (results.failed === 0
        ? chalk.green(chalk.bold("🎉 ALL TESTS PASSED!"))
        : chalk.red(chalk.bold("⚠️  SOME TESTS FAILED"))),
  );

  console.log("");
  process.exit(results.failed === 0 ? 0 : 1);
};

main();
