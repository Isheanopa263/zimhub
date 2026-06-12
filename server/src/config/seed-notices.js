require("dotenv").config();
const { query, pool } = require("./database");

async function seedNotices() {
  console.log("🌱 Seeding sample notices...");

  try {
    const users = await query(
      `SELECT id FROM users WHERE role = 'student' ORDER BY created_at`,
    );

    if (users.rows.length === 0) {
      console.log("❌ No students found.");
      return;
    }

    const [u1, u2, u3] = users.rows;

    const notices = [
      {
        userId: u1.id,
        title: "Looking for Accommodation Near Campus",
        description:
          "I am looking for a single room or shared apartment within 2km of campus. Budget is $150/month. Need it from next month. Please contact me if you have any leads!",
        phone: "+263 77 234 5678",
        whatsapp: "+263 77 234 5678",
        email: null,
        status: "active",
      },
      {
        userId: u2.id,
        title: "Lost: Black Backpack",
        description:
          "Lost my black Nike backpack at the cafeteria yesterday around 2pm. Contains my laptop and important notes. Please reach out if found — generous reward offered!",
        phone: null,
        whatsapp: "+263 78 345 6789",
        email: "chidi@uni.ac.zw",
        status: "active",
      },
      {
        userId: u3?.id || u1.id,
        title: "Math Tutoring Services Available",
        description:
          "Final year Math major offering tutoring for Calculus I, II, and Linear Algebra. $10/hour, group rates available. Available evenings and weekends. Helped 20+ students pass last semester!",
        phone: "+263 71 456 7890",
        whatsapp: "+263 71 456 7890",
        email: "rudo@uni.ac.zw",
        status: "active",
      },
      {
        userId: u1.id,
        title: "Study Group: Computer Networks (CS301)",
        description:
          "Forming a study group for CS301 — meets Wednesdays 6pm at the library. We are 4 people so far, need 2-3 more. Serious students only please!",
        phone: null,
        whatsapp: "+263 77 234 5678",
        email: null,
        status: "active",
      },
      {
        userId: u2.id,
        title: "Tech Talk: AI in Healthcare — This Friday",
        description:
          'Free tech talk by industry expert Dr. Tendai Sibanda on "AI Applications in Healthcare". Friday 5pm, Auditorium B. Pizza and refreshments provided! RSVP required.',
        phone: null,
        whatsapp: null,
        email: "chidi@uni.ac.zw",
        status: "active",
      },
      {
        userId: u3?.id || u2.id,
        title: "Internship Opportunity: Software Engineering",
        description:
          "TechCorp Zimbabwe is hiring summer interns. Stipend provided. Open to 3rd and 4th year CS/IT students. Application deadline: 30th of this month. Send CV to email below.",
        phone: null,
        whatsapp: null,
        email: "rudo@uni.ac.zw",
        status: "closed",
      },
    ];

    for (const n of notices) {
      await query(
        `INSERT INTO notices (
           user_id, title, description,
           phone_number, whatsapp_number, email_address, status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          n.userId,
          n.title,
          n.description,
          n.phone,
          n.whatsapp,
          n.email,
          n.status,
        ],
      );
    }

    console.log(`✅ ${notices.length} sample notices created\n`);
  } catch (error) {
    console.error("❌ Seed notices failed:", error.message);
  } finally {
    await pool.end();
  }
}

seedNotices();
