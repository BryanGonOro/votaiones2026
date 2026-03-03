import { useState, useRef } from 'react';
import { votersApi } from '../api/api';

function ImportModal({ onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [clearing, setClearing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    const isExcel = ['xlsx', 'xls'].includes(extension);
    
    if (!isExcel) {
      alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleImport = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      await onImport(file);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    const confirmDelete = window.confirm(
      '⚠️ ¿Estás seguro de eliminar TODOS los votantes?\n\n' +
      'Esta acción no se puede deshacer y eliminará todos los registros de la base de datos.'
    );
    
    if (!confirmDelete) return;
    
    setClearing(true);
    try {
      const result = await votersApi.deleteAll();
      alert(result.message);
      // Notify parent to refresh data
      window.location.reload();
    } catch (error) {
      alert('Error al eliminar: ' + error.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📥 Importar Votantes</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* Botón para eliminar todos los voters */}
          <div className="import-options">
            <button 
              className="btn btn-danger"
              onClick={handleClearAll}
              disabled={clearing}
            >
              {clearing ? 'Eliminando...' : '🗑️ Eliminar todos los votantes'}
            </button>
            <p className="import-options-hint">
              Úsalo si quieres vaciar la base de datos y comenzar de nuevo
            </p>
          </div>

          <hr className="import-divider" />
          
          <div className="import-section-title">
            <h3>Subir nuevo Excel</h3>
          </div>
        
          <div 
            className={`file-upload ${dragOver ? 'dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="file-upload-icon">📊</div>
            <div className="file-upload-text">
              {file ? file.name : 'Arrastra un archivo o haz clic para seleccionar'}
            </div>
            <div className="file-upload-hint">
              Formatos aceptados: .xlsx, .xls
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {file && (
            <div className="file-preview">
              <div className="file-preview-item">
                <span>Archivo seleccionado:</span>
                <strong>{file.name}</strong>
              </div>
              <div className="file-preview-item">
                <span>Tamaño:</span>
                <span>{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          )}

          <div className="mt-md">
            <h4 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Formato esperado del Excel:
            </h4>
            <div style={{ 
              background: 'var(--background)', 
              padding: '12px', 
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>CEDULA</strong> - Número de identificación
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>NOMBRE</strong> - Nombre completo
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>MESA</strong> - Número de mesa
              </div>
              <div>
                <strong>REFERIDOR</strong> - Persona que lo trajo (opcional)
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button 
            className="btn btn-success" 
            onClick={handleImport}
            disabled={!file || loading}
          >
            {loading ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportModal;
