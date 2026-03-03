function Stats({ stats }) {
  return (
    <div className="stats-container">
      <div className="stat-card total">
        <span className="stat-value">{stats.total}</span>
        <span className="stat-label">Total</span>
      </div>
      <div className="stat-card voted">
        <span className="stat-value">{stats.voted}</span>
        <span className="stat-label">Votaron</span>
      </div>
      <div className="stat-card pending">
        <span className="stat-value">{stats.pending}</span>
        <span className="stat-label">Pendientes</span>
      </div>
    </div>
  );
}

export default Stats;
