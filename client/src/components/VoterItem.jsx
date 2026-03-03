function VoterItem({ voter, onClick }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCedula = (cedula) => {
    // Add thousand separators
    return cedula.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <div 
      className={`voter-item ${voter.voted ? 'voted' : ''}`}
      onClick={onClick}
    >
      <div className="voter-avatar">
        {voter.voted ? '✓' : getInitials(voter.nombre)}
      </div>
      
      <div className="voter-info">
        <div className="voter-name">{voter.nombre}</div>
        <div className="voter-details">
          <span className="voter-cedula">{formatCedula(voter.cedula)}</span>
          <span className="voter-mesa">Mesa {voter.mesa}</span>
        </div>
        {voter.referidor && (
          <div className="voter-referidor">
            Referido por: <span>{voter.referidor}</span>
          </div>
        )}
      </div>
      
      <div className="voter-status">
        <div className={`status-badge ${voter.voted ? 'voted' : 'pending'}`}>
          {voter.voted ? '✓' : '⏳'}
        </div>
      </div>
    </div>
  );
}

export default VoterItem;
