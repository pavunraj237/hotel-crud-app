// scripts/migrate.js - Safe, non-destructive migration runner
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../db');
require('dotenv').config();

async function runMigration() {
  console.log('Running safe database migrations...');
  try {
    // 1. Run migration 001 if needed
    const migration1Path = path.join(__dirname, '..', 'migrations', '001_create_users_and_ownership.sql');
    if (fs.existsSync(migration1Path)) {
      console.log('Applying 001_create_users_and_ownership.sql...');
      const sql1 = fs.readFileSync(migration1Path, 'utf-8');
      await db.query(sql1);
    }

    // 2. Run migration 002: admin role and availability status
    const migration2Path = path.join(__dirname, '..', 'migrations', '002_add_admin_and_availability.sql');
    if (fs.existsSync(migration2Path)) {
      console.log('Applying 002_add_admin_and_availability.sql...');
      const sql2 = fs.readFileSync(migration2Path, 'utf-8');
      await db.query(sql2);
    }

    console.log('Schema migrations applied successfully!');

    // 3. Seed development demo admin account if not already present
    // Read from environment variables per instructions
    const adminEmail = (process.env.DEMO_ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
    const adminPassword = process.env.DEMO_ADMIN_PASSWORD || 'Admin@12345';

    const checkAdmin = await db.query(
      'SELECT id, email, role FROM users WHERE LOWER(email) = LOWER($1)',
      [adminEmail]
    );

    let adminId;
    if (checkAdmin.rows.length === 0) {
      console.log(`Seeding demo admin account (${adminEmail})...`);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      const insertAdmin = await db.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')
         RETURNING id, name, email, role`,
        ['System Admin', adminEmail, passwordHash]
      );
      adminId = insertAdmin.rows[0].id;
      console.log(`Demo admin created with ID ${adminId}.`);
    } else {
      adminId = checkAdmin.rows[0].id;
      // Ensure role is admin
      if (checkAdmin.rows[0].role !== 'admin') {
        await db.query("UPDATE users SET role = 'admin' WHERE id = $1", [adminId]);
        console.log(`Updated user ${adminEmail} to admin role.`);
      } else {
        console.log(`Demo admin ${adminEmail} already exists with admin role.`);
      }
    }

    // 4. Ensure any hotels with NULL user_id are assigned to admin
    const unassignedHotels = await db.query(
      'UPDATE hotels SET user_id = $1 WHERE user_id IS NULL',
      [adminId]
    );
    if (unassignedHotels.rowCount > 0) {
      console.log(`Assigned ${unassignedHotels.rowCount} unassigned hotel(s) to admin ID ${adminId}.`);
    }

    // 5. Ensure all existing hotels have availability_status = 'Available'
    const updatedAvailability = await db.query(
      "UPDATE hotels SET availability_status = 'Available' WHERE availability_status IS NULL OR availability_status = ''"
    );
    if (updatedAvailability.rowCount > 0) {
      console.log(`Updated ${updatedAvailability.rowCount} hotel(s) to 'Available' status.`);
    }

    console.log('Migration and seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      console.error(
        `Could not connect to PostgreSQL on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}. Please verify PostgreSQL service is running and credentials in .env are correct.`
      );
    }
    process.exit(1);
  }
}

runMigration();
