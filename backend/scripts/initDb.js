// Database initialization and idempotent hotel catalog seeder.
const fs = require('fs');
const path = require('path');
const db = require('../db');

// These INR values are illustrative demo prices, not live booking quotes.
const hotels = [
  {
    title: 'The Taj Mahal Palace',
    description: 'Apollo Bunder, Colaba, Mumbai 400001. The landmark waterfront palace hotel faces the Gateway of India and offers heritage rooms and suites, multiple restaurants and bars, a spa, a pool, and concierge and butler services.',
    latitude: 18.92166572,
    longitude: 72.83320179,
    price: 15000,
    imageUrl: 'https://cdn.sanity.io/images/ocl5w36p/ihcl_prod/01b621685d7ecc3043a9b169d236c5c945194cd1-756x623.png',
  },
  {
    title: 'Rambagh Palace',
    description: 'Bhawani Singh Road, Jaipur 302005. A former royal residence set in landscaped gardens, with palace rooms and suites, heritage walks, several dining venues, a J Wellness Circle spa, and heated and outdoor pools.',
    latitude: 26.89810574,
    longitude: 75.80814907,
    price: 14500,
    imageUrl: 'https://wetu.com/ImageHandler/c1211x700/39668/27652467-H1-Palace_Exterio_E.jpg',
  },
  {
    title: 'Wildflower Hall, An Oberoi Resort, Shimla',
    description: 'Chharabra, Shimla, Himachal Pradesh. A mountain resort in cedar forest above Shimla, with Himalayan and valley views, wood-and-stone interiors, a spa, restaurants, an indoor pool, and outdoor activities.',
    latitude: 31.113938,
    longitude: 77.247663,
    price: 13900,
    imageUrl: 'https://www.fivestaralliance.com/files/fivestaralliance.com/styles/juicebox_large/public/field/image/nodes/2009/11419/11419_8_wildflowerhall_fsa-g.jpg?itok=BHyfcrPg',
  },
  {
    title: 'Algiers Marriott Hotel Bab Ezzouar',
    description: 'Trust Complex Buildings, Nouveau Quartier des Affaires, Bab Ezzouar, Algiers 16311, Algeria. Near Houari Boumediene Airport, this business hotel offers restaurants and a bar, a pool, spa and fitness facilities, meeting spaces, and airport connectivity.',
    latitude: 36.71307,
    longitude: 3.19412,
    price: 9500,
    imageUrl: 'https://ak-d.tripcdn.com/images/0226612000i2luys8C2A0_R_960_660_R5_D.jpg',
  },
  {
    title: 'Royal Hotel Oran - MGallery',
    description: '1 Boulevard de la Soummam, 31000 Oran, Algeria. A historic city-centre hotel known for its 1920s character and art collection, with 112 air-conditioned rooms, two restaurants, a bar, wellness and fitness facilities, parking, and shuttle service.',
    latitude: 35.703129,
    longitude: -0.647681,
    price: 8500,
    imageUrl: 'https://www.ahstatic.com/photos/9126_ho_00_p_2048x1536.jpg',
  },
  {
    title: 'Sofitel Algiers Hamma Garden',
    description: '172 Rue Hassiba Benbouali, Algiers 16015, Algeria. Beside the Hamma Botanical Garden and close to the National Library, this hotel has 309 rooms and 23 suites, restaurants and a bar, a terrace, pool, solarium, fitness centre, and meeting rooms.',
    latitude: 36.750885,
    longitude: 3.072301,
    price: 11500,
    imageUrl: 'https://www.ahstatic.com/photos/1540_ho_00_p_1024x768.jpg',
  },
  {
    title: 'Sheraton Club des Pins Resort',
    description: 'Boite Postale 62, Club des Pins, Staoueli, Algiers 16101, Algeria. A Mediterranean beachfront resort with indoor and outdoor pools, spa and fitness facilities, restaurants, event spaces, and a private beach setting west of central Algiers.',
    latitude: 36.76337,
    longitude: 2.87362,
    price: 10500,
    imageUrl: 'https://cache.marriott.com/content/dam/marriott-renditions/ALGSI/algsi-9765-beach-9765-hor-clsc.jpg?downsize=1215px%3A%2A&interpolation=progressive-bilinear&output-quality=70',
  },
  {
    title: 'Hotel El Djazair',
    description: '24 Avenue Souidani Boudjemaa, El Mouradia, Algiers 16000, Algeria. Formerly known as Saint-George, this historic hotel occupies a former palace and offers antique-style rooms, a French-Algerian restaurant, outdoor pool, spa, hot tub, fitness facilities, and gardens.',
    latitude: 36.754833,
    longitude: 3.046525,
    price: 8000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Jardin_de_l%27h%C3%B4tel_El_Djaza%C3%AFr.jpg',
  },
];

// Exact names used by the old starter data (including the spelling in the live DB).
const oldDemoTitles = [
  'The Grand Heritage Palace',
  'Azure Bay Ocean Resort',
  'Alpine Peak Mountain Lodge',
  'Metropolis Skyline Hotel',
  'Serene Valley Eco Retreat',
  'Golden Sunset Boutique Inn',
  'Golden Sunset Boutique Inng',
];

async function initializeDatabase() {
  const client = await db.pool.connect();
  try {
    console.log('Connecting to PostgreSQL and running schema...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf-8');
    await client.query(schemaSql);

    await client.query('BEGIN');
    const adminResult = await client.query(
      "SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1"
    );
    const adminId = adminResult.rows[0]?.id ?? null;

    // Remove only the starter demo rows; other hotel records are preserved.
    const removed = await client.query(
      'DELETE FROM hotels WHERE title = ANY($1::text[]) RETURNING id',
      [oldDemoTitles]
    );

    for (const hotel of hotels) {
      const existing = await client.query(
        'SELECT id FROM hotels WHERE LOWER(title) = LOWER($1) ORDER BY id LIMIT 1',
        [hotel.title]
      );

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE hotels
           SET title = $1, description = $2, latitude = $3, longitude = $4,
               price = $5, image_url = $6, availability_status = 'Available',
               user_id = $7, updated_at = CURRENT_TIMESTAMP
           WHERE id = $8`,
          [hotel.title, hotel.description, hotel.latitude, hotel.longitude,
            hotel.price, hotel.imageUrl, adminId, existing.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO hotels
             (title, description, latitude, longitude, price, image_url, availability_status, user_id)
           VALUES ($1, $2, $3, $4, $5, $6, 'Available', $7)`,
          [hotel.title, hotel.description, hotel.latitude, hotel.longitude,
            hotel.price, hotel.imageUrl, adminId]
        );
      }
    }

    await client.query('COMMIT');

    // Remove only the six known generated placeholders from the starter dataset.
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    for (let index = 1; index <= 6; index += 1) {
      const oldImage = path.join(uploadsDir, `sample-hotel-${index}.svg`);
      if (fs.existsSync(oldImage)) fs.unlinkSync(oldImage);
    }

    console.log(`Removed ${removed.rowCount} old demo hotel row(s).`);
    console.log(`Hotel catalog is ready with ${hotels.length} requested hotels.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Database initialization error:', error.stack || error.message || error);
    if (Array.isArray(error.errors)) {
      for (const cause of error.errors) {
        console.error('Connection attempt failed:', cause.message || cause);
      }
    }
    process.exitCode = 1;
  } finally {
    client.release();
    await db.pool.end();
  }
}

initializeDatabase();
