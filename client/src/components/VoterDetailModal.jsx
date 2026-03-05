import { useState } from 'react';

function VoterDetailModal({ voter, onClose, onVote }) {
  const [loading, setLoading] = useState(false);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCedula = (cedula) => {
    return cedula.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const handleVote = async () => {
    setLoading(true);
    try {
      await onVote(voter.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👤 Detalle del Votante</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="voter-detail">
            <div className="voter-detail-header">
              <div className="voter-detail-avatar">
                {voter.voted ? '✓' : getInitials(voter.nombre)}
              </div>
              <div>
                <div className="voter-detail-name">{voter.nombre}</div>
                <div className="voter-detail-cedula">
                  C.C. {formatCedula(voter.cedula)}
                </div>
              </div>
            </div>

            <div className="voter-detail-row">
              <span className="voter-detail-label">Mesa</span>
              <span className="voter-detail-value" style={{ color: 'var(--accent)' }}>
                {voter.mesa}
              </span>
            </div>

            <div className="voter-detail-row">
              <span className="voter-detail-label">Líder</span>
              <span className="voter-detail-value" style={{ color: 'var(--warning)' }}>
                {voter.referidor || 'Sin líder'}
              </span>
            </div>

            <div className="voter-detail-row">
              <span className="voter-detail-label">Estado</span>
              <span className={`voter-detail-value ${voter.voted ? 'voted' : ''}`}>
                {voter.voted ? '✅ Ya votó' : '⏳ Pendiente'}
              </span>
            </div>

            {voter.voted && voter.voted_at && (
              <div className="voter-detail-row">
                <span className="voter-detail-label">Fecha de votación</span>
                <span className="voter-detail-value">
                  {formatDate(voter.voted_at)}
                </span>
              </div>
            )}

            <div className="voter-detail-row">
              <span className="voter-detail-label">Registrado</span>
              <span className="voter-detail-value">
                {formatDate(voter.created_at)}
              </span>
            </div>

            {/* Vote button - only show if not voted */}
            {!voter.voted && (
              <button
                className="btn btn-success vote-button"
                onClick={handleVote}
                disabled={loading}
              >
                {loading ? 'Marcando...' : '✅ Marcar como Votado'}
              </button>
            )}

            {/* Already voted message */}
            {voter.voted && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: 'rgba(0, 217, 165, 0.1)', 
                borderRadius: '8px',
                textAlign: 'center',
                color: 'var(--success)'
              }}>
                ✓ Este votante ya ha emitido su voto
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary btn-block" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoterDetailModal;
