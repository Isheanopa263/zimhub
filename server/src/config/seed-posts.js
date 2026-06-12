require("dotenv").config();
const { query, pool } = require("./database");

async function seedPosts() {
  console.log("🌱 Seeding sample posts...");

  try {
    // Get user IDs
    const users = await query(
      `SELECT u.id, u.username FROM users u 
       WHERE u.role = 'student' ORDER BY u.created_at`,
    );

    if (users.rows.length === 0) {
      console.log("❌ No students found. Run npm run seed first.");
      return;
    }

    const [user1, user2, user3] = users.rows;

    // ── Text Posts ──────────────────────────────────────────────
    const textPosts = [
      {
        userId: user1.id,
        content:
          "Just finished my Computer Networks assignment! 🎉 Who else is taking CS301 this semester?",
        style: "gradient-blue",
      },
      {
        userId: user2.id,
        content:
          "The library is packed today. Anyone know a quiet spot to study on campus? 📚",
        style: "gradient-purple",
      },
      {
        userId: user3?.id || user1.id,
        content:
          "Pro tip: Start your thesis research early. I wish someone told me this in Year 2! 😅",
        style: "gradient-green",
      },
      {
        userId: user1.id,
        content:
          "Looking for teammates for the upcoming hackathon. Need a UI designer and a backend developer. DM me! 💻",
        style: "gradient-orange",
      },
      {
        userId: user2.id,
        content:
          "Can we talk about how amazing the new campus cafeteria is? The jollof rice is fire 🔥",
        style: "gradient-pink",
      },
      {
        userId: user3?.id || user2.id,
        content:
          "Exam season is approaching... time to actually open those textbooks 📖😂",
        style: "gradient-dark",
      },
    ];

    for (const tp of textPosts) {
      const postResult = await query(
        `INSERT INTO posts (user_id, post_type)
         VALUES ($1, 'text')
         RETURNING id`,
        [tp.userId],
      );

      await query(
        `INSERT INTO post_text_posts (post_id, content, background_style)
         VALUES ($1, $2, $3)`,
        [postResult.rows[0].id, tp.content, tp.style],
      );
    }
    console.log(`✅ ${textPosts.length} text posts created`);

    // ── Link Posts ──────────────────────────────────────────────
    const linkPosts = [
      {
        userId: user1.id,
        caption: "Great resource for learning React!",
        url: "https://react.dev",
        title: "React Documentation",
        description: "The library for web and native user interfaces",
      },
      {
        userId: user2.id,
        caption: "Free courses from top universities",
        url: "https://www.coursera.org",
        title: "Coursera",
        description: "Build skills with courses from top universities",
      },
      {
        userId: user3?.id || user1.id,
        caption: "This helped me ace my Data Structures exam",
        url: "https://visualgo.net",
        title: "VisuAlgo",
        description: "Visualizing data structures and algorithms",
      },
    ];

    for (const lp of linkPosts) {
      const postResult = await query(
        `INSERT INTO posts (user_id, post_type, caption)
         VALUES ($1, 'link', $2)
         RETURNING id`,
        [lp.userId, lp.caption],
      );

      await query(
        `INSERT INTO post_links (post_id, title, description, url)
         VALUES ($1, $2, $3, $4)`,
        [postResult.rows[0].id, lp.title, lp.description, lp.url],
      );
    }
    console.log(`✅ ${linkPosts.length} link posts created`);

    // ── Sample Likes ──────────────────────────────────────────
    const allPosts = await query("SELECT id FROM posts ORDER BY created_at");

    for (const post of allPosts.rows.slice(0, 5)) {
      for (const user of users.rows.slice(0, 2)) {
        await query(
          `INSERT INTO likes (user_id, post_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [user.id, post.id],
        );
      }
    }
    console.log("✅ Sample likes created");

    // ── Sample Comments ────────────────────────────────────────
    const comments = [
      "Great post! 🔥",
      "I totally agree with this!",
      "Thanks for sharing! 🙏",
      "This is super helpful",
      "Can relate to this 😂",
    ];

    for (let i = 0; i < Math.min(5, allPosts.rows.length); i++) {
      const commenter = users.rows[i % users.rows.length];
      await query(
        `INSERT INTO comments (user_id, post_id, content)
         VALUES ($1, $2, $3)`,
        [commenter.id, allPosts.rows[i].id, comments[i]],
      );
    }
    console.log("✅ Sample comments created");

    console.log("\n🎉 Posts seeded successfully!\n");
  } catch (error) {
    console.error("❌ Seed posts failed:", error.message);
  } finally {
    await pool.end();
  }
}

seedPosts();
