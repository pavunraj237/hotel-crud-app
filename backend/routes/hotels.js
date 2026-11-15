// routes/hotels.js - Hotel CRUD endpoints with native SQL queries, availability status, and admin authorization
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage for hotel images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Unique filename: timestamp + random number + original extension
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'hotel-' + uniqueSuffix + ext);
  },
});

// File filter to accept image files only (jpg, jpeg, png, webp)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (.jpg, .jpeg, .png, .webp, .gif) are allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max file size
});

// Helper function to safely delete an uploaded image file from disk
const deleteFileFromDisk = (imagePath) => {
  if (!imagePath) return;
  try {
    const fileName = path.basename(imagePath);
    const absolutePath = path.join(uploadsDir, fileName);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (err) {
    console.error(`Failed to delete local file ${imagePath}:`, err.message);
  }
};

// Helper to compute global price distribution histogram and range across ALL hotels
const getGlobalPriceStats = async () => {
  try {
    const minMaxResult = await db.query(
      'SELECT MIN(price) AS min_price, MAX(price) AS max_price, COUNT(*) AS total FROM hotels'
    );
    const row = minMaxResult.rows[0];
    const total = parseInt(row.total, 10) || 0;

    if (total === 0) {
      return {
        minPrice: 1500,
        maxPrice: 15000,
        totalHotels: 0,
        buckets: [],
      };
    }

    // Keep the initial slider range at ₹1,500–₹15,000 while expanding it
    // when stored hotel prices fall outside those defaults.
    const minPrice = Math.min(1500, Math.floor(parseFloat(row.min_price)));
    let maxPrice = Math.max(15000, Math.ceil(parseFloat(row.max_price)));

    // Handle edge case where all hotels have the same price
    if (maxPrice <= minPrice) {
      maxPrice = minPrice + 100;
    }

    const numBuckets = 20;
    const step = (maxPrice - minPrice) / numBuckets;

    // Fetch all prices to build histogram buckets
    const pricesResult = await db.query('SELECT price FROM hotels ORDER BY price ASC');
    const prices = pricesResult.rows.map((r) => parseFloat(r.price));

    const buckets = Array.from({ length: numBuckets }, (_, i) => {
      const bucketMin = minPrice + i * step;
      const bucketMax = bucketMin + step;
      return {
        index: i,
        min: Math.round(bucketMin),
        max: Math.round(bucketMax),
        count: 0,
      };
    });

    prices.forEach((price) => {
      let bucketIndex = Math.floor((price - minPrice) / step);
      if (bucketIndex >= numBuckets) bucketIndex = numBuckets - 1;
      if (bucketIndex < 0) bucketIndex = 0;
      buckets[bucketIndex].count += 1;
    });

    return {
      minPrice,
      maxPrice,
      totalHotels: total,
      buckets,
    };
  } catch (err) {
    console.error('Error calculating price stats:', err.message);
    return {
      minPrice: 1500,
      maxPrice: 15000,
      totalHotels: 0,
      buckets: [],
    };
  }
};

// Validation helper function with availability status
const validateHotelData = (data, isCreating = true, file = null) => {
  const errors = [];

  const { title, description, latitude, longitude, price, availability_status } = data;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Title is required and must not be empty');
  } else if (title.trim().length > 255) {
    errors.push('Title must be at most 255 characters');
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required and must not be empty');
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    errors.push('Price must be a valid positive number greater than 0');
  }

  const parsedLat = parseFloat(latitude);
  if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
    errors.push('Latitude must be a valid number between -90 and 90');
  }

  const parsedLng = parseFloat(longitude);
  if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
    errors.push('Longitude must be a valid number between -180 and 180');
  }

  if (isCreating && !file) {
    errors.push('An image file is required when creating a new hotel');
  }

  // Validate availability status (Available / Unavailable)
  let validAvailability = 'Available';
  if (availability_status) {
    const trimmedStatus = availability_status.trim();
    if (trimmedStatus === 'Unavailable') {
      validAvailability = 'Unavailable';
    } else if (trimmedStatus === 'Available') {
      validAvailability = 'Available';
    } else {
      errors.push("Availability status must be either 'Available' or 'Unavailable'");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      title: title ? title.trim() : '',
      description: description ? description.trim() : '',
      price: parsedPrice,
      latitude: parsedLat,
      longitude: parsedLng,
      availability_status: validAvailability,
    },
  };
};

// -------------------------------------------------------------
// GET /api/hotels/price-stats - Global price bounds and histogram
// -------------------------------------------------------------
router.get('/price-stats', async (req, res) => {
  try {
    const stats = await getGlobalPriceStats();
    res.json(stats);
  } catch (error) {
    console.error('Error in /price-stats:', error);
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: `PostgreSQL connection refused at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}. Please verify PostgreSQL is running and check your .env settings.`,
        code: error.code,
      });
    }
    res.status(500).json({ error: 'Failed to retrieve price statistics' });
  }
});

// -------------------------------------------------------------
// GET /api/hotels - Public list of hotels with search, price, and availability filtering
// Query params:
//   - search: string (matches title)
//   - minPrice: number
//   - maxPrice: number
//   - availability: 'Available' | 'Unavailable'
//   - page: number (default: 1)
//   - limit: number (default: 6)
// -------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { search, minPrice, maxPrice, availability } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 6);
    const offset = (page - 1) * limit;

    // Build dynamic parameterized WHERE clauses
    const whereClauses = [];
    const queryParams = [];

    // Title search filter (case-insensitive substring)
    if (search && search.trim().length > 0) {
      queryParams.push(`%${search.trim().toLowerCase()}%`);
      whereClauses.push(`LOWER(h.title) LIKE $${queryParams.length}`);
    }

    // Min price filter
    if (minPrice !== undefined && minPrice !== '' && !isNaN(parseFloat(minPrice))) {
      queryParams.push(parseFloat(minPrice));
      whereClauses.push(`h.price >= $${queryParams.length}`);
    }

    // Max price filter
    if (maxPrice !== undefined && maxPrice !== '' && !isNaN(parseFloat(maxPrice))) {
      queryParams.push(parseFloat(maxPrice));
      whereClauses.push(`h.price <= $${queryParams.length}`);
    }

    // Availability status filter
    if (availability && (availability === 'Available' || availability === 'Unavailable')) {
      queryParams.push(availability);
      whereClauses.push(`h.availability_status = $${queryParams.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 1. Get total count for pagination calculations
    const countQuery = `SELECT COUNT(*) AS total FROM hotels h ${whereSql}`;
    const countResult = await db.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].total, 10);

    // 2. Fetch the paginated hotel items with availability and owner details
    queryParams.push(limit);
    const limitParamIndex = queryParams.length;
    queryParams.push(offset);
    const offsetParamIndex = queryParams.length;

    const selectQuery = `
      SELECT h.id, h.title, h.description, h.latitude, h.longitude, h.price, h.image_url,
             h.availability_status, h.user_id, u.name AS owner_name, h.created_at, h.updated_at
      FROM hotels h
      LEFT JOIN users u ON h.user_id = u.id
      ${whereSql}
      ORDER BY h.id DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    const result = await db.query(selectQuery, queryParams);
    const totalPages = Math.ceil(totalCount / limit) || 1;

    // Global price bounds and histogram across all hotels
    const priceStats = await getGlobalPriceStats();

    res.json({
      hotels: result.rows,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
        offset,
      },
      priceStats,
    });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: `PostgreSQL connection refused at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}. Please verify PostgreSQL is running and check your .env settings.`,
        code: error.code,
      });
    }
    res.status(500).json({ error: 'Failed to fetch hotels from database' });
  }
});

// -------------------------------------------------------------
// GET /api/hotels/:id - Public single hotel details
// -------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT h.*, u.name AS owner_name, u.email AS owner_email
      FROM hotels h
      LEFT JOIN users u ON h.user_id = u.id
      WHERE h.id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching hotel ${req.params.id}:`, error);
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: `PostgreSQL connection refused at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}.`,
        code: error.code,
      });
    }
    res.status(500).json({ error: 'Failed to retrieve hotel details' });
  }
});

// -------------------------------------------------------------
// POST /api/hotels - Add new hotel (Admin access only)
// -------------------------------------------------------------
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const validation = validateHotelData(req.body, true, req.file);
    if (!validation.isValid) {
      if (req.file) {
        deleteFileFromDisk('/uploads/' + req.file.filename);
      }
      return res.status(400).json({ errors: validation.errors });
    }

    const { title, description, price, latitude, longitude, availability_status } = validation.sanitized;
    const imageUrl = `/uploads/${req.file.filename}`;
    const userId = req.user.id;

    const insertQuery = `
      INSERT INTO hotels (title, description, latitude, longitude, price, image_url, availability_status, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const params = [title, description, latitude, longitude, price, imageUrl, availability_status, userId];

    const result = await db.query(insertQuery, params);
    const newHotel = result.rows[0];
    newHotel.owner_name = req.user.name;

    res.status(201).json(newHotel);
  } catch (error) {
    console.error('Error creating hotel:', error);
    if (req.file) {
      deleteFileFromDisk('/uploads/' + req.file.filename);
    }
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: `PostgreSQL connection refused at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}.`,
        code: error.code,
      });
    }
    res.status(500).json({ error: 'Failed to create hotel in database' });
  }
});

// -------------------------------------------------------------
// PUT /api/hotels/:id - Edit existing hotel (Admin access only)
// -------------------------------------------------------------
router.put('/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;

    const existingCheck = await db.query('SELECT * FROM hotels WHERE id = $1', [id]);
    if (existingCheck.rows.length === 0) {
      if (req.file) {
        deleteFileFromDisk('/uploads/' + req.file.filename);
      }
      return res.status(404).json({ error: 'Hotel not found' });
    }

    const existingHotel = existingCheck.rows[0];

    const validation = validateHotelData(req.body, false, req.file);
    if (!validation.isValid) {
      if (req.file) {
        deleteFileFromDisk('/uploads/' + req.file.filename);
      }
      return res.status(400).json({ errors: validation.errors });
    }

    const { title, description, price, latitude, longitude, availability_status } = validation.sanitized;

    let newImageUrl = existingHotel.image_url;
    if (req.file) {
      newImageUrl = `/uploads/${req.file.filename}`;
      deleteFileFromDisk(existingHotel.image_url);
    }

    const updateQuery = `
      UPDATE hotels
      SET title = $1,
          description = $2,
          latitude = $3,
          longitude = $4,
          price = $5,
          image_url = $6,
          availability_status = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;
    const params = [title, description, latitude, longitude, price, newImageUrl, availability_status, id];

    const result = await db.query(updateQuery, params);
    const updatedHotel = result.rows[0];
    updatedHotel.owner_name = req.user.name;

    res.json(updatedHotel);
  } catch (error) {
    console.error(`Error updating hotel ${req.params.id}:`, error);
    if (req.file) {
      deleteFileFromDisk('/uploads/' + req.file.filename);
    }
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: `PostgreSQL connection refused at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}.`,
        code: error.code,
      });
    }
    res.status(500).json({ error: 'Failed to update hotel in database' });
  }
});

// -------------------------------------------------------------
// DELETE /api/hotels/:id - Delete a hotel (Admin access only)
// -------------------------------------------------------------
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const selectQuery = 'SELECT image_url FROM hotels WHERE id = $1';
    const selectResult = await db.query(selectQuery, [id]);

    if (selectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    const { image_url } = selectResult.rows[0];

    const deleteQuery = 'DELETE FROM hotels WHERE id = $1 RETURNING id';
    await db.query(deleteQuery, [id]);

    deleteFileFromDisk(image_url);

    res.json({
      message: 'Hotel deleted successfully',
      deletedId: parseInt(id, 10),
    });
  } catch (error) {
    console.error(`Error deleting hotel ${req.params.id}:`, error);
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: `PostgreSQL connection refused at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}.`,
        code: error.code,
      });
    }
    res.status(500).json({ error: 'Failed to delete hotel from database' });
  }
});

module.exports = router;
