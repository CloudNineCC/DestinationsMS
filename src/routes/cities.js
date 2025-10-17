const express = require('express');
const db = require('../db');

const router = express.Router();

const serializeCity = (row) => ({
  id: row.id,
  name: row.name,
  country_code: row.country_code,
  currency: row.currency,
});

const serializeSeason = (row) => ({
  id: row.id,
  city_id: row.city_id,
  season_name: row.season_name,
  start_month: row.start_month,
  end_month: row.end_month,
});

const validateCityPayload = (payload) => {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return ['Invalid JSON payload'];
  }
  const { name, country_code, currency } = payload;
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('name is required');
  }
  if (!country_code || typeof country_code !== 'string' || country_code.trim().length !== 2) {
    errors.push('country_code must be a 2-letter code');
  }
  if (!currency || typeof currency !== 'string' || currency.trim().length < 3) {
    errors.push('currency is required');
  }
  return errors;
};

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
};

router.get('/', (req, res, next) => {
  try {
    const rows = db.prepare('SELECT id, name, country_code, currency FROM cities ORDER BY id').all();
    res.json(rows.map(serializeCity));
  } catch (error) {
    next(error);
  }
});

router.get('/:id/seasons', (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ errors: ['Invalid city id'] });
    }

    const city = db.prepare('SELECT id FROM cities WHERE id = ?').get(id);
    if (!city) {
      return res.status(404).json({ errors: ['City not found'] });
    }

    const seasons = db
      .prepare(
        `SELECT id, city_id, season_name, start_month, end_month
         FROM seasons
         WHERE city_id = ?
         ORDER BY id`
      )
      .all(id);

    res.json(seasons.map(serializeSeason));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ errors: ['Invalid city id'] });
    }

    const city = db.prepare('SELECT id, name, country_code, currency FROM cities WHERE id = ?').get(id);
    if (!city) {
      return res.status(404).json({ errors: ['City not found'] });
    }

    res.json(serializeCity(city));
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    const errors = validateCityPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ errors });
    }
    const insert = db.prepare('INSERT INTO cities (name, country_code, currency) VALUES (@name, @country_code, @currency)');
    const info = insert.run({
      name: req.body.name.trim(),
      country_code: req.body.country_code.trim().toUpperCase(),
      currency: req.body.currency.trim().toUpperCase(),
    });
    const city = db.prepare('SELECT id, name, country_code, currency FROM cities WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(serializeCity(city));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ errors: ['City already exists for this country'] });
    }
    next(error);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const errors = validateCityPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ errors });
    }
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ errors: ['Invalid city id'] });
    }
    const update = db.prepare(
      'UPDATE cities SET name = @name, country_code = @country_code, currency = @currency WHERE id = @id'
    );
    const info = update.run({
      id,
      name: req.body.name.trim(),
      country_code: req.body.country_code.trim().toUpperCase(),
      currency: req.body.currency.trim().toUpperCase(),
    });
    if (info.changes === 0) {
      return res.status(404).json({ errors: ['City not found'] });
    }
    const city = db.prepare('SELECT id, name, country_code, currency FROM cities WHERE id = ?').get(id);
    res.json(serializeCity(city));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ errors: ['City already exists for this country'] });
    }
    next(error);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ errors: ['Invalid city id'] });
    }
    const info = db.prepare('DELETE FROM cities WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ errors: ['City not found'] });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
