import { useState, useEffect } from 'react';

function SearchBar({ 
  search, 
  setSearch, 
  filter, 
  setFilter,
  referidorFilter,
  setReferidorFilter,
  mesaFilter,
  setMesaFilter,
  mesas = [],
  referidores = []
}) {
  const [searchType, setSearchType] = useState('nombre'); // nombre, cedula

  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (searchType === 'cedula') {
      // Solo permitir números para búsqueda por cédula
      const numericValue = value.replace(/\D/g, '');
      setSearch(numericValue);
    } else {
      setSearch(value);
    }
  };

  return (
    <div className="search-filter-container">
      {/* Filtro por Líder */}
      <div className="filter-select-container">
        <select
          value={referidorFilter || ''}
          onChange={(e) => setReferidorFilter(e.target.value || null)}
          className="filter-select"
        >
          <option value="">Todos los Líderes</option>
          {referidores.map(ref => (
            <option key={ref} value={ref}>{ref}</option>
          ))}
        </select>
      </div>
      
      {/* Tipo de búsqueda */}
      <div className="search-type-selector">
        <select 
          value={searchType} 
          onChange={(e) => setSearchType(e.target.value)}
          className="search-type-select"
        >
          <option value="nombre">Por Nombre</option>
          <option value="cedula">Por Cédula</option>
        </select>
      </div>

      {/* Barra de búsqueda */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder={searchType === 'cedula' ? 'Buscar por número de cédula...' : 'Buscar por nombre...'}
          value={search}
          onChange={handleSearchChange}
        />
        {search && (
          <button 
            className="search-clear"
            onClick={() => setSearch('')}
            title="Limpiar búsqueda"
          >
            ×
          </button>
        )}
      </div>
      
      {/* Filtro por Mesa */}
      <div className="filter-select-container">
        <select
          value={mesaFilter || ''}
          onChange={(e) => setMesaFilter(e.target.value || null)}
          className="filter-select"
        >
          <option value="">Todas las Mesas</option>
          {mesas.map(mesa => (
            <option key={mesa} value={mesa}>Mesa {mesa}</option>
          ))}
        </select>
      </div>
      
      {/* Filtros de estado (votaron/pendientes) */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos
        </button>
        <button
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pendientes
        </button>
        <button
          className={`filter-tab ${filter === 'voted' ? 'active' : ''}`}
          onClick={() => setFilter('voted')}
        >
          Votaron
        </button>
      </div>
    </div>
  );
}

export default SearchBar;
