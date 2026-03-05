import VoterItem from './VoterItem';

function VoterList({ voters, loading, onVoterClick }) {
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

  // Sort voters: voted first (by voted status desc), then alphabetically by name
  const sortedVoters = [...voters].sort((a, b) => {
    // First sort by voted status (voted = true comes first)
    if (a.voted !== b.voted) {
      return b.voted ? 1 : -1;
    }
    // Then sort alphabetically by name
    return a.nombre.localeCompare(b.nombre);
  });

  return (
    <div className="voter-list">
      {sortedVoters.map((voter) => (
        <VoterItem 
          key={voter.id} 
          voter={voter} 
          onClick={() => onVoterClick(voter)}
        />
      ))}
    </div>
  );
}

export default VoterList;
