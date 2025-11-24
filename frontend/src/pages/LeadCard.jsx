// /frontend/src/components/LeadCard.jsx
export default function LeadCard({ lead }) {
  const ts = lead.timestamp || lead.createdAt || lead.created_at || Date.now();
  const dateStr = new Date(ts).toLocaleString();
  const raw = localStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;

  const businessDisplay = lead.businessName || lead.businessId || '—';

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-1">{lead.name || '—'}</h3>
          <div className="text-sm text-slate-600">
            <span className="mr-3">📞 <strong className="text-slate-800">{lead.phone || '—'}</strong></span>
            {lead.email ? (<span className="mr-3">✉️ <strong className="text-slate-800">{lead.email}</strong></span>) : null}
            <span className="text-xs text-slate-400">{dateStr}</span>
          </div>
        </div>

        <div className="sm:w-48 text-right">
          <div className="text-xs text-slate-500">Business</div>
          <div className="font-semibold text-slate-800">{businessDisplay}</div>
          {user?.role === 'admin' && lead.businessName && (
            <div className="text-xs text-slate-400">{lead.businessName}</div>
          )}
        </div>
      </div>

      <p className="mt-3 text-slate-700">{lead.message || <span className="text-slate-400">No message provided</span>}</p>
    </div>
  );
}