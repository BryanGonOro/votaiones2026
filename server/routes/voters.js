import express from 'express';
import multer from 'multer';
import { getAll, getOne, runQuery } from '../database.js';
import { authenticateToken } from '../auth.js';
import { parseExcelFile, validateVoterData } from '../utils/excel.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /xlsx|xls/;
    const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
    
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
  }
});

// Apply authentication to all routes
router.use(authenticateToken);

// Get all voters with optional filters
router.get('/', async (req, res) => {
  try {
    const { search, filter, mesa, referidor } = req.query;
    
    let sql = 'SELECT * FROM voters WHERE 1=1';
    const params = [];
    
    if (search) {
      sql += ' AND (nombre LIKE ? OR cedula LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (filter === 'voted') {
      sql += ' AND voted = 1';
    } else if (filter === 'pending') {
      sql += ' AND voted = 0';
    }
    
    if (mesa) {
      sql += ' AND mesa = ?';
      params.push(mesa);
    }
    
    if (referidor) {
      sql += ' AND referidor = ?';
      params.push(referidor);
    }
    
    sql += ' ORDER BY voted ASC, nombre ASC';
    
    const voters = await getAll(sql, params);
    res.json(voters);
  } catch (error) {
    console.error('Get voters error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Get single voter
router.get('/:id', async (req, res) => {
  try {
    const voter = await getOne('SELECT * FROM voters WHERE id = ?', [req.params.id]);
    
    if (!voter) {
      return res.status(404).json({ error: 'Votante no encontrado' });
    }
    
    res.json(voter);
  } catch (error) {
    console.error('Get voter error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Create new voter
router.post('/', async (req, res) => {
  try {
    const { cedula, nombre, mesa, referidor } = req.body;
    
    if (!cedula || !nombre || !mesa) {
      return res.status(400).json({ error: 'Cédula, nombre y mesa son requeridos' });
    }
    
    // Check if voter already exists
    const existing = await getOne('SELECT id FROM voters WHERE cedula = ?', [cedula]);
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un votante con esta cédula' });
    }
    
    const result = await runQuery(
      'INSERT INTO voters (cedula, nombre, mesa, referidor) VALUES (?, ?, ?, ?)',
      [cedula, nombre, mesa, referidor || '']
    );
    
    const voter = await getOne('SELECT * FROM voters WHERE id = ?', [result.lastID]);
    res.status(201).json(voter);
  } catch (error) {
    console.error('Create voter error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Update voter (blocked if already voted)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cedula, nombre, mesa, referidor } = req.body;
    
    const voter = await getOne('SELECT * FROM voters WHERE id = ?', [id]);
    
    if (!voter) {
      return res.status(404).json({ error: 'Votante no encontrado' });
    }
    
    if (voter.voted) {
      return res.status(403).json({ error: 'No se puede modificar un votante que ya ha votado' });
    }
    
    if (!cedula || !nombre || !mesa) {
      return res.status(400).json({ error: 'Cédula, nombre y mesa son requeridos' });
    }
    
    // Check if cedula is being changed to one that already exists
    if (cedula !== voter.cedula) {
      const existing = await getOne('SELECT id FROM voters WHERE cedula = ? AND id != ?', [cedula, id]);
      if (existing) {
        return res.status(400).json({ error: 'Ya existe un votante con esta cédula' });
      }
    }
    
    await runQuery(
      'UPDATE voters SET cedula = ?, nombre = ?, mesa = ?, referidor = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [cedula, nombre, mesa, referidor || '', id]
    );
    
    const updatedVoter = await getOne('SELECT * FROM voters WHERE id = ?', [id]);
    res.json(updatedVoter);
  } catch (error) {
    console.error('Update voter error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Mark voter as voted
router.post('/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    
    const voter = await getOne('SELECT * FROM voters WHERE id = ?', [id]);
    
    if (!voter) {
      return res.status(404).json({ error: 'Votante no encontrado' });
    }
    
    if (voter.voted) {
      return res.status(400).json({ error: 'Este votante ya ha votado' });
    }
    
    await runQuery(
      'UPDATE voters SET voted = 1, voted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    const updatedVoter = await getOne('SELECT * FROM voters WHERE id = ?', [id]);
    res.json(updatedVoter);
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Import voters from Excel
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo requerido' });
    }
    
    const buffer = req.file.buffer;
    
    const voters = parseExcelFile(buffer);
    
    if (voters.length === 0) {
      return res.status(400).json({ error: 'No se encontraron datos válidos en el archivo' });
    }
    
    let imported = 0;
    let skipped = 0;
    let duplicates = 0;
    const errors = [];
    
    for (const voter of voters) {
      const validation = validateVoterData(voter);
      
      if (!validation.isValid) {
        errors.push({ voter: voter.nombre, cedula: voter.cedula, errors: validation.errors });
        skipped++;
        continue;
      }
      
      // Check if already exists
      const existing = await getOne('SELECT id FROM voters WHERE cedula = ?', [voter.cedula]);
      
      if (existing) {
        duplicates++;
        skipped++;
        continue;
      }
      
      await runQuery(
        'INSERT INTO voters (cedula, nombre, mesa, referidor) VALUES (?, ?, ?, ?)',
        [voter.cedula, voter.nombre, voter.mesa, voter.referidor]
      );
      
      imported++;
    }
    
    res.json({
      message: `Importación completada: ${imported} nuevos, ${skipped} omitidos`,
      imported,
      skipped,
      duplicates,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await getOne('SELECT COUNT(*) as count FROM voters');
    const voted = await getOne('SELECT COUNT(*) as count FROM voters WHERE voted = 1');
    const pending = await getOne('SELECT COUNT(*) as count FROM voters WHERE voted = 0');
    
    // Get unique referrers with counts
    const referrers = await getAll(`
      SELECT referidor, COUNT(*) as count, 
             SUM(CASE WHEN voted = 1 THEN 1 ELSE 0 END) as voted
      FROM voters 
      WHERE referidor IS NOT NULL AND referidor != ''
      GROUP BY referidor 
      ORDER BY count DESC
    `);
    
    // Get unique mesas
    const mesas = await getAll(`
      SELECT mesa, COUNT(*) as count,
             SUM(CASE WHEN voted = 1 THEN 1 ELSE 0 END) as voted
      FROM voters 
      GROUP BY mesa 
      ORDER BY mesa
    `);
    
    res.json({
      total: total.count,
      voted: voted.count,
      pending: pending.count,
      referrers,
      mesas
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Get unique referrers list
router.get('/referrers', async (req, res) => {
  try {
    const referrers = await getAll(`
      SELECT DISTINCT referidor 
      FROM voters 
      WHERE referidor IS NOT NULL AND referidor != ''
      ORDER BY referidor
    `);
    
    res.json(referrers.map(r => r.referidor));
  } catch (error) {
    console.error('Get referrers error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Get unique mesas list
router.get('/mesas', async (req, res) => {
  try {
    const mesas = await getAll(`
      SELECT DISTINCT mesa 
      FROM voters 
      ORDER BY mesa
    `);
    
    res.json(mesas.map(m => m.mesa));
  } catch (error) {
    console.error('Get mesas error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Delete all voters (for re-import)
router.delete('/all', async (req, res) => {
  try {
    const result = await runQuery('DELETE FROM voters');
    res.json({ 
      message: `Se eliminaron todos los votantes (${result.changes} registros)`,
      deleted: result.changes
    });
  } catch (error) {
    console.error('Delete all voters error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
