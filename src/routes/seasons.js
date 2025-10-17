const express = require('express');
const db = require('../db');

const router = express.Router();

const VALID_SEASONS = new Set(['peak', 'shoulder', 'off']);

const serializeSeason = (row) => ({
  id: row.id,
  city_id: row.city_id,
  season_name: row.season_name,
  start_month: row.start_month,
  end_month: row.end_month,
});

const validateSeasonPayload = (payload, { requireCityId = true } = {}) => {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return ['Invalid JSON payload'];
  }
  const { city_id, season_name, start_month, end_month } = payload;
  if (requireCityId) {
    if (city_id === undefined || city_id === null || Number.isNaN(Number.parseInt(city_id, 10))) {
      errors.push('city_id is required');
    }
  }
  if (!season_name || typeof season_name !== 'string' || !VALID_SEASONS.has(season_name.trim().toLowerCase())) {
    errors.push(`season_name must be one of: ${Array.from(VALID_SEASONS).join(', ')}`);
  }
  const start = Number.parseInt(start_month, 10);
  const end = Number.parseInt(end_month, 10);
  if (Number.isNaN(start) || start < 1 || start > 12) {
    errors.push('start_month must be between 1 and 12');
  }
  if (Number.isNaN(end) || end < 1 || end > 12) {
    errors.push('end_month must be between 1 and 12');
  }
  return errors;
};

const ensureCityExists = (cityId) => {
  const city = db.prepare('SELECT id FROM cities WHERE id = ?').get(cityId);
  return !!city;
};

router.get('/', (req, res, next) => {
  try {
    const query = req.query.city_id;
    let rows;
    if (query !== undefined) {
      const cityId = Number.parseInt(query, 10);
      if (Number.isNaN(cityId)) {
        return res.status(400).json({ errors: ['city_id must be a number'] });
      }
      rows = db
        .prepare(
          `SELECT id, city_id, season_name, start_month, end_month
           FROM seasons
           WHERE city_id = ?
           ORDER BY id`
        )
        .all(cityId);
    } else {
      rows = db
        .prepare('SELECT id, city_id, season_name, start_month, end_month FROM seasons ORDER BY id')
        .all();
    }
    res.json(rows.map(serializeSeason));
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    const errors = validateSeasonPayload(req.body, { requireCityId: true });
    if (errors.length) {
      return res.status(400).json({ errors });
    }
    const cityId = Number.parseInt(req.body.city_id, 10);
    if (!ensureCityExists(cityId)) {
      return res.status(400).json({ errors: ['city_id does not reference a valid city'] });
    }
    const insert = db.prepare(
      `INSERT INTO seasons (city_id, season_name, start_month, end_month)
       VALUES (@city_id, @season_name, @start_month, @end_month)`
    );
    const info = insert.run({
      city_id: cityId,
      season_name: req.body.season_name.trim().toLowerCase(),
      start_month: Number.parseInt(req.body.start_month, 10),
      end_month: Number.parseInt(req.body.end_month, 10),
    });
    const season = db
      .prepare('SELECT id, city_id, season_name, start_month, end_month FROM seasons WHERE id = ?')
      .get(info.lastInsertRowid);
    res.status(201).json(serializeSeason(season));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(400).json({ errors: ['city_id does not reference a valid city'] });
    }
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ errors: ['Season already defined for this city'] });
    }
    next(error);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ errors: ['Invalid season id'] });
    }
    const errors = validateSeasonPayload(req.body, { requireCityId: false });
    if (errors.length) {
      return res.status(400).json({ errors });
    }
    const existing = db.prepare('SELECT id, city_id FROM seasons WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ errors: ['Season not found'] });
    }
    let cityId = existing.city_id;
    if (req.body.city_id !== undefined) {
      const parsed = Number.parseInt(req.body.city_id, 10);
      if (Number.isNaN(parsed)) {
        return res.status(400).json({ errors: ['city_id must be a number'] });
      }
      if (!ensureCityExists(parsed)) {
        return res.status(400).json({ errors: ['city_id does not reference a valid city'] });
      }
      cityId = parsed;
    }
    const update = db.prepare(
      `UPDATE seasons
       SET city_id = @city_id,
           season_name = @season_name,
           start_month = @start_month,
           end_month = @end_month
       WHERE id = @id`
    );
    const info = update.run({
      id,
      city_id: cityId,
      season_name: req.body.season_name.trim().toLowerCase(),
      start_month: Number.parseInt(req.body.start_month, 10),
      end_month: Number.parseInt(req.body.end_month, 10),
    });
    if (info.changes === 0) {
      return res.status(404).json({ errors: ['Season not found'] });
    }
    const season = db
      .prepare('SELECT id, city_id, season_name, start_month, end_month FROM seasons WHERE id = ?')
      .get(id);
    res.json(serializeSeason(season));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ errors: ['Season already defined for this city'] });
    }
    next(error);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ errors: ['Invalid season id'] });
    }
    const info = db.prepare('DELETE FROM seasons WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ errors: ['Season not found'] });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
