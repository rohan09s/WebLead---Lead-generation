export default function SearchFilterBar({
  search,
  setSearch,
  filterPhone,
  setFilterPhone,
  sortBy,
  setSortBy,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 15,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 10,
      }}
    >
      {/* SEARCH */}
      <input
        placeholder="Search by name or message..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: 8, width: "200px" }}
      />

      {/* FILTER PHONE */}
      <input
        placeholder="Filter by phone prefix..."
        value={filterPhone}
        onChange={(e) => setFilterPhone(e.target.value)}
        style={{ padding: 8, width: "160px" }}
      />

      {/* SORT */}
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        style={{ padding: 8 }}
      >
        <option value="latest">Latest First</option>
        <option value="oldest">Oldest First</option>
        <option value="name">Name (A → Z)</option>
      </select>
    </div>
  );
}