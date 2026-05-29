import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// COURSES API
// ----------------------------------------------------

// Get all courses with their skill names and upcoming sessions
app.get("/api/courses", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.course_id as id, 
        c.title, 
        c.description, 
        c.credit_cost, 
        c.skill_id,
        s.skill_name,
        cs.session_id,
        cs.start_date,
        cs.slots
      FROM course c
      LEFT JOIN skill s ON c.skill_id = s.skill_id
      LEFT JOIN coursesession cs ON c.course_id = cs.course_id
    `);

    // Group sessions by course
    const coursesMap = new Map();
    rows.forEach(row => {
      if (!coursesMap.has(row.id)) {
        coursesMap.set(row.id, {
          id: row.id.toString(),
          title: row.title,
          description: row.description,
          credit_cost: row.credit_cost,
          skill_id: row.skill_id ? row.skill_id.toString() : null,
          skills: row.skill_name ? { name: row.skill_name } : null,
          course_sessions: []
        });
      }
      
      if (row.session_id) {
        coursesMap.get(row.id).course_sessions.push({
          id: row.session_id.toString(),
          start_date: row.start_date,
          slots: row.slots
        });
      }
    });

    res.json(Array.from(coursesMap.values()));
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all skills
app.get("/api/skills", async (req, res) => {
  try {
    const [skills] = await db.query("SELECT skill_id as id, skill_name as name FROM skill ORDER BY skill_name");
    res.json(skills.map(s => ({ id: s.id.toString(), name: s.name })));
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new skill
app.post("/api/skills", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    // Check if it already exists
    const [existing] = await db.query("SELECT skill_id FROM skill WHERE skill_name = ?", [name]);
    if (existing.length > 0) {
      return res.json({ id: existing[0].skill_id.toString(), name });
    }
    
    // Insert if new
    const [result] = await db.query("INSERT INTO skill (skill_name) VALUES (?)", [name]);
    res.json({ id: result.insertId.toString(), name });
  } catch (error) {
    console.error("Error creating skill:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new course
app.post("/api/courses", async (req, res) => {
  const { title, description, credit_cost, skill_id, created_by } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO course (title, description, credit_cost, skill_id, created_by) VALUES (?, ?, ?, ?, ?)",
      [title, description, credit_cost, skill_id, created_by]
    );
    res.json({ id: result.insertId.toString() });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Get a single course by ID with its sessions
app.get("/api/courses/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [courseRows] = await db.query(`
      SELECT 
        c.course_id as id, 
        c.title, 
        c.description, 
        c.credit_cost, 
        s.skill_name 
      FROM course c
      LEFT JOIN skill s ON c.skill_id = s.skill_id
      WHERE c.course_id = ?
    `, [id]);

    if (courseRows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    const course = {
      id: courseRows[0].id.toString(),
      title: courseRows[0].title,
      description: courseRows[0].description,
      credit_cost: courseRows[0].credit_cost,
      skills: courseRows[0].skill_name ? { name: courseRows[0].skill_name } : null,
    };

    const [sessionRows] = await db.query(`
      SELECT 
        cs.session_id as id,
        cs.start_date,
        cs.end_date,
        cs.mode,
        cs.slots,
        (SELECT COUNT(*) FROM enrollment e WHERE e.session_id = cs.session_id AND e.status = 'Active') as taken,
        u.name as mentor_name,
        u.email as mentor_email,
        u.phone as mentor_phone
      FROM coursesession cs
      JOIN user u ON cs.mentor_id = u.user_id
      WHERE cs.course_id = ?
      ORDER BY cs.start_date ASC
    `, [id]);

    const sessions = sessionRows.map(s => ({
      id: s.id.toString(),
      start_date: s.start_date,
      end_date: s.end_date,
      mode: s.mode,
      slots: s.slots,
      taken: s.taken,
      mentor: {
        name: s.mentor_name,
        email: s.mentor_email,
        phone: s.mentor_phone
      }
    }));

    res.json({ course, sessions });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check if user is enrolled in specific sessions
app.post("/api/enrollments/check", async (req, res) => {
  const { user_id, session_ids } = req.body;
  if (!user_id || !session_ids || session_ids.length === 0) return res.json({});
  
  try {
    const [rows] = await db.query(
      `SELECT session_id FROM enrollment WHERE student_id = ? AND session_id IN (?)`,
      [user_id, session_ids]
    );
    
    const enrolledMap = {};
    rows.forEach(r => enrolledMap[r.session_id] = true);
    res.json(enrolledMap);
  } catch (error) {
    console.error("Error checking enrollments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Enroll in a session
app.post("/api/courses/enroll", async (req, res) => {
  const { user_id, session_id } = req.body;
  try {
    const [sessionData] = await db.query(`
      SELECT c.credit_cost, cs.slots, 
             (SELECT COUNT(*) FROM enrollment e WHERE e.session_id = cs.session_id AND e.status = 'Active') as taken
      FROM coursesession cs
      JOIN course c ON cs.course_id = c.course_id
      WHERE cs.session_id = ?
    `, [session_id]);
    
    if (sessionData.length === 0) return res.status(404).json({ error: "Session not found" });
    const { credit_cost, slots, taken } = sessionData[0];
    if (taken >= slots) return res.status(400).json({ error: "Session is full" });

    const [userData] = await db.query(`SELECT credits FROM user WHERE user_id = ?`, [user_id]);
    if (userData.length === 0) return res.status(404).json({ error: "User not found" });
    if (userData[0].credits < credit_cost) {
      return res.status(400).json({ error: `Not enough credits. Need ${credit_cost}.` });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(`UPDATE user SET credits = credits - ? WHERE user_id = ?`, [credit_cost, user_id]);
      await connection.query(
        `INSERT INTO enrollment (session_id, student_id, enroll_date, status) VALUES (?, ?, CURDATE(), 'Active')`,
        [session_id, user_id]
      );
      await connection.query(
        `INSERT INTO credittransaction (user_id, amount, type, reason, date) VALUES (?, ?, 'Debit', 'Course enrollment', CURDATE())`,
        [user_id, credit_cost]
      );
      await connection.commit();
      res.json({ message: "Successfully enrolled" });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error enrolling:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------------------------------------------
// AUTH API
// ----------------------------------------------------

// Simple login endpoint
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Note: We don't have a password column in the original schema!
    // For this simple prototype, we will just login by email.
    const [users] = await db.query(
      "SELECT user_id, name, email, phone, credits, reputation FROM user WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or user not found" });
    }

    res.json({ message: "Login successful", user: users[0] });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Simple signup endpoint
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO user (name, email, phone, credits, reputation) VALUES (?, ?, ?, 100, 0)",
      [name, email, phone]
    );
    res.json({ message: "Signup successful", userId: result.insertId });
  } catch (error) {
    console.error("Error signing up:", error);
    res.status(500).json({ error: "Email or phone already exists" });
  }
});

// ----------------------------------------------------
// USERS / DASHBOARD API
// ----------------------------------------------------

// Get user profile
app.get("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [users] = await db.query(
      "SELECT user_id, name, email, phone, credits, reputation FROM user WHERE user_id = ?",
      [id]
    );
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(users[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;
  try {
    await db.query(
      "UPDATE user SET name = ?, phone = ? WHERE user_id = ?",
      [name, phone, id]
    );
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user dashboard data (transactions, enrollments, teaching count)
app.get("/api/users/:id/dashboard", async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Transactions
    const [txns] = await db.query(
      `SELECT transaction_id as id, amount, type, reason, date FROM credittransaction WHERE user_id = ? ORDER BY date DESC LIMIT 8`,
      [id]
    );

    // 2. Enrollments
    const [enrollmentRows] = await db.query(`
      SELECT 
        e.enrollment_id as id, e.status, 
        cs.session_id, cs.start_date, cs.mode, 
        c.course_id, c.title, c.credit_cost, 
        s.skill_name
      FROM enrollment e
      JOIN coursesession cs ON e.session_id = cs.session_id
      JOIN course c ON cs.course_id = c.course_id
      LEFT JOIN skill s ON c.skill_id = s.skill_id
      WHERE e.student_id = ?
      ORDER BY e.enroll_date DESC
    `, [id]);

    const enrollments = enrollmentRows.map(row => ({
      id: row.id.toString(),
      status: row.status,
      course_sessions: {
        id: row.session_id.toString(),
        start_date: row.start_date,
        mode: row.mode,
        courses: {
          id: row.course_id.toString(),
          title: row.title,
          credit_cost: row.credit_cost,
          skills: row.skill_name ? { name: row.skill_name } : null
        }
      }
    }));

    // 3. Teaching Count
    const [teachingRows] = await db.query(
      `SELECT COUNT(*) as count FROM coursesession WHERE mentor_id = ?`,
      [id]
    );
    const teachingCount = teachingRows[0].count;

    res.json({
      txns: txns.map(t => ({ ...t, id: t.id.toString() })),
      enrollments,
      counts: {
        teaching: teachingCount,
        enrolled: enrollments.length
      }
    });

  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get teaching dashboard data
app.get("/api/users/:id/teaching", async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Courses created by user
    const [courseRows] = await db.query(`
      SELECT c.course_id as id, c.title, c.credit_cost, s.skill_name 
      FROM course c
      LEFT JOIN skill s ON c.skill_id = s.skill_id
      WHERE c.created_by = ?
      ORDER BY c.course_id DESC
    `, [id]);

    const coursesMap = new Map();
    courseRows.forEach(row => {
      coursesMap.set(row.id, {
        id: row.id.toString(),
        title: row.title,
        credit_cost: row.credit_cost,
        skills: row.skill_name ? { name: row.skill_name } : null,
        course_sessions: []
      });
    });

    // Populate course_sessions for courses
    if (courseRows.length > 0) {
      const courseIds = courseRows.map(c => c.id);
      const [sessionsForCourses] = await db.query(`
        SELECT session_id, course_id FROM coursesession WHERE course_id IN (?)
      `, [courseIds]);
      
      sessionsForCourses.forEach(s => {
        if (coursesMap.has(s.course_id)) {
          coursesMap.get(s.course_id).course_sessions.push({ id: s.session_id.toString() });
        }
      });
    }

    // 2. Sessions mentored by user
    const [sessionRows] = await db.query(`
      SELECT 
        cs.session_id as id, cs.start_date, cs.mode, cs.slots,
        c.course_id, c.title, c.credit_cost
      FROM coursesession cs
      JOIN course c ON cs.course_id = c.course_id
      WHERE cs.mentor_id = ?
      ORDER BY cs.start_date ASC
    `, [id]);

    const sessionsMap = new Map();
    sessionRows.forEach(row => {
      sessionsMap.set(row.id, {
        id: row.id.toString(),
        start_date: row.start_date,
        mode: row.mode,
        slots: row.slots,
        courses: { id: row.course_id.toString(), title: row.title, credit_cost: row.credit_cost },
        enrollments: []
      });
    });

    if (sessionRows.length > 0) {
      const sessionIds = sessionRows.map(s => s.id);
      const [enrollmentRows] = await db.query(`
        SELECT enrollment_id as id, session_id, status FROM enrollment WHERE session_id IN (?)
      `, [sessionIds]);

      enrollmentRows.forEach(e => {
        if (sessionsMap.has(e.session_id)) {
          sessionsMap.get(e.session_id).enrollments.push({ id: e.id.toString(), status: e.status });
        }
      });
    }

    res.json({
      courses: Array.from(coursesMap.values()),
      sessions: Array.from(sessionsMap.values())
    });
  } catch (error) {
    console.error("Error fetching teaching data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------------------------------------------
// MANAGE COURSE API
// ----------------------------------------------------

// Get course data for managing
app.get("/api/manage/courses/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [courseRows] = await db.query(`
      SELECT c.course_id as id, c.title, c.description, c.credit_cost, c.created_by, s.skill_name
      FROM course c
      LEFT JOIN skill s ON c.skill_id = s.skill_id
      WHERE c.course_id = ?
    `, [id]);

    if (courseRows.length === 0) return res.status(404).json({ error: "Course not found" });

    const course = {
      id: courseRows[0].id.toString(),
      title: courseRows[0].title,
      description: courseRows[0].description,
      credit_cost: courseRows[0].credit_cost,
      created_by: courseRows[0].created_by.toString(),
      skills: courseRows[0].skill_name ? { name: courseRows[0].skill_name } : null
    };

    const [sessionRows] = await db.query(`
      SELECT session_id as id, start_date, end_date, mode, slots
      FROM coursesession
      WHERE course_id = ?
      ORDER BY start_date ASC
    `, [id]);

    const sessions = [];
    for (const s of sessionRows) {
      const [enrolls] = await db.query(`
        SELECT e.enrollment_id as id, e.status, u.user_id, u.name, u.email
        FROM enrollment e
        JOIN user u ON e.student_id = u.user_id
        WHERE e.session_id = ?
      `, [s.id]);
      
      sessions.push({
        id: s.id.toString(),
        start_date: s.start_date,
        end_date: s.end_date,
        mode: s.mode,
        slots: s.slots,
        enrollments: enrolls.map(e => ({
          id: e.id.toString(),
          status: e.status,
          student: { id: e.user_id.toString(), name: e.name, email: e.email }
        }))
      });
    }

    res.json({ course, sessions });
  } catch (error) {
    console.error("Error fetching manage course data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a session
app.post("/api/manage/courses/:id/sessions", async (req, res) => {
  const { id } = req.params;
  const { mentor_id, start_date, end_date, mode, slots } = req.body;
  try {
    await db.query(
      "INSERT INTO coursesession (course_id, mentor_id, start_date, end_date, mode, slots) VALUES (?, ?, ?, ?, ?, ?)",
      [id, mentor_id, start_date, end_date, mode, slots]
    );
    res.json({ message: "Session scheduled" });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a session
app.delete("/api/manage/sessions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM coursesession WHERE session_id = ?", [id]);
    res.json({ message: "Session deleted" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark enrollment as complete
app.post("/api/manage/enrollments/:id/complete", async (req, res) => {
  const { id } = req.params;
  const { course_title, credit_cost, mentor_id } = req.body;
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Update enrollment status
    await connection.query("UPDATE enrollment SET status = 'Completed' WHERE enrollment_id = ?", [id]);
    
    // Add credits to mentor
    await connection.query("UPDATE user SET credits = credits + ? WHERE user_id = ?", [credit_cost, mentor_id]);
    
    // Log transaction
    await connection.query(
      "INSERT INTO credittransaction (user_id, amount, type, reason, date) VALUES (?, ?, 'Credit', ?, CURDATE())",
      [mentor_id, credit_cost, `Teaching session: ${course_title}`]
    );
    
    await connection.commit();
    res.json({ message: "Enrollment marked complete" });
  } catch (error) {
    await connection.rollback();
    console.error("Error completing enrollment:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    connection.release();
  }
});

// ----------------------------------------------------
// EVENTS API
// ----------------------------------------------------

// Get all events with team count
app.get("/api/events", async (req, res) => {
  try {
    const [events] = await db.query(`
      SELECT e.event_id as id, e.name, e.description, e.mode, e.start_date, e.end_date,
             COUNT(t.team_id) as team_count
      FROM event e
      LEFT JOIN team t ON e.event_id = t.event_id
      GROUP BY e.event_id
      ORDER BY e.start_date ASC
    `);
    
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single event
app.get("/api/events/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [eventRows] = await db.query(`
      SELECT event_id as id, name, description, mode, start_date, end_date
      FROM event
      WHERE event_id = ?
    `, [id]);
    
    if (eventRows.length === 0) return res.status(404).json({ error: "Event not found" });
    
    const [teamRows] = await db.query(`
      SELECT t.team_id as id, t.team_name, tm.user_id, r.registration_id
      FROM team t
      LEFT JOIN teammember tm ON t.team_id = tm.team_id
      LEFT JOIN eventregistration r ON t.team_id = r.team_id
      WHERE t.event_id = ?
    `, [id]);
    
    const teamMap = new Map();
    teamRows.forEach(row => {
      if (!teamMap.has(row.id)) {
        teamMap.set(row.id, {
          id: row.id.toString(),
          team_name: row.team_name,
          member_ids: [],
          registered: !!row.registration_id
        });
      }
      if (row.user_id) {
        teamMap.get(row.id).member_ids.push(row.user_id.toString());
      }
    });
    
    res.json({ event: eventRows[0], teams: Array.from(teamMap.values()) });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Join or create team for an event
app.post("/api/events/:id/teams", async (req, res) => {
  const { id } = req.params;
  const { user_id, team_name, team_id } = req.body;
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    let targetTeamId = team_id;
    
    if (!targetTeamId && team_name) {
      const [result] = await connection.query(
        "INSERT INTO team (event_id, team_name) VALUES (?, ?)",
        [id, team_name]
      );
      targetTeamId = result.insertId;
    }
    
    if (targetTeamId) {
      // Check if already in team
      const [existing] = await connection.query("SELECT * FROM teammember WHERE team_id = ? AND user_id = ?", [targetTeamId, user_id]);
      if (existing.length === 0) {
        await connection.query(
          "INSERT INTO teammember (team_id, user_id) VALUES (?, ?)",
          [targetTeamId, user_id]
        );
      }
    }
    
    await connection.commit();
    res.json({ message: "Joined team successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error joining team:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    connection.release();
  }
});

// Leave team
app.delete("/api/events/teams/:id/leave", async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  try {
    await db.query("DELETE FROM teammember WHERE team_id = ? AND user_id = ?", [id, user_id]);
    res.json({ message: "Left team" });
  } catch (error) {
    console.error("Error leaving team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Register team
app.post("/api/events/teams/:id/register", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("INSERT INTO eventregistration (team_id, registration_date) VALUES (?, CURDATE())", [id]);
    res.json({ message: "Team registered" });
  } catch (error) {
    console.error("Error registering team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
