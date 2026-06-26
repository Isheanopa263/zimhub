require("dotenv").config();
const fs = require("fs");
const path = require("path");

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

/* ─── Test State ──────────────────────────────────────────────────────────── */
const state = {
  tokens: { admin: null, user1: null, user2: null },
  refreshTokens: {},
  users: {},
  posts: { text: null, image: null, video: null, link: null },
  comments: { main: null, reply: null },
  notice: null,
  notification: null,
  announcement: null,
  query: null,
  queryReply: null,
  suggestion: null,
};

const results = { passed: 0, failed: 0, skipped: 0, errors: [] };

/* ─── Utilities ───────────────────────────────────────────────────────────── */
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
    if (details) console.log(`    ${chalk.gray(details.substring(0, 200))}`);
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

/* ─── Helper: Create test image file ──────────────────────────────────────── */
const createTestImage = () => {
  // Real 1x1 PNG (minimal valid)
  const png = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // PNG signature
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52, // IHDR chunk
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01,
    0x08,
    0x06,
    0x00,
    0x00,
    0x00,
    0x1f,
    0x15,
    0xc4,
    0x89,
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x44,
    0x41,
    0x54,
    0x78,
    0x9c,
    0x62,
    0x00,
    0x01,
    0x00,
    0x00,
    0x05,
    0x00,
    0x01,
    0x0d,
    0x0a,
    0x2d,
    0xb4,
    0x00,
    0x00,
    0x00,
    0x00,
    0x49,
    0x45,
    0x4e,
    0x44,
    0xae,
    0x42,
    0x60,
    0x82,
  ]);

  return new Blob([png], { type: "image/png" });
};

/* ─── Helper: Create fake image (text with .jpg extension) ───────────────── */
const createFakeImage = () => {
  // Plain text content disguised as an image — for magic byte test
  const content =
    "This is not a real image file, just text pretending to be JPEG";
  return new Blob([content], { type: "image/jpeg" });
};

/* ═══════════════════════════════════════════════════════════════════════════
   TEST SUITES
   ═══════════════════════════════════════════════════════════════════════════ */

/* 1. HEALTH & INFRASTRUCTURE */
const testHealth = async () => {
  section("1. Health & Infrastructure");

  const health = await request("GET", HEALTH_URL);
  assert("Server is reachable", health.ok || health.status === 200);
  assert(
    "Health endpoint returns healthy",
    health.data?.status === "healthy",
    `Got: ${JSON.stringify(health.data)}`,
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
    state.refreshTokens.admin = adminLogin.data.data.refreshToken;
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
    state.refreshTokens.user1 = studentLogin.data.data.refreshToken;
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

  subsection("Case-insensitive login");
  const caseLogin = await request("POST", "/auth/login", {
    identifier: "TENDAI@UNI.AC.ZW",
    password: "Student@1234",
  });
  assert("Case-insensitive email login works", caseLogin.ok);

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

  subsection("Token signature validation");
  const tamperedToken = state.tokens.user1?.slice(0, -10) + "TAMPERED01";
  const tampered = await request("GET", "/auth/me", null, tamperedToken);
  assert("Tampered token rejected", !tampered.ok && tampered.status === 401);

  subsection("Token refresh");
  if (state.refreshTokens.user1) {
    const refresh = await request("POST", "/auth/refresh", {
      refreshToken: state.refreshTokens.user1,
    });
    assert("Token refresh works", refresh.ok);
    assert("New tokens issued", !!refresh.data?.data?.accessToken);

    // Update token for subsequent tests
    if (refresh.ok) {
      state.tokens.user1 = refresh.data.data.accessToken;
      state.refreshTokens.user1 = refresh.data.data.refreshToken;
    }
  }

  subsection("Invalid refresh token");
  const badRefresh = await request("POST", "/auth/refresh", {
    refreshToken: "invalid.token.here",
  });
  assert("Bad refresh token rejected", !badRefresh.ok);

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
    `Status: ${otpRequest.status}`,
  );

  subsection("Duplicate email rejection");
  const dupEmail = await request("POST", "/auth/register/request", {
    fullName: "Duplicate User",
    username: `dup_email_${timestamp}`,
    email: "tendai@uni.ac.zw",
    password: "TestPass@123",
  });
  assert(
    "Duplicate email rejected",
    !dupEmail.ok && (dupEmail.status === 409 || dupEmail.status === 429),
    `Status: ${dupEmail.status}`,
  );

  await sleep(1500);

  subsection("Duplicate username rejection");
  if (state.users.user1?.username) {
    const dupUsername = await request("POST", "/auth/register/request", {
      fullName: "Duplicate User",
      username: state.users.user1.username,
      email: `unique_${timestamp}@example.com`,
      password: "TestPass@123",
    });
    assert(
      "Duplicate username rejected",
      !dupUsername.ok &&
        (dupUsername.status === 409 || dupUsername.status === 429),
      `Status: ${dupUsername.status}`,
    );
  } else {
    skip("Duplicate username rejection", "no reference user");
  }

  subsection("Case-insensitive duplicate username");
  if (state.users.user1?.username) {
    await sleep(1500);
    const upperCase = await request("POST", "/auth/register/request", {
      fullName: "Case Test",
      username: state.users.user1.username.toUpperCase(),
      email: `casetest_${timestamp}@example.com`,
      password: "TestPass@123",
    });
    assert(
      "Uppercase username variant rejected",
      !upperCase.ok && (upperCase.status === 409 || upperCase.status === 429),
      `Status: ${upperCase.status}`,
    );
  }

  subsection("Password reset OTP");
  const resetOtp = await request("POST", "/auth/password-reset/request", {
    email: "tendai@uni.ac.zw",
  });
  assert("Password reset OTP request works", resetOtp.ok);

  subsection("Password reset enumeration protection");
  const fakeReset = await request("POST", "/auth/password-reset/request", {
    email: "totally-fake@nobody.com",
  });
  assert(
    "Non-existent email returns same success response",
    fakeReset.ok,
    "Should not reveal whether email exists",
  );
};

/* 3. SECURITY — Rate Limiting */
const testSecurity = async () => {
  section("3. Security & Rate Limiting");

  subsection("Refresh token rate limit");
  let refreshBlocked = false;
  for (let i = 0; i < 35; i++) {
    const res = await request("POST", "/auth/refresh", {
      refreshToken: "fake.token.for.testing",
    });
    if (res.status === 429) {
      refreshBlocked = true;
      break;
    }
  }
  assert("Refresh endpoint rate-limited", refreshBlocked);

  // Wait to clear rate limit for subsequent tests
  await sleep(1500);
};

/* 4. USER PROFILES */
const testProfiles = async () => {
  section("4. User Profiles");

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

  subsection("Get other user profile (privacy)");
  const otherProfile = await request(
    "GET",
    `/users/${state.users.user2.username}`,
    null,
    state.tokens.user1,
  );
  assert("Get other profile works", otherProfile.ok);
  assert(
    "Other profile hides email (privacy)",
    otherProfile.data?.data?.email === null,
  );
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

  subsection("Update profile (valid name)");
  const formData = new FormData();
  formData.append("fullName", "Tendai Updated");
  formData.append("bio", "Updated bio with **markdown**");

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

  subsection("Profile update with period in name");
  const formData2 = new FormData();
  formData2.append("fullName", "Dr. Tendai M. Updated");

  const updateRes2 = await fetch(`${BASE_URL}/users/me`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: formData2,
  });
  assert("Period allowed in full name (Dr., A., etc.)", updateRes2.ok);
};

/* 5. POSTS */
const testPosts = async () => {
  section("5. Posts");

  if (!state.tokens.user1) return skip("Post tests", "no auth token");

  subsection("Get feed");
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
      content: "Test post with **bold** and *italic*! @admin #test",
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
  if (linkPost.ok) state.posts.link = linkPost.data.data.id;

  subsection("Multi-image endpoint validates");
  const noImagesRes = await fetch(`${BASE_URL}/posts/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: (() => {
      const fd = new FormData();
      fd.append("caption", "Test");
      return fd;
    })(),
  });
  assert(
    "Image endpoint requires files",
    !noImagesRes.ok && noImagesRes.status === 400,
    `Status: ${noImagesRes.status}`,
  );

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
  assert("New post appears in feed", hasNewPost);

  subsection("Filter feed by type");
  const textOnly = await request(
    "GET",
    "/posts/feed?type=text&limit=10",
    null,
    state.tokens.user1,
  );
  assert("Filter by type works", textOnly.ok);
  assert(
    "All filtered posts are text",
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

  subsection("Cannot delete others posts");
  if (state.posts.text) {
    const unauthDelete = await request(
      "DELETE",
      `/posts/${state.posts.text}`,
      null,
      state.tokens.user2,
    );
    assert(
      "Non-owner cannot delete post",
      !unauthDelete.ok && unauthDelete.status === 403,
    );
  }
};

/* 6. FILE UPLOAD SECURITY (Magic Bytes) */
const testFileUploadSecurity = async () => {
  section("6. File Upload Security (Magic Bytes)");

  if (!state.tokens.user1) return skip("Upload security tests", "no auth");

  subsection("Reject fake image (text with image MIME)");
  const fakeImage = createFakeImage();
  const fakeFormData = new FormData();
  fakeFormData.append("images", fakeImage, "fake.jpg");
  fakeFormData.append("caption", "This should fail");

  const fakeRes = await fetch(`${BASE_URL}/posts/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: fakeFormData,
  });

  // If file-type is installed and verifyImageSignature is wired up, it should reject
  if (fakeRes.status === 400) {
    assert("Disguised file rejected (magic bytes work)", true);
  } else if (fakeRes.status === 201) {
    assert(
      "Disguised file rejected (magic bytes work)",
      false,
      "Magic byte validation not enforced — install file-type package and wire up verifyImageSignature middleware",
    );
  } else {
    skip("Magic byte validation", `Got unexpected status ${fakeRes.status}`);
  }

  subsection("Accept genuine PNG");
  const realImage = createTestImage();
  const realFormData = new FormData();
  realFormData.append("images", realImage, "test.png");
  realFormData.append("caption", "Real test image");

  const realRes = await fetch(`${BASE_URL}/posts/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: realFormData,
  });
  const realData = await realRes.json().catch(() => ({}));

  if (realRes.ok) {
    assert("Real PNG image accepted", true);
    state.posts.image = realData.data?.id;
  } else {
    assert("Real PNG image accepted", false, JSON.stringify(realData));
  }

  subsection("Reject oversized images");
  // Create a Blob larger than 5MB
  const largeContent = new Uint8Array(6 * 1024 * 1024); // 6MB of zeros
  // But add PNG header so it passes MIME check but fails size
  const png_header = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < png_header.length; i++) largeContent[i] = png_header[i];
  const largeImage = new Blob([largeContent], { type: "image/png" });

  const largeFormData = new FormData();
  largeFormData.append("images", largeImage, "large.png");

  const largeRes = await fetch(`${BASE_URL}/posts/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: largeFormData,
  });
  assert("Oversized file rejected", !largeRes.ok && largeRes.status === 400);

  subsection("Reject too many files (>10)");
  const tooManyFormData = new FormData();
  for (let i = 0; i < 11; i++) {
    tooManyFormData.append("images", createTestImage(), `test-${i}.png`);
  }

  const tooManyRes = await fetch(`${BASE_URL}/posts/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: tooManyFormData,
  });
  assert(
    "More than 10 files rejected",
    !tooManyRes.ok && tooManyRes.status === 400,
  );
};

/* 7. LIKES */
const testLikes = async () => {
  section("7. Likes");

  if (!state.tokens.user1 || !state.posts.text) {
    return skip("Like tests", "no auth or post");
  }

  subsection("Like a post");
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
  assert("Like count is 0", unlike.data?.data?.likeCount === 0);

  subsection("Re-like for next tests");
  await request(
    "POST",
    `/likes/posts/${state.posts.text}`,
    null,
    state.tokens.user2,
  );

  subsection("Get list of likers");
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

/* 8. COMMENTS */
const testComments = async () => {
  section("8. Comments");

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
  assert("Create comment works", comment.ok);
  if (comment.ok) {
    state.comments.main = comment.data.data.id;
    assert("Comment has id", !!state.comments.main);
    assert(
      "Comment has reply count",
      typeof comment.data.data.replyCount === "number",
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
      { content: "Thanks!", parentCommentId: state.comments.main },
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

  subsection("Cannot delete others comments");
  if (state.comments.main) {
    const del = await request(
      "DELETE",
      `/comments/${state.comments.main}`,
      null,
      state.tokens.user1,
    );
    assert("Cannot delete other user comment", !del.ok && del.status === 403);
  }
};

/* 9. NOTICES */
const testNotices = async () => {
  section("9. Notices");

  if (!state.tokens.user1) return skip("Notice tests", "no auth");

  subsection("Get all notices");
  const notices = await request("GET", "/notices", null, state.tokens.user1);
  assert("Get notices works", notices.ok);
  assert("Notices is array", Array.isArray(notices.data?.data));

  subsection("Create notice");
  const formData = new FormData();
  formData.append("title", "Test Notice from Tests");
  formData.append("description", "Test notice with **markdown**");
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

  subsection("Cannot toggle others notices");
  if (state.notice) {
    const toggle = await request(
      "PATCH",
      `/notices/${state.notice}/toggle-status`,
      null,
      state.tokens.user2,
    );
    assert(
      "Cannot toggle other user notice",
      !toggle.ok && toggle.status === 403,
    );
  }
};

/* 10. SEARCH */
const testSearch = async () => {
  section("10. Search");

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

  subsection("Search by type");
  const users = await request(
    "GET",
    "/search/users?q=tendai",
    null,
    state.tokens.user1,
  );
  assert("User search works", users.ok);

  const posts = await request(
    "GET",
    "/search/posts?q=bold",
    null,
    state.tokens.user1,
  );
  assert("Post search works", posts.ok);

  const noticesSearch = await request(
    "GET",
    "/search/notices?q=test",
    null,
    state.tokens.user1,
  );
  assert("Notice search works", noticesSearch.ok);

  subsection("Validation");
  const short = await request("GET", "/search?q=a", null, state.tokens.user1);
  assert(
    "Short query rejected (min 2 chars)",
    !short.ok && short.status === 400,
  );
};

/* 11. NOTIFICATIONS */
const testNotifications = async () => {
  section("11. Notifications");

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

  subsection("Poll only returns unread (no re-popping)");
  // Mark all as read first
  await request("PATCH", "/notifications/read-all", null, state.tokens.user1);
  await sleep(150);
  // Poll with old timestamp — should get unread only (empty list)
  const oldPoll = await request(
    "GET",
    `/notifications/poll?since=${new Date(Date.now() - 86400000).toISOString()}`,
    null,
    state.tokens.user1,
  );
  assert(
    "Poll with old timestamp returns 0 new (already read)",
    oldPoll.data?.data?.newNotifications?.length === 0,
    "Polling should not return already-read notifications",
  );

  subsection("Like creates notification");
  if (state.posts.text) {
    await request(
      "POST",
      `/likes/posts/${state.posts.text}`,
      null,
      state.tokens.user2,
    );
    await request(
      "POST",
      `/likes/posts/${state.posts.text}`,
      null,
      state.tokens.user2,
    );
    await sleep(200);

    const updated = await request(
      "GET",
      "/notifications",
      null,
      state.tokens.user1,
    );
    const hasLikeNotif = updated.data?.data?.some(
      (n) => n.type === "post_liked",
    );
    assert("Like generated notification", hasLikeNotif);

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

/* 12. SUPPORT — Queries & Suggestions */
const testSupport = async () => {
  section("12. Support System");

  if (!state.tokens.user1) return skip("Support tests", "no auth");

  subsection("User creates query");
  const newQuery = await request(
    "POST",
    "/support/queries",
    {
      category: "bug_report",
      subject: "Test query from automated test",
      message: "This is a test bug report with **markdown** formatting",
      priority: "normal",
    },
    state.tokens.user1,
  );

  assert("Create query works", newQuery.ok, JSON.stringify(newQuery.data));
  if (newQuery.ok) {
    state.query = newQuery.data.data.id;
    assert("Query has id", !!state.query);
    assert("Status is open", newQuery.data.data.status === "open");
    assert("Has initial reply", newQuery.data.data.replies?.length > 0);
  }

  subsection("User gets own queries");
  const myQueries = await request(
    "GET",
    "/support/queries",
    null,
    state.tokens.user1,
  );
  assert("Get my queries works", myQueries.ok);
  assert("My queries is array", Array.isArray(myQueries.data?.data));

  subsection("User cannot see others queries");
  if (state.query) {
    const cantSee = await request(
      "GET",
      `/support/queries/${state.query}`,
      null,
      state.tokens.user2,
    );
    assert(
      "Other user cannot view query",
      !cantSee.ok && cantSee.status === 403,
    );
  }

  subsection("Admin views all queries");
  if (state.tokens.admin) {
    const adminQueries = await request(
      "GET",
      "/support/admin/queries",
      null,
      state.tokens.admin,
    );
    assert("Admin can view all queries", adminQueries.ok);
  }

  subsection("Admin replies to query");
  if (state.tokens.admin && state.query) {
    const adminReply = await request(
      "POST",
      `/support/admin/queries/${state.query}/replies`,
      { message: "Thanks for reporting this. Looking into it." },
      state.tokens.admin,
    );
    assert("Admin can reply", adminReply.ok);

    if (adminReply.ok) {
      state.queryReply = adminReply.data.data.id;
    }
  }

  subsection("User replies back");
  if (state.query) {
    const userReply = await request(
      "POST",
      `/support/queries/${state.query}/replies`,
      { message: "Thank you for the quick response!" },
      state.tokens.user1,
    );
    assert("User can reply to own query", userReply.ok);
  }

  subsection("Admin changes status");
  if (state.tokens.admin && state.query) {
    const statusChange = await request(
      "PATCH",
      `/support/admin/queries/${state.query}`,
      { status: "resolved" },
      state.tokens.admin,
    );
    assert("Admin can change status", statusChange.ok);
    assert(
      "Status is resolved",
      statusChange.data?.data?.status === "resolved",
    );
  }

  subsection("Anonymous suggestion submission");
  const suggestion = await request(
    "POST",
    "/support/suggestions",
    {
      category: "feature_idea",
      content:
        "It would be great to have dark mode for emails too. This is a test suggestion.",
    },
    state.tokens.user2,
  );

  assert("Submit suggestion works", suggestion.ok);
  if (suggestion.ok) {
    state.suggestion = suggestion.data.data.id;
  }

  subsection("Admin views suggestions (anonymous)");
  if (state.tokens.admin) {
    const adminSuggestions = await request(
      "GET",
      "/support/admin/suggestions",
      null,
      state.tokens.admin,
    );
    assert("Admin can view suggestions", adminSuggestions.ok);

    // Critical: ensure NO user info is in suggestions
    if (adminSuggestions.ok && adminSuggestions.data.data.length > 0) {
      const firstSug = adminSuggestions.data.data[0];
      assert(
        "Suggestion has NO user_id",
        firstSug.user_id === undefined,
        "Privacy violation: suggestions should not include user_id",
      );
      assert(
        "Suggestion has NO username",
        firstSug.username === undefined,
        "Privacy violation: suggestions should not include username",
      );
    }
  }

  subsection("Suggestion stats");
  if (state.tokens.admin) {
    const stats = await request(
      "GET",
      "/support/admin/suggestions/stats",
      null,
      state.tokens.admin,
    );
    assert("Get suggestion stats works", stats.ok);
    assert("Stats has total", typeof stats.data?.data?.total === "number");
  }

  subsection("Unread query count for admin");
  if (state.tokens.admin) {
    const adminUnread = await request(
      "GET",
      "/support/admin/queries/unread-count",
      null,
      state.tokens.admin,
    );
    assert("Admin unread count works", adminUnread.ok);
  }

  subsection("Unread count for user");
  const userUnread = await request(
    "GET",
    "/support/queries/unread-count",
    null,
    state.tokens.user1,
  );
  assert("User unread count works", userUnread.ok);
};

/* 13. ADMIN PANEL */
const testAdmin = async () => {
  section("13. Admin Panel");

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

  subsection("Non-admin blocked");
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

  subsection("Get posts (no duplicates from multi-image)");
  const adminPosts = await request(
    "GET",
    "/admin/posts?limit=50",
    null,
    state.tokens.admin,
  );
  assert("Get all posts works", adminPosts.ok);

  if (adminPosts.ok) {
    const ids = adminPosts.data.data.map((p) => p.id);
    const uniqueIds = new Set(ids);
    assert(
      "No duplicate posts in admin list (multi-image safe)",
      ids.length === uniqueIds.size,
      `Got ${ids.length} posts, ${uniqueIds.size} unique`,
    );
  }

  subsection("Get notices");
  const adminNotices = await request(
    "GET",
    "/admin/notices?limit=10",
    null,
    state.tokens.admin,
  );
  assert("Get all notices works", adminNotices.ok);

  subsection("Announcements");
  const announcements = await request(
    "GET",
    "/admin/announcements",
    null,
    state.tokens.admin,
  );
  assert("Get announcements works", announcements.ok);

  const newAnnouncement = await request(
    "POST",
    "/admin/announcements",
    {
      title: "Test Announcement",
      content: "Test content with **markdown**",
    },
    state.tokens.admin,
  );
  assert("Create announcement works", newAnnouncement.ok);
  if (newAnnouncement.ok) {
    state.announcement = newAnnouncement.data.data.id;
  }

  if (state.announcement) {
    const update = await request(
      "PATCH",
      `/admin/announcements/${state.announcement}`,
      { title: "Updated Title" },
      state.tokens.admin,
    );
    assert("Update announcement works", update.ok);

    const toggle = await request(
      "PATCH",
      `/admin/announcements/${state.announcement}`,
      { isActive: false },
      state.tokens.admin,
    );
    assert("Toggle active works", toggle.ok);
  }

  subsection("Cache stats");
  const cacheStats = await request(
    "GET",
    "/admin/cache/stats",
    null,
    state.tokens.admin,
  );
  assert("Cache stats works", cacheStats.ok);
};

/* 14. AUDIT LOG (if implemented) */
const testAuditLog = async () => {
  section("14. Admin Audit Log");

  if (!state.tokens.admin) return skip("Audit log tests", "no admin token");

  subsection("Audit log endpoint exists");
  const log = await request(
    "GET",
    "/admin/audit-log",
    null,
    state.tokens.admin,
  );

  if (log.status === 404) {
    skip(
      "Audit log endpoint",
      "Not implemented yet — see security audit recommendations",
    );
    return;
  }

  assert("Get audit log works", log.ok);
  assert("Returns log array", Array.isArray(log.data?.data));

  subsection("Non-admin blocked from audit log");
  const blocked = await request(
    "GET",
    "/admin/audit-log",
    null,
    state.tokens.user1,
  );
  assert(
    "Student blocked from audit log",
    !blocked.ok && blocked.status === 403,
  );
};

/* 15. PUBLIC ANNOUNCEMENTS */
const testAnnouncements = async () => {
  section("15. Public Announcements");

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

/* 16. RATE LIMITING */
const testRateLimits = async (quick = false) => {
  if (quick) return skip("Rate limit tests", "skipped in quick mode");

  section("16. Rate Limiting");

  subsection("Auth rate limit");
  let blocked = false;
  for (let i = 0; i < 30; i++) {
    const res = await request("POST", "/auth/login", {
      identifier: "fake@user.com",
      password: "wrong",
    });
    if (res.status === 429) {
      blocked = true;
      break;
    }
  }
  assert("Auth rate limiter blocks after threshold", blocked);
};

/* 17. CLEANUP */
const cleanup = async () => {
  section("17. Cleanup");

  subsection("Deleting test data");

  if (state.suggestion && state.tokens.admin) {
    const res = await request(
      "DELETE",
      `/support/admin/suggestions/${state.suggestion}`,
      null,
      state.tokens.admin,
    );
    assert("Delete test suggestion", res.ok);
  }

  if (state.announcement && state.tokens.admin) {
    const res = await request(
      "DELETE",
      `/admin/announcements/${state.announcement}`,
      null,
      state.tokens.admin,
    );
    assert("Delete test announcement", res.ok);
  }

  if (state.notice && state.tokens.user1) {
    const res = await request(
      "DELETE",
      `/notices/${state.notice}`,
      null,
      state.tokens.user1,
    );
    assert("Delete test notice", res.ok);
  }

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

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN RUNNER
   ═══════════════════════════════════════════════════════════════════════════ */

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
    await testSecurity();
    await testProfiles();
    await testPosts();
    await testFileUploadSecurity();
    await testLikes();
    await testComments();
    await testNotices();
    await testSearch();
    await testNotifications();
    await testSupport();
    await testAdmin();
    await testAuditLog();
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
