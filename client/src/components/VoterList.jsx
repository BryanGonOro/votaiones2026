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

  return (
    <div className="voter-list">
      {voters.map((voter) => (
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
