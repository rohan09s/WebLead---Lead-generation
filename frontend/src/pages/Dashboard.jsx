import { useEffect, useState, useMemo } from "react";
import { api } from "../api";
import { useNavigate, Link } from "react-router-dom";
import LeadCard from "../pages/LeadCard";
import Pagination from "../pages/Pagination";
import SearchFilterBar from "../pages/SearchFilterBar";

export default function Dashboard() {
  const nav = useNavigate();
  const raw = localStorage.getItem('user')
  const currentUser = raw ? JSON.parse(raw) : null

  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [filterPhone, setFilterPhone] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) nav("/login");
    loadLeads();
  }, []);

  async function loadLeads() {
    try {
      const res = await api.get("/api/leads");
      setLeads(res.data);
    } catch (err) {
      alert("Session expired. Please login again.");
      nav("/login");
    }
  }

  // ---------------------------
  // Search + Filter + Sort
  // ---------------------------
  const processedLeads = useMemo(() => {
    let data = [...leads];

    // SEARCH
    if (search.trim() !== "") {
      data = data.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.message.toLowerCase().includes(search.toLowerCase())
      );
    }

    // FILTER by phone prefix (optional)
    if (filterPhone.trim() !== "") {
      data = data.filter((l) => l.phone.startsWith(filterPhone));
    }

    // SORT
    if (sortBy === "latest") {
      data = data.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
    }
    if (sortBy === "oldest") {
      data = data.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
    }
    if (sortBy === "name") {
      data = data.sort((a, b) => a.name.localeCompare(b.name));
    }

    return data;
  }, [leads, search, filterPhone, sortBy]);

  // ---------------------------
  // Pagination logic
  // ---------------------------
  const totalPages = Math.ceil(processedLeads.length / ITEMS_PER_PAGE);

  // simple stats: new leads in last 7 days
  const last7Count = processedLeads.filter((l) => {
    const ts = l.timestamp || l.createdAt || l.created_at;
    if (!ts) return false;
    const diff = Date.now() - new Date(ts).getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedLeads.slice(start, start + ITEMS_PER_PAGE);
  }, [processedLeads, currentPage]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-2xl font-semibold">
          {currentUser?.role === 'admin' && 'Dashboard — All Leads'}
          {currentUser?.role === 'business' && 'Dashboard — Leads for your business'}
          {currentUser?.role === 'customer' && 'Your Inquiries'}
          {!currentUser && 'Dashboard'}
        </h2>

        <div className="mt-3 sm:mt-0 flex items-center gap-4 text-sm text-slate-600">
          <div><span className="font-medium">Total:</span> <span className="ml-1">{leads.length}</span></div>
          <div><span className="font-medium">New (7d):</span> <span className="ml-1">{last7Count}</span></div>
          {currentUser?.role === 'customer' && <div className="text-slate-500">(submitted by you)</div>}
          {currentUser?.role === 'business' && <div className="text-slate-500">(for your business)</div>}
        </div>
      </div>

      <div className="mb-6">
        <SearchFilterBar
          search={search}
          setSearch={setSearch}
          filterPhone={filterPhone}
          setFilterPhone={setFilterPhone}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </div>

      <div className="space-y-4">
        {paginatedLeads.length === 0 && currentUser?.role === 'customer' ? (
          <div className="card border border-amber-100 bg-amber-50">
            <div className="font-semibold mb-2">You haven't submitted any inquiries yet.</div>
            <div className="mb-3 text-sm text-slate-700">Start by sending an inquiry to a business.</div>
            <Link to="/submit" className="inline-block">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Send an Inquiry</button>
            </Link>
          </div>
        ) : (
          paginatedLeads.map((l) => (
            <LeadCard key={l._id} lead={l} />
          ))
        )}
      </div>

      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}