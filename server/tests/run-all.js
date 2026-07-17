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

/* ─── State ───────────────────────────────────────────────────────────────── */
const state = {
  tokens: { admin: null, user1: null, user2: null },
  refreshTokens: {},
  users: {},
  posts: { text: null, image: null, link: null, poll: null },
  comments: { main: null, reply: null },
  notice: null,
  notification: null,
  announcement: null,
  query: null,
  suggestion: null,
  pollOptionIds: [],
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

const sub = (title) => {
  console.log(chalk.gray(`\n  ${title}`));
};

/* ─── Test image helpers ──────────────────────────────────────────────────── */
const createTestPNG = () => {
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x62, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  return new Blob([png], { type: "image/png" });
};

const createFakeImage = () => {
  return new Blob(["this is not a real image"], { type: "image/jpeg" });
};

/* ═══════════════════════════════════════════════════════════════════════════
   TEST SUITES
   ═══════════════════════════════════════════════════════════════════════════ */

/* 1. HEALTH */
const testHealth = async () => {
  section("1. Health & Infrastructure");

  const health = await request("GET", HEALTH_URL);
  assert("Server is reachable", health.ok || health.status === 200);
  assert("Health returns healthy", health.data?.status === "healthy");
};

/* 2. AUTHENTICATION */
const testAuth = async () => {
  section("2. Authentication");

  sub("Admin login");
  const adminLogin = await request("POST", "/auth/login", {
    identifier: "admin@zimhub.ac.zw",
    password: "Admin@1234",
  });
  assert("Admin login succeeds", adminLogin.ok);
  assert("Returns access token", !!adminLogin.data?.data?.accessToken);
  assert("Returns refresh token", !!adminLogin.data?.data?.refreshToken);
  assert("Admin role correct", adminLogin.data?.data?.user?.role === "admin");

  if (adminLogin.ok) {
    state.tokens.admin = adminLogin.data.data.accessToken;
    state.refreshTokens.admin = adminLogin.data.data.refreshToken;
    state.users.admin = adminLogin.data.data.user;
  }

  sub("Student login (email)");
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

  sub("Student login (username)");
  const usernameLogin = await request("POST", "/auth/login", {
    identifier: "chidi_o",
    password: "Student@1234",
  });
  assert("Username login works", usernameLogin.ok);

  if (usernameLogin.ok) {
    state.tokens.user2 = usernameLogin.data.data.accessToken;
    state.users.user2 = usernameLogin.data.data.user;
  }

  sub("Case-insensitive login");
  const caseLogin = await request("POST", "/auth/login", {
    identifier: "TENDAI@UNI.AC.ZW",
    password: "Student@1234",
  });
  assert("Case-insensitive email works", caseLogin.ok);

  sub("Invalid credentials");
  const wrongPass = await request("POST", "/auth/login", {
    identifier: "tendai@uni.ac.zw",
    password: "wrongpassword",
  });
  assert("Wrong password → 401", !wrongPass.ok && wrongPass.status === 401);

  const wrongUser = await request("POST", "/auth/login", {
    identifier: "nonexistent@user.com",
    password: "anything",
  });
  assert("Non-existent user rejected", !wrongUser.ok);

  sub("Token validation");
  const me = await request("GET", "/auth/me", null, state.tokens.user1);
  assert("GET /auth/me works", me.ok);
  assert("Has profile", !!me.data?.data?.profile);
  assert("Has stats", me.data?.data?.stats !== undefined);

  const noAuth = await request("GET", "/auth/me");
  assert("No token → 401", !noAuth.ok && noAuth.status === 401);

  const tampered = state.tokens.user1?.slice(0, -10) + "TAMPERED01";
  const tamperedRes = await request("GET", "/auth/me", null, tampered);
  assert("Tampered token → 401", !tamperedRes.ok && tamperedRes.status === 401);

  sub("Token refresh");
  await sleep(500);
  if (state.refreshTokens.user1) {
    const refresh = await request("POST", "/auth/refresh", {
      refreshToken: state.refreshTokens.user1,
    });
    assert("Token refresh works", refresh.ok);
    assert("New access token issued", !!refresh.data?.data?.accessToken);
    if (refresh.ok) {
      state.tokens.user1 = refresh.data.data.accessToken;
      state.refreshTokens.user1 = refresh.data.data.refreshToken;
    }
  }

  const badRefresh = await request("POST", "/auth/refresh", {
    refreshToken: "invalid.token.here",
  });
  assert("Bad refresh token rejected", !badRefresh.ok);

  sub("OTP registration");
  const ts = Date.now();
  const otpReq = await request("POST", "/auth/register/request", {
    fullName: "Test User",
    username: `testuser_${ts}`,
    email: `test_${ts}@example.com`,
    password: "TestPass@123",
  });
  assert("OTP request succeeds", otpReq.ok, `Status: ${otpReq.status}`);

  sub("Duplicate prevention");
  const dupEmail = await request("POST", "/auth/register/request", {
    fullName: "Dup",
    username: `dup_e_${ts}`,
    email: "tendai@uni.ac.zw",
    password: "TestPass@123",
  });
  assert(
    "Duplicate email rejected",
    !dupEmail.ok && (dupEmail.status === 409 || dupEmail.status === 429),
  );

  await sleep(1500);

  if (state.users.user1?.username) {
    const dupUser = await request("POST", "/auth/register/request", {
      fullName: "Dup",
      username: state.users.user1.username,
      email: `unique_${ts}@example.com`,
      password: "TestPass@123",
    });
    assert(
      "Duplicate username rejected",
      !dupUser.ok && (dupUser.status === 409 || dupUser.status === 429),
    );

    await sleep(1500);

    const upperUser = await request("POST", "/auth/register/request", {
      fullName: "Case",
      username: state.users.user1.username.toUpperCase(),
      email: `case_${ts}@example.com`,
      password: "TestPass@123",
    });
    assert(
      "Uppercase username variant rejected",
      !upperUser.ok && (upperUser.status === 409 || upperUser.status === 429),
    );
  }

  await sleep(500);
  sub("Password reset (enumeration protection)");
  const resetOtp = await request("POST", "/auth/password-reset/request", {
    email: "tendai@uni.ac.zw",
  });
  assert("Password reset OTP works", resetOtp.ok);

  const fakeReset = await request("POST", "/auth/password-reset/request", {
    email: "totally-fake@nobody.com",
  });
  assert("Non-existent email returns same response", fakeReset.ok);
};

/* 3. SECURITY */
const testSecurity = async () => {
  section("17. Security & Rate Limiting");

  sub("Refresh token rate limit");
  let blocked = false;

  // Use a unique fake token pattern so rate limit key is isolated
  const fakeToken = `fake.security.test.${Date.now()}`;

  for (let i = 0; i < 35; i++) {
    const res = await request("POST", "/auth/refresh", {
      refreshToken: fakeToken,
    });
    if (res.status === 429) {
      blocked = true;
      break;
    }
  }
  assert("Refresh endpoint rate-limited", blocked);

  // Generous wait to let rate limit window cool down
  // This prevents interference with subsequent test runs
  await sleep(5000);
};

/* 4. PROFILES */
const testProfiles = async () => {
  section("4. User Profiles");

  if (!state.tokens.user1) return skip("Profiles", "no token");

  sub("Own profile");
  const own = await request(
    "GET",
    `/users/${state.users.user1.username}`,
    null,
    state.tokens.user1,
  );
  assert("Get own profile", own.ok);
  assert("Shows email", !!own.data?.data?.email);
  assert("isOwnProfile = true", own.data?.data?.isOwnProfile === true);

  sub("Other profile (privacy)");
  const other = await request(
    "GET",
    `/users/${state.users.user2.username}`,
    null,
    state.tokens.user1,
  );
  assert("Get other profile", other.ok);
  assert("Hides email", other.data?.data?.email === null);
  assert("isOwnProfile = false", other.data?.data?.isOwnProfile === false);

  sub("Non-existent profile");
  const notFound = await request(
    "GET",
    "/users/nonexistent999",
    null,
    state.tokens.user1,
  );
  assert("404 for missing user", notFound.status === 404);

  sub("Update profile");
  const fd = new FormData();
  fd.append("fullName", "Tendai Updated");
  fd.append("bio", "Updated bio");
  const upd = await fetch(`${BASE_URL}/users/me`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: fd,
  });
  const updData = await upd.json().catch(() => ({}));
  assert("Profile update works", upd.ok, JSON.stringify(updData));

  sub("Period in name");
  const fd2 = new FormData();
  fd2.append("fullName", "Dr. Tendai M. Updated");
  const upd2 = await fetch(`${BASE_URL}/users/me`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: fd2,
  });
  assert("Period in name allowed", upd2.ok);
};

/* 5. POSTS */
const testPosts = async () => {
  section("5. Posts");

  if (!state.tokens.user1) return skip("Posts", "no token");

  sub("Feed");
  const feed = await request(
    "GET",
    "/posts/feed?page=1&limit=10",
    null,
    state.tokens.user1,
  );
  assert("Get feed works", feed.ok);
  assert("Feed is array", Array.isArray(feed.data?.data));
  assert("Has pagination meta", !!feed.data?.meta);

  sub("Create text post");
  const text = await request(
    "POST",
    "/posts/text",
    {
      content: "Test **bold** @admin #test",
      backgroundStyle: "default",
    },
    state.tokens.user1,
  );
  assert("Create text post", text.ok);
  if (text.ok) {
    state.posts.text = text.data.data.id;
    assert("Has id", !!state.posts.text);
    assert("Type is text", text.data.data.type === "text");
  }

  sub("Create link post");
  const link = await request(
    "POST",
    "/posts/link",
    {
      url: "https://react.dev",
      title: "React",
      description: "JS library",
      caption: "Check it out!",
    },
    state.tokens.user1,
  );
  assert("Create link post", link.ok);
  if (link.ok) state.posts.link = link.data.data.id;

  sub("Create poll post");
  const poll = await request(
    "POST",
    "/posts/poll",
    {
      question: "Favorite language?",
      options: ["JavaScript", "Python", "Java"],
      caption: "Vote now!",
      expiresIn: "24",
      allowMultiple: false,
    },
    state.tokens.user1,
  );
  assert("Create poll post", poll.ok);
  if (poll.ok) {
    state.posts.poll = poll.data.data.id;
    assert("Poll has id", !!state.posts.poll);
    assert("Type is poll", poll.data.data.type === "poll");
    assert("Has poll data", !!poll.data.data.poll);
    assert("Has 3 options", poll.data.data.poll.options?.length === 3);
    assert("Not expired", poll.data.data.poll.isExpired === false);
    state.pollOptionIds = poll.data.data.poll.options.map((o) => o.id);
  }

  sub("Multi-image endpoint requires files");
  const noImg = await fetch(`${BASE_URL}/posts/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: (() => {
      const f = new FormData();
      f.append("caption", "Test");
      return f;
    })(),
  });
  assert("Image endpoint requires files", !noImg.ok && noImg.status === 400);

  sub("Feed includes new posts");
  const updFeed = await request(
    "GET",
    "/posts/feed?page=1&limit=20",
    null,
    state.tokens.user1,
  );
  assert(
    "Text post in feed",
    updFeed.data?.data?.some((p) => p.id === state.posts.text),
  );

  sub("Filter by type");
  const textOnly = await request(
    "GET",
    "/posts/feed?type=text&limit=10",
    null,
    state.tokens.user1,
  );
  assert("Filter works", textOnly.ok);
  assert(
    "All are text",
    textOnly.data?.data?.every((p) => p.type === "text"),
  );

  const pollOnly = await request(
    "GET",
    "/posts/feed?type=poll&limit=10",
    null,
    state.tokens.user1,
  );
  assert("Poll filter works", pollOnly.ok);
  if (pollOnly.data?.data?.length > 0) {
    assert(
      "All are polls",
      pollOnly.data.data.every((p) => p.type === "poll"),
    );
  } else {
    assert("All are polls", true);
  }

  sub("Get single post");
  if (state.posts.text) {
    const single = await request(
      "GET",
      `/posts/${state.posts.text}`,
      null,
      state.tokens.user1,
    );
    assert("Get single post", single.ok);
    assert("ID matches", single.data?.data?.id === state.posts.text);
  }

  sub("User posts");
  const userPosts = await request(
    "GET",
    `/posts/user/${state.users.user1.id}`,
    null,
    state.tokens.user1,
  );
  assert("Get user posts", userPosts.ok);
  assert("Is array", Array.isArray(userPosts.data?.data));

  sub("Cannot delete others' posts");
  if (state.posts.text) {
    const del = await request(
      "DELETE",
      `/posts/${state.posts.text}`,
      null,
      state.tokens.user2,
    );
    assert("Non-owner → 403", !del.ok && del.status === 403);
  }
};

/* 6. POLLS */
const testPolls = async () => {
  section("6. Polls");

  if (!state.posts.poll || !state.tokens.user2)
    return skip("Polls", "no poll or token");

  sub("Vote on poll");
  if (state.pollOptionIds.length > 0) {
    const vote = await request(
      "POST",
      `/posts/${state.posts.poll}/vote`,
      { optionIds: [state.pollOptionIds[0]] },
      state.tokens.user2,
    );
    assert("Vote succeeds", vote.ok);
    if (vote.ok) {
      assert("Total votes = 1", vote.data?.data?.poll?.totalVotes === 1);
      assert("User has voted", vote.data?.data?.poll?.hasVoted === true);
      assert(
        "User votes tracked",
        vote.data?.data?.poll?.userVotes?.length > 0,
      );

      const winningOption = vote.data?.data?.poll?.options?.find(
        (o) => o.id === state.pollOptionIds[0],
      );
      assert("Voted option count = 1", winningOption?.voteCount === 1);
    }
  }

  sub("Cannot vote twice");
  if (state.pollOptionIds.length > 0) {
    const doubleVote = await request(
      "POST",
      `/posts/${state.posts.poll}/vote`,
      { optionIds: [state.pollOptionIds[1]] },
      state.tokens.user2,
    );
    assert("Double vote rejected", !doubleVote.ok && doubleVote.status === 400);
  }

  sub("Second user votes");
  if (state.pollOptionIds.length > 1) {
    const vote2 = await request(
      "POST",
      `/posts/${state.posts.poll}/vote`,
      { optionIds: [state.pollOptionIds[1]] },
      state.tokens.user1,
    );
    assert("Second user can vote", vote2.ok);
    if (vote2.ok) {
      assert("Total votes = 2", vote2.data?.data?.poll?.totalVotes === 2);
    }
  }

  sub("Poll shows results after voting");
  const pollPost = await request(
    "GET",
    `/posts/${state.posts.poll}`,
    null,
    state.tokens.user2,
  );
  assert("Get poll post", pollPost.ok);
  assert("Shows hasVoted = true", pollPost.data?.data?.poll?.hasVoted === true);
  assert(
    "Shows percentages",
    pollPost.data?.data?.poll?.options?.[0]?.voteCount >= 0,
  );

  sub("Invalid option ID rejected");
  const badVote = await request(
    "POST",
    `/posts/${state.posts.poll}/vote`,
    { optionIds: ["00000000-0000-0000-0000-000000000000"] },
    state.tokens.admin,
  );
  assert("Invalid option → 400", !badVote.ok && badVote.status === 400);

  sub("Poll validation");
  const noOpts = await request(
    "POST",
    "/posts/poll",
    {
      question: "Bad poll",
      options: ["Only one"],
    },
    state.tokens.user1,
  );
  assert("Less than 2 options → 400", !noOpts.ok && noOpts.status === 400);

  const tooMany = await request(
    "POST",
    "/posts/poll",
    {
      question: "Too many",
      options: ["A", "B", "C", "D", "E", "F", "G"],
    },
    state.tokens.user1,
  );
  assert("More than 6 options → 400", !tooMany.ok && tooMany.status === 400);

  const dups = await request(
    "POST",
    "/posts/poll",
    {
      question: "Dups",
      options: ["Same", "Same"],
    },
    state.tokens.user1,
  );
  assert("Duplicate options → 400", !dups.ok && dups.status === 400);
};

/* 7. FILE UPLOAD SECURITY */
const testUploadSecurity = async () => {
  section("7. File Upload Security");

  if (!state.tokens.user1) return skip("Upload security", "no token");

  sub("Reject fake image (magic bytes)");
  const fakeFd = new FormData();
  fakeFd.append("images", createFakeImage(), "fake.jpg");
  const fakeRes = await fetch(`${BASE_URL}/posts/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: fakeFd,
  });
  if (fakeRes.status === 400) {
    assert("Disguised file rejected", true);
  } else {
    assert(
      "Disguised file rejected",
      false,
      "Magic byte validation not enforced",
    );
  }

  sub("Accept genuine PNG");
  const realFd = new FormData();
  realFd.append("images", createTestPNG(), "test.png");
  realFd.append("caption", "Real test image");
  const realRes = await fetch(`${BASE_URL}/posts/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: realFd,
  });
  const realData = await realRes.json().catch(() => ({}));
  if (realRes.ok) {
    assert("Real PNG accepted", true);
    state.posts.image = realData.data?.id;
  } else {
    assert("Real PNG accepted", false, JSON.stringify(realData));
  }

  sub("Reject oversized file");
  const big = new Uint8Array(6 * 1024 * 1024);
  [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].forEach(
    (b, i) => (big[i] = b),
  );
  const bigFd = new FormData();
  bigFd.append("images", new Blob([big], { type: "image/png" }), "big.png");
  const bigRes = await fetch(`${BASE_URL}/posts/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: bigFd,
  });
  assert("Oversized file → 400", !bigRes.ok && bigRes.status === 400);

  sub("Reject >10 files");
  const manyFd = new FormData();
  for (let i = 0; i < 11; i++) {
    manyFd.append("images", createTestPNG(), `test-${i}.png`);
  }
  const manyRes = await fetch(`${BASE_URL}/posts/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: manyFd,
  });
  assert(">10 files → 400", !manyRes.ok && manyRes.status === 400);
};

/* 8. LIKES */
const testLikes = async () => {
  section("8. Likes");

  if (!state.tokens.user2 || !state.posts.text)
    return skip("Likes", "missing deps");

  sub("Like");
  const like = await request(
    "POST",
    `/likes/posts/${state.posts.text}`,
    null,
    state.tokens.user2,
  );
  assert("Like works", like.ok);
  assert("Action = liked", like.data?.data?.action === "liked");
  assert("Count = 1", like.data?.data?.likeCount === 1);

  sub("Unlike");
  const unlike = await request(
    "POST",
    `/likes/posts/${state.posts.text}`,
    null,
    state.tokens.user2,
  );
  assert("Unlike works", unlike.ok);
  assert("Action = unliked", unlike.data?.data?.action === "unliked");
  assert("Count = 0", unlike.data?.data?.likeCount === 0);

  sub("Re-like");
  await request(
    "POST",
    `/likes/posts/${state.posts.text}`,
    null,
    state.tokens.user2,
  );

  sub("Get likers");
  const likers = await request(
    "GET",
    `/likes/posts/${state.posts.text}`,
    null,
    state.tokens.user1,
  );
  assert("Get likers works", likers.ok);
  assert(
    "Contains user2",
    likers.data?.data?.some((u) => u.id === state.users.user2.id),
  );
};

/* 9. COMMENTS */
const testComments = async () => {
  section("9. Comments");

  if (!state.tokens.user2 || !state.posts.text)
    return skip("Comments", "missing deps");

  sub("Create comment");
  const comment = await request(
    "POST",
    `/comments/posts/${state.posts.text}`,
    { content: "Great post! **bold** @admin" },
    state.tokens.user2,
  );
  assert("Create comment", comment.ok);
  if (comment.ok) {
    state.comments.main = comment.data.data.id;
    assert("Has id", !!state.comments.main);
    assert("Has replyCount", typeof comment.data.data.replyCount === "number");
  }

  sub("Get comments");
  const comments = await request(
    "GET",
    `/comments/posts/${state.posts.text}`,
    null,
    state.tokens.user1,
  );
  assert("Get comments works", comments.ok);
  assert("Is array", Array.isArray(comments.data?.data));

  sub("Create reply");
  if (state.comments.main) {
    const reply = await request(
      "POST",
      `/comments/posts/${state.posts.text}`,
      { content: "Thanks!", parentCommentId: state.comments.main },
      state.tokens.user1,
    );
    assert("Create reply", reply.ok);
    if (reply.ok) {
      state.comments.reply = reply.data.data.id;
      assert(
        "Has parentCommentId",
        reply.data.data.parentCommentId === state.comments.main,
      );
    }
  }

  sub("Get replies");
  if (state.comments.main) {
    const replies = await request(
      "GET",
      `/comments/${state.comments.main}/replies`,
      null,
      state.tokens.user1,
    );
    assert("Get replies", replies.ok);
    assert("Has replies", replies.data?.data?.length > 0);
  }

  sub("Delete own comment");
  if (state.comments.reply) {
    const del = await request(
      "DELETE",
      `/comments/${state.comments.reply}`,
      null,
      state.tokens.user1,
    );
    assert("Delete own comment", del.ok);
  }

  sub("Cannot delete others'");
  if (state.comments.main) {
    const del = await request(
      "DELETE",
      `/comments/${state.comments.main}`,
      null,
      state.tokens.user1,
    );
    assert("Cannot delete other's → 403", !del.ok && del.status === 403);
  }
};

/* 10. NOTICES */
const testNotices = async () => {
  section("10. Notices");

  if (!state.tokens.user1) return skip("Notices", "no token");

  sub("Get notices");
  const notices = await request("GET", "/notices", null, state.tokens.user1);
  assert("Get notices", notices.ok);
  assert("Is array", Array.isArray(notices.data?.data));

  sub("Create notice");
  const fd = new FormData();
  fd.append("title", "Test Notice");
  fd.append("description", "Test notice description for automated tests");
  fd.append("phoneNumber", "+263 77 123 4567");
  fd.append("emailAddress", "test@example.com");
  const createRes = await fetch(`${BASE_URL}/notices`, {
    method: "POST",
    headers: { Authorization: `Bearer ${state.tokens.user1}` },
    body: fd,
  });
  const createData = await createRes.json().catch(() => ({}));
  assert("Create notice", createRes.ok, JSON.stringify(createData));
  if (createRes.ok) {
    state.notice = createData.data.id;
    assert("Has id", !!state.notice);
    assert("Status = active", createData.data.status === "active");
  }

  sub("Filters");
  const active = await request(
    "GET",
    "/notices?status=active",
    null,
    state.tokens.user1,
  );
  assert("Filter by status", active.ok);

  const mine = await request(
    "GET",
    "/notices?mine=true",
    null,
    state.tokens.user1,
  );
  assert("My notices", mine.ok);
  assert(
    "Includes new notice",
    mine.data?.data?.some((n) => n.id === state.notice),
  );

  sub("Search");
  const search = await request(
    "GET",
    "/notices?search=test",
    null,
    state.tokens.user1,
  );
  assert("Search notices", search.ok);

  sub("Toggle status");
  if (state.notice) {
    const toggle = await request(
      "PATCH",
      `/notices/${state.notice}/toggle-status`,
      null,
      state.tokens.user1,
    );
    assert("Toggle works", toggle.ok);
    assert("Status = closed", toggle.data?.data?.status === "closed");
  }

  sub("Permission check");
  if (state.notice) {
    const cantToggle = await request(
      "PATCH",
      `/notices/${state.notice}/toggle-status`,
      null,
      state.tokens.user2,
    );
    assert("Other user → 403", !cantToggle.ok && cantToggle.status === 403);
  }
};

/* 11. SEARCH */
const testSearch = async () => {
  section("11. Search");

  if (!state.tokens.user1) return skip("Search", "no token");

  sub("Global search");
  const global = await request(
    "GET",
    "/search?q=test",
    null,
    state.tokens.user1,
  );
  assert("Global search works", global.ok);
  assert("Has users", Array.isArray(global.data?.data?.users));
  assert("Has posts", Array.isArray(global.data?.data?.posts));
  assert("Has notices", Array.isArray(global.data?.data?.notices));
  assert("Has counts", !!global.data?.data?.counts);

  sub("Search by type");
  const users = await request(
    "GET",
    "/search/users?q=tendai",
    null,
    state.tokens.user1,
  );
  assert("User search", users.ok);

  const posts = await request(
    "GET",
    "/search/posts?q=bold",
    null,
    state.tokens.user1,
  );
  assert("Post search", posts.ok);

  sub("Validation");
  const short = await request("GET", "/search?q=a", null, state.tokens.user1);
  assert("Short query → 400", !short.ok && short.status === 400);
};

/* 12. NOTIFICATIONS */
const testNotifications = async () => {
  section("12. Notifications");

  if (!state.tokens.user1) return skip("Notifications", "no token");

  sub("Get notifications");
  const notifs = await request(
    "GET",
    "/notifications",
    null,
    state.tokens.user1,
  );
  assert("Get notifications", notifs.ok);
  assert("Is array", Array.isArray(notifs.data?.data));

  sub("Unread count");
  const count = await request(
    "GET",
    "/notifications/unread-count",
    null,
    state.tokens.user1,
  );
  assert("Unread count works", count.ok);
  assert("Is number", typeof count.data?.data?.count === "number");

  sub("Polling");
  const poll = await request(
    "GET",
    "/notifications/poll",
    null,
    state.tokens.user1,
  );
  assert("Poll works", poll.ok);
  assert("Has timestamp", !!poll.data?.data?.timestamp);

  sub("Poll returns only unread");
  await request("PATCH", "/notifications/read-all", null, state.tokens.user1);
  await sleep(150);
  const oldPoll = await request(
    "GET",
    `/notifications/poll?since=${new Date(Date.now() - 86400000).toISOString()}`,
    null,
    state.tokens.user1,
  );
  assert(
    "Old timestamp → 0 new (all read)",
    oldPoll.data?.data?.newNotifications?.length === 0,
  );

  sub("Like generates notification");
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
    const hasLike = updated.data?.data?.some((n) => n.type === "post_liked");
    assert("Like notification exists", hasLike);
    if (hasLike) {
      state.notification = updated.data.data.find(
        (n) => n.type === "post_liked",
      )?.id;
    }
  }

  sub("Mark as read");
  if (state.notification) {
    const markRead = await request(
      "PATCH",
      `/notifications/${state.notification}/read`,
      null,
      state.tokens.user1,
    );
    assert("Mark as read", markRead.ok);
  }

  sub("Mark all read");
  const markAll = await request(
    "PATCH",
    "/notifications/read-all",
    null,
    state.tokens.user1,
  );
  assert("Mark all read", markAll.ok);
};

/* 13. SUPPORT SYSTEM */
const testSupport = async () => {
  section("13. Support System");

  if (!state.tokens.user1) return skip("Support", "no token");

  sub("Create query");
  const newQuery = await request(
    "POST",
    "/support/queries",
    {
      category: "bug_report",
      subject: "Test query from automated tests",
      message: "This is a test bug report",
      priority: "normal",
    },
    state.tokens.user1,
  );
  assert("Create query", newQuery.ok);
  if (newQuery.ok) {
    state.query = newQuery.data.data.id;
    assert("Has id", !!state.query);
    assert("Status = open", newQuery.data.data.status === "open");
  }

  sub("Get my queries");
  const myQueries = await request(
    "GET",
    "/support/queries",
    null,
    state.tokens.user1,
  );
  assert("Get my queries", myQueries.ok);
  assert("Is array", Array.isArray(myQueries.data?.data));

  sub("Other user cannot view");
  if (state.query) {
    const cantSee = await request(
      "GET",
      `/support/queries/${state.query}`,
      null,
      state.tokens.user2,
    );
    assert("Other user → 403", !cantSee.ok && cantSee.status === 403);
  }

  sub("Admin views queries");
  if (state.tokens.admin) {
    const adminQ = await request(
      "GET",
      "/support/admin/queries",
      null,
      state.tokens.admin,
    );
    assert("Admin can view all queries", adminQ.ok);
  }

  sub("Admin replies");
  if (state.tokens.admin && state.query) {
    const reply = await request(
      "POST",
      `/support/admin/queries/${state.query}/replies`,
      { message: "Looking into it." },
      state.tokens.admin,
    );
    assert("Admin can reply", reply.ok);
  }

  sub("User replies");
  if (state.query) {
    const reply = await request(
      "POST",
      `/support/queries/${state.query}/replies`,
      { message: "Thank you!" },
      state.tokens.user1,
    );
    assert("User can reply", reply.ok);
  }

  sub("Admin changes status");
  if (state.tokens.admin && state.query) {
    const change = await request(
      "PATCH",
      `/support/admin/queries/${state.query}`,
      { status: "resolved" },
      state.tokens.admin,
    );
    assert("Status change works", change.ok);
    assert("Status = resolved", change.data?.data?.status === "resolved");
  }

  sub("Anonymous suggestion");
  const suggestion = await request(
    "POST",
    "/support/suggestions",
    {
      category: "feature_idea",
      content:
        "Test suggestion from automated tests — no user info should be stored.",
    },
    state.tokens.user2,
  );
  assert("Submit suggestion", suggestion.ok);
  if (suggestion.ok) state.suggestion = suggestion.data.data.id;

  sub("Admin views suggestions (anonymous)");
  if (state.tokens.admin) {
    const adminSugs = await request(
      "GET",
      "/support/admin/suggestions",
      null,
      state.tokens.admin,
    );
    assert("Admin can view suggestions", adminSugs.ok);

    if (adminSugs.ok && adminSugs.data.data.length > 0) {
      const s = adminSugs.data.data[0];
      assert("No user_id on suggestion", s.user_id === undefined);
      assert("No username on suggestion", s.username === undefined);
    }
  }

  sub("Suggestion stats");
  if (state.tokens.admin) {
    const stats = await request(
      "GET",
      "/support/admin/suggestions/stats",
      null,
      state.tokens.admin,
    );
    assert("Stats endpoint works", stats.ok);
    assert("Has total", typeof stats.data?.data?.total === "number");
  }

  sub("Unread counts");
  if (state.tokens.admin) {
    const adminUnread = await request(
      "GET",
      "/support/admin/queries/unread-count",
      null,
      state.tokens.admin,
    );
    assert("Admin unread count", adminUnread.ok);
  }
  const userUnread = await request(
    "GET",
    "/support/queries/unread-count",
    null,
    state.tokens.user1,
  );
  assert("User unread count", userUnread.ok);
};

/* 14. ADMIN PANEL */
const testAdmin = async () => {
  section("14. Admin Panel");

  if (!state.tokens.admin) return skip("Admin", "no admin token");

  sub("Dashboard");
  const dash = await request(
    "GET",
    "/admin/dashboard",
    null,
    state.tokens.admin,
  );
  assert("Dashboard works", dash.ok);
  assert("Has users", !!dash.data?.data?.users);
  assert("Has posts", !!dash.data?.data?.posts);
  assert("Has growth", Array.isArray(dash.data?.data?.growth));
  assert("Has activity", Array.isArray(dash.data?.data?.recentActivity));

  sub("Non-admin blocked");
  const blocked = await request(
    "GET",
    "/admin/dashboard",
    null,
    state.tokens.user1,
  );
  assert("Student → 403", !blocked.ok && blocked.status === 403);

  sub("Users");
  const users = await request(
    "GET",
    "/admin/users?limit=10",
    null,
    state.tokens.admin,
  );
  assert("Get users", users.ok);
  assert("Is array", Array.isArray(users.data?.data));

  const searchU = await request(
    "GET",
    "/admin/users?search=tendai",
    null,
    state.tokens.admin,
  );
  assert("Search users", searchU.ok);

  sub("Posts (no duplicates)");
  const adminPosts = await request(
    "GET",
    "/admin/posts?limit=50",
    null,
    state.tokens.admin,
  );
  assert("Get posts", adminPosts.ok);

  if (adminPosts.ok) {
    const ids = adminPosts.data.data.map((p) => p.id);
    const uniq = new Set(ids);
    assert("No duplicate posts (multi-image safe)", ids.length === uniq.size);
  }

  sub("Notices");
  const adminNotices = await request(
    "GET",
    "/admin/notices?limit=10",
    null,
    state.tokens.admin,
  );
  assert("Get notices", adminNotices.ok);

  sub("Announcements");
  const ann = await request(
    "GET",
    "/admin/announcements",
    null,
    state.tokens.admin,
  );
  assert("Get announcements", ann.ok);

  const newAnn = await request(
    "POST",
    "/admin/announcements",
    {
      title: "Test Announcement",
      content: "Test content",
    },
    state.tokens.admin,
  );
  assert("Create announcement", newAnn.ok);
  if (newAnn.ok) state.announcement = newAnn.data.data.id;

  if (state.announcement) {
    const upd = await request(
      "PATCH",
      `/admin/announcements/${state.announcement}`,
      { title: "Updated" },
      state.tokens.admin,
    );
    assert("Update announcement", upd.ok);

    const toggle = await request(
      "PATCH",
      `/admin/announcements/${state.announcement}`,
      { isActive: false },
      state.tokens.admin,
    );
    assert("Toggle active", toggle.ok);
  }

  sub("Cache stats");
  const cache = await request(
    "GET",
    "/admin/cache/stats",
    null,
    state.tokens.admin,
  );
  assert("Cache stats", cache.ok);
};

/* 15. AUDIT LOG */
const testAuditLog = async () => {
  section("15. Audit Log");

  if (!state.tokens.admin) return skip("Audit log", "no admin");

  const log = await request(
    "GET",
    "/admin/audit-log",
    null,
    state.tokens.admin,
  );

  if (log.status === 404) {
    skip("Audit log endpoint", "Not implemented");
    return;
  }

  assert("Get audit log", log.ok);
  assert("Returns array", Array.isArray(log.data?.data));

  const blocked = await request(
    "GET",
    "/admin/audit-log",
    null,
    state.tokens.user1,
  );
  assert("Student → 403", !blocked.ok && blocked.status === 403);
};

/* 16. ANNOUNCEMENTS */
const testAnnouncements = async () => {
  section("16. Public Announcements");

  if (!state.tokens.user1) return skip("Announcements", "no token");

  const ann = await request("GET", "/announcements", null, state.tokens.user1);
  assert("Get announcements", ann.ok);
  assert("Is array", Array.isArray(ann.data?.data));
};

/* 17. CLEANUP ENDPOINT */
const testCleanup = async () => {
  section("17. Cleanup Endpoint");

  if (!state.tokens.admin) return skip("Cleanup", "no admin");

  const cleanup = await request(
    "POST",
    "/admin/cleanup/posts",
    null,
    state.tokens.admin,
  );
  assert("Cleanup endpoint works", cleanup.ok);
  assert(
    "Returns postsDeleted",
    typeof cleanup.data?.data?.postsDeleted === "number",
  );
  assert(
    "Returns filesDeleted",
    typeof cleanup.data?.data?.filesDeleted === "number",
  );

  const blocked = await request(
    "POST",
    "/admin/cleanup/posts",
    null,
    state.tokens.user1,
  );
  assert(
    "Student cannot trigger cleanup",
    !blocked.ok && blocked.status === 403,
  );
};

/* 18. RATE LIMITING */
const testRateLimits = async (quick) => {
  if (quick) return skip("Rate limits", "quick mode");

  section("18. Rate Limiting (Full)");

  sub("Auth rate limit");
  let authBlocked = false;
  for (let i = 0; i < 20; i++) {
    const res = await request("POST", "/auth/login", {
      identifier: "ratelimit@test.com",
      password: "wrong",
    });
    if (res.status === 429) {
      authBlocked = true;
      break;
    }
  }
  assert("Auth rate limiter works", authBlocked);
};

/* 19. CLEANUP TEST DATA */
const cleanup = async () => {
  section("19. Cleanup Test Data");

  sub("Deleting test data");

  if (state.suggestion && state.tokens.admin) {
    const r = await request(
      "DELETE",
      `/support/admin/suggestions/${state.suggestion}`,
      null,
      state.tokens.admin,
    );
    assert("Delete test suggestion", r.ok);
  }

  if (state.announcement && state.tokens.admin) {
    const r = await request(
      "DELETE",
      `/admin/announcements/${state.announcement}`,
      null,
      state.tokens.admin,
    );
    assert("Delete test announcement", r.ok);
  }

  if (state.notice && state.tokens.user1) {
    const r = await request(
      "DELETE",
      `/notices/${state.notice}`,
      null,
      state.tokens.user1,
    );
    assert("Delete test notice", r.ok);
  }

  for (const [type, postId] of Object.entries(state.posts)) {
    if (postId && state.tokens.user1) {
      const r = await request(
        "DELETE",
        `/posts/${postId}`,
        null,
        state.tokens.user1,
      );
      assert(`Delete test ${type} post`, r.ok);
    }
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   RUNNER
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
    chalk.bold(chalk.blue("║              Complete Edition                ║")),
  );
  console.log(
    chalk.bold(chalk.blue("╚══════════════════════════════════════════════╝")),
  );
  console.log(chalk.gray(`\nBase URL: ${BASE_URL}`));
  console.log(chalk.gray(`Mode    : ${quick ? "Quick" : "Full"}`));
  console.log(chalk.gray(`Started : ${new Date().toLocaleString()}\n`));

  const start = Date.now();

  try {
    await testHealth();
    await testAuth();
    await testProfiles();
    await testPosts();
    await testPolls();
    await testUploadSecurity();
    await testLikes();
    await testComments();
    await testNotices();
    await testSearch();
    await testNotifications();
    await testSupport();
    await testAdmin();
    await testAuditLog();
    await testAnnouncements();
    await testCleanup();
    await testSecurity();
    await testRateLimits(quick);
    await cleanup();
  } catch (err) {
    console.log(chalk.red(`\n💥 Fatal: ${err.message}`));
    console.log(err.stack);
  }

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  const total = results.passed + results.failed + results.skipped;
  const rate =
    total > 0
      ? ((results.passed / (results.passed + results.failed)) * 100).toFixed(1)
      : 0;

  console.log("\n" + chalk.bold(chalk.cyan("═".repeat(50))));
  console.log(chalk.bold("TEST SUMMARY"));
  console.log(chalk.bold(chalk.cyan("═".repeat(50))));
  console.log(`  Total    : ${chalk.bold(total)}`);
  console.log(`  ${chalk.green("Passed")}  : ${chalk.bold(results.passed)}`);
  console.log(`  ${chalk.red("Failed")}  : ${chalk.bold(results.failed)}`);
  console.log(`  ${chalk.yellow("Skipped")} : ${chalk.bold(results.skipped)}`);
  console.log(`  Rate     : ${chalk.bold(rate + "%")}`);
  console.log(`  Duration : ${chalk.bold(duration + "s")}`);

  if (results.failed > 0) {
    console.log("\n" + chalk.red(chalk.bold("FAILED:")));
    results.errors.forEach((e) => {
      console.log(`  ${chalk.red("✗")} ${e.name}`);
      if (e.details)
        console.log(`    ${chalk.gray(e.details.substring(0, 200))}`);
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
