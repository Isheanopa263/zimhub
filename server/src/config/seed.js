require("dotenv").config();
const bcrypt = require("bcryptjs");
const { query, pool } = require("./database");

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // ── Admin User ──────────────────────────────────────────────
    const adminPassword = await bcrypt.hash("Admin@1234", 12);

    const adminResult = await query(
      `INSERT INTO users (username, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, 'admin', true)
       ON CONFLICT (email) DO UPDATE 
         SET password_hash = EXCLUDED.password_hash,
             role = 'admin',
             is_verified = true
       RETURNING id, username, email, role`,
      ["admin", "admin@zimhub.ac.zw", adminPassword],
    );

    const admin = adminResult.rows[0];
    console.log("✅ Admin user:", admin.email);

    // Admin profile
    await query(
      `INSERT INTO profiles (user_id, full_name, bio)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
         SET full_name = EXCLUDED.full_name`,
      [admin.id, "ZimHub Administrator", "Platform Administrator"],
    );

    // ── Test Students ───────────────────────────────────────────
    const students = [
      {
        username: "tendai_m",
        email: "tendai@uni.ac.zw",
        fullName: "Tendai Mukamuri",
        bio: "Computer Science Student | Year 3",
      },
      {
        username: "chidi_o",
        email: "chidi@uni.ac.zw",
        fullName: "Chidi Okafor",
        bio: "Engineering Student | Loves football ⚽",
      },
      {
        username: "rudo_n",
        email: "rudo@uni.ac.zw",
        fullName: "Rudo Ndlovu",
        bio: "Medicine | Final Year 💉",
      },
    ];

    const studentPassword = await bcrypt.hash("Student@1234", 12);

    for (const student of students) {
      const result = await query(
        `INSERT INTO users (username, email, password_hash, role, is_verified)
         VALUES ($1, $2, $3, 'student', true)
         ON CONFLICT (email) DO UPDATE 
           SET username = EXCLUDED.username
         RETURNING id, username`,
        [student.username, student.email, studentPassword],
      );

      const user = result.rows[0];

      await query(
        `INSERT INTO profiles (user_id, full_name, bio)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE
           SET full_name = EXCLUDED.full_name,
               bio = EXCLUDED.bio`,
        [user.id, student.fullName, student.bio],
      );

      console.log(`✅ Student: ${user.username} (${student.email})`);
    }

    // ── Sample Announcement ─────────────────────────────────────
    await query(
      `INSERT INTO announcements (user_id, title, content)
       VALUES (
         (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
         $1, $2
       )
       ON CONFLICT DO NOTHING`,
      [
        "🎉 Welcome to ZimHub!",
        "Welcome to ZimHub — your private student community platform! Share posts, connect with fellow students, and check the notice board for opportunities. If you have any issues, contact admin.",
      ],
    );

    console.log("✅ Sample announcement created");

    // ── Sample Notice ───────────────────────────────────────────
    const firstStudent = await query(
      `SELECT id FROM users WHERE role = 'student' LIMIT 1`,
    );

    if (firstStudent.rows.length > 0) {
      await query(
        `INSERT INTO notices (user_id, title, description, phone_number, status)
         VALUES ($1, $2, $3, $4, 'active')`,
        [
          firstStudent.rows[0].id,
          "Looking for Study Group - Computer Networks",
          "Hi! I am looking for students studying Computer Networks (CS301) to form a study group. We can meet at the library on weekends. Please reach out if interested!",
          "+263 77 123 4567",
        ],
      );
      console.log("✅ Sample notice created");
    }

    console.log("\n🎉 Database seeded successfully!\n");
    console.log("─────────────────────────────────────");
    console.log("Test Credentials:");
    console.log("─────────────────────────────────────");
    console.log("Admin:   admin@zimhub.ac.zw  / Admin@1234");
    console.log("Student: tendai@uni.ac.zw    / Student@1234");
    console.log("Student: chidi@uni.ac.zw     / Student@1234");
    console.log("Student: rudo@uni.ac.zw      / Student@1234");
    console.log("─────────────────────────────────────\n");
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();
