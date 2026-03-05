import { useState, useMemo } from 'react';
import VoterItem from './VoterItem';

function VoterGroupedList({ voters, loading, onVoterClick }) {
  const [expandedMesas, setExpandedMesas] = useState({});
  const [expandedReferidores, setExpandedReferidores] = useState({});

    // Agrupar voters por mesa y luego por lider
  const groupedData = useMemo(() => {
    const groups = {};
    
    voters.forEach(voter => {
      const mesa = voter.mesa || 'Sin mesa';
      const referidor = voter.referidor || 'Sin lider';
      
      if (!groups[mesa]) {
        groups[mesa] = {
          voters: [],
          referidores: {}
        };
      }
      
      if (!groups[mesa].referidores[referidor]) {
        groups[mesa].referidores[referidor] = [];
      }
      
      groups[mesa].referidores[referidor].push(voter);
    });
    
    // Ordenar mesas numéricamente
    const sortedGroups = {};
    Object.keys(groups).sort((a, b) => {
      const aNum = a === 'Sin mesa' ? 9999 : parseInt(a);
      const bNum = b === 'Sin mesa' ? 9999 : parseInt(b);
      return aNum - bNum;
    }).forEach(key => {
      sortedGroups[key] = groups[key];
    });
    
    return sortedGroups;
  }, [voters]);

  const toggleMesa = (mesa) => {
    setExpandedMesas(prev => ({
      ...prev,
      [mesa]: !prev[mesa]
    }));
  };

  const toggleReferidor = (mesa, referidor) => {
    const key = `${mesa}-${referidor}`;
    setExpandedReferidores(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Contar voters por mesa
  const getMesaStats = (mesaData) => {
    let total = 0;
    let voted = 0;
    Object.values(mesaData.referidores).forEach(voters => {
      voters.forEach(v => {
        total++;
        if (v.voted) voted++;
      });
    });
    return { total, voted, pending: total - voted };
  };

  // Contar voters por lider
  const getLiderStats = (voters) => {
    const voted = voters.filter(v => v.voted).length;
    return { total: voters.length, voted, pending: voters.length - voted };
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (voters.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <h3>No hay votantes</h3>
        <p>Importa un archivo Excel para comenzar</p>
      </div>
    );
  }

  return (
    <div className="voter-grouped-list">
      {Object.entries(groupedData).map(([mesa, mesaData]) => {
        const mesaStats = getMesaStats(mesaData);
        const isMesaExpanded = expandedMesas[mesa];
        
        return (
          <div key={mesa} className="mesa-group">
            {/* Header de Mesa */}
            <div 
              className={`mesa-header ${isMesaExpanded ? 'expanded' : ''}`}
              onClick={() => toggleMesa(mesa)}
            >
              <div className="mesa-header-left">
                <span className="expand-icon">{isMesaExpanded ? '▼' : '▶'}</span>
                <span className="mesa-title">📍 Mesa {mesa}</span>
              </div>
              <div className="mesa-stats">
                <span className="stat-total">{mesaStats.total} voters</span>
                <span className="stat-voted">✅ {mesaStats.voted}</span>
                <span className="stat-pending">⏳ {mesaStats.pending}</span>
              </div>
            </div>

            {/* Lista de Líderes (acordeón dentro de cada mesa) */}
            {isMesaExpanded && (
              <div className="mesa-content">
                {Object.entries(mesaData.referidores).sort().map(([referidor, referidorVoters]) => {
                  // Sort: voted first, then alphabetically by name
                  const sortedVoters = [...referidorVoters].sort((a, b) => {
                    if (a.voted !== b.voted) {
                      return b.voted ? 1 : -1;
                    }
                    return a.nombre.localeCompare(b.nombre);
                  });
                  const refStats = getLiderStats(referidorVoters);
                  const refKey = `${mesa}-${referidor}`;
                  const isRefExpanded = expandedReferidores[refKey];
                  
                  return (
                    <div key={referidor} className="referidor-group">
                      {/* Header de Líder */}
                      <div 
                        className={`referidor-header ${isRefExpanded ? 'expanded' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReferidor(mesa, referidor);
                        }}
                      >
                        <div className="referidor-header-left">
                          <span className="expand-icon">{isRefExpanded ? '▼' : '▶'}</span>
                          <span className="referidor-title">
                            {referidor === 'Sin lider' ? '👤 Sin lider' : `👥 ${referidor}`}
                          </span>
                        </div>
                        <div className="referidor-stats">
                          <span className="stat-total">{refStats.total}</span>
                          <span className="stat-voted">✅ {refStats.voted}</span>
                          <span className="stat-pending">⏳ {refStats.pending}</span>
                        </div>
                      </div>

                      {/* Lista de Voters */}
                      {isRefExpanded && (
                        <div className="referidor-content">
                          {sortedVoters.map((voter) => (
                            <VoterItem 
                              key={voter.id} 
                              voter={voter} 
                              onClick={() => onVoterClick(voter)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default VoterGroupedList;
