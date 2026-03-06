import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { votersApi, authApi } from '../api/api';
import Stats from '../components/Stats';
import SearchBar from '../components/SearchBar';
import VoterList from '../components/VoterList';
import VoterGroupedList from '../components/VoterGroupedList';
import ImportModal from '../components/ImportModal';
import VoterDetailModal from '../components/VoterDetailModal';

function Dashboard() {
  const { logout, addToast } = useAuth();
  const [voters, setVoters] = useState([]);
  const [stats, setStats] = useState({ total: 0, voted: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, voted, pending
  const [mesaFilter, setMesaFilter] = useState(null);
  const [referidorFilter, setReferidorFilter] = useState(null);
  const [mesas, setMesas] = useState([]);
  const [referidores, setReferidores] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'list'

  const fetchVoters = async () => {
    try {
      const filters = {};
      if (search) filters.search = search;
      if (filter !== 'all') filters.filter = filter;
      if (mesaFilter) filters.mesa = mesaFilter;
      if (referidorFilter) filters.referidor = referidorFilter;
      
      const data = await votersApi.getAll(filters);
      setVoters(data);
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  const fetchStats = async () => {
    try {
      const data = await votersApi.getStats();
      setStats({
        total: data.total,
        voted: data.voted,
        pending: data.pending
      });
      // Extraer lista de mesas
      if (data.mesas) {
        setMesas(data.mesas.map(m => m.mesa));
      }
      // Extraer lista de referidores
      if (data.referrers) {
        setReferidores(data.referrers.map(r => r.referidor));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetchVoters();
  }, [search, filter, mesaFilter, referidorFilter]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchVoters(), fetchStats()]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    addToast('Datos actualizados', 'success');
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
    }
  };

  const handleImport = async (file) => {
    try {
      const result = await votersApi.import(file);
      
      // Build detailed message
      let message = `✅ Importación completada: ${result.imported} nuevos, ${result.skipped} omitidos`;
      
      // Show detailed info if there are issues
      if (result.skipped > 0) {
        const parts = [];
        
        // Show validation errors
        if (result.errors && result.errors.length > 0) {
          const errorSummary = result.errors.slice(0, 5).map(e => 
            `• ${e.voter || 'Desconocido'} (${e.cedula || 'sin cédula'}): ${e.errors.join(', ')}`
          ).join('\n');
          
          const moreText = result.errors.length > 5 ? 
            `\n...y ${result.errors.length - 5} errores más` : '';
          
          parts.push(`⚠️ Errores de validación (${result.errors.length}):\n${errorSummary}${moreText}`);
        }
        
        // Show duplicates
        if (result.duplicates > 0) {
          parts.push(`📋 ${result.duplicates} voters ya existían en la base de datos`);
        }
        
        alert(`${message}\n\n${parts.join('\n\n')}`);
      } else {
        addToast(message, 'success');
      }
      
      setShowImportModal(false);
      await loadData();
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  const handleVote = async (voterId) => {
    try {
      await votersApi.vote(voterId);
      addToast('✅ Votante marcado como votado', 'success');
      await loadData();
      setShowDetailModal(false);
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  const handleVoterClick = (voter) => {
    setSelectedVoter(voter);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedVoter(null);
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setSearch('');
    setFilter('all');
    setMesaFilter(null);
    setReferidorFilter(null);
  };

  // Contador de filtros activos
  const activeFilters = [
    filter !== 'all',
    mesaFilter,
    referidorFilter,
    search
  ].filter(Boolean).length;

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header">
        <h1>🗳️ Votantes</h1>
        <div className="header-actions">
          {/* Botón para cambiar vista */}
          <button 
            className="btn btn-ghost btn-icon" 
            onClick={() => setViewMode(viewMode === 'grouped' ? 'list' : 'grouped')}
            title={viewMode === 'grouped' ? 'Vista de lista' : 'Vista agrupada'}
          >
            {viewMode === 'grouped' ? '📋' : '📊'}
          </button>
          <button 
            className="btn btn-ghost btn-icon" 
            onClick={handleRefresh}
            disabled={refreshing}
            title="Actualizar"
          >
            {refreshing ? '⏳' : '🔄'}
          </button>
          <button 
            className="btn btn-ghost btn-icon" 
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            🚪
          </button>
        </div>
      </div>

      {/* Stats */}
      <Stats stats={stats} />

      {/* Search and Filter */}
      <SearchBar 
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        mesaFilter={mesaFilter}
        setMesaFilter={setMesaFilter}
        referidorFilter={referidorFilter}
        setReferidorFilter={setReferidorFilter}
        mesas={mesas}
        referidores={referidores}
      />

      {/* Botón para limpiar filtros si hay activos */}
      {activeFilters > 0 && (
        <div className="active-filters-info">
          <span>{activeFilters} filtro(s) activo(s)</span>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={clearAllFilters}
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Voter List - según el modo de vista */}
      {viewMode === 'grouped' ? (
        <VoterGroupedList 
          voters={voters}
          loading={loading}
          onVoterClick={handleVoterClick}
        />
      ) : (
        <VoterList 
          voters={voters}
          loading={loading}
          onVoterClick={handleVoterClick}
        />
      )}

      {/* Import FAB */}
      <div className="fab-container">
        <button 
          className="fab fab-secondary"
          onClick={() => setShowImportModal(true)}
          title="Importar Excel"
        >
          📥
        </button>
      </div>

      {/* Modals */}
      {showImportModal && (
        <ImportModal 
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}

      {showDetailModal && selectedVoter && (
        <VoterDetailModal 
          voter={selectedVoter}
          onClose={handleCloseDetail}
          onVote={handleVote}
        />
      )}
    </div>
  );
}

export default Dashboard;
