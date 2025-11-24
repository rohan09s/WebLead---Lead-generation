export default function Pagination({ currentPage, setCurrentPage, totalPages }) {
  if (totalPages === 0) return null;

  return (
    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((p) => p - 1)}
      >
        Prev
      </button>

      <span>
        Page {currentPage} of {totalPages}
      </span>

      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage((p) => p + 1)}
      >
        Next
      </button>
    </div>
  );
}