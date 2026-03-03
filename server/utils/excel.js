import * as XLSX from 'xlsx';

export function parseExcelFile(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  return data.map(row => {
    // Normalize column names (handle different cases and spaces)
    const normalizedRow = {};
    Object.keys(row).forEach(key => {
      const normalizedKey = key.toUpperCase().trim();
      normalizedRow[normalizedKey] = row[key];
    });
    
    return {
      cedula: String(normalizedRow['CEDULA'] || normalizedRow['CÉDULA'] || '').trim(),
      nombre: String(normalizedRow['NOMBRE'] || normalizedRow['NOMBRE'] || '').trim(),
      mesa: String(normalizedRow['MESA'] || '').trim(),
      referidor: String(normalizedRow['REFERIDOR'] || normalizedRow['REFERIDO'] || '').trim()
    };
  }).filter(row => row.cedula && row.nombre); // Filter out rows without cedula or nombre
}

export function validateVoterData(voter) {
  const errors = [];
  
  if (!voter.cedula || voter.cedula.length < 5) {
    errors.push('Cédula inválida');
  }
  
  if (!voter.nombre || voter.nombre.length < 2) {
    errors.push('Nombre inválido');
  }
  
  if (!voter.mesa) {
    errors.push('Mesa requerida');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
