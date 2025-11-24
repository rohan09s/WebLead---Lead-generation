import { useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("business");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  async function registerUser(e) {
    e.preventDefault();

    // Basic validation
    const errs = {};
    if (!name) errs.name = 'Name is required';
    if (!email) errs.email = 'Email is required';
    if (!password) errs.password = 'Password is required';
    if (role === 'business') {
      if (!category) errs.category = 'Category is required for businesses';
      if (!location) errs.location = 'Location is required for businesses';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setSubmitting(true);
      await api.post("/api/auth/register", { name, email, password, role, category, location, description });
      if (role === "business") {
        alert("Business registered. Please login.");
        nav("/login");
      } else {
        // Redirect customers to onboarding
        nav("/onboarding");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-2">{role === "business" ? "Register Business" : "Register Account"}</h2>

        <form onSubmit={registerUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Account Type</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block w-full border rounded-md px-3 py-2">
              <option value="business">Business</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          <div>
            <label className="sr-only">Name</label>
            <input className="mt-1 block w-full border rounded-md px-3 py-2" placeholder="Name" value={name} onChange={(e) => { setName(e.target.value); setErrors(s=>({ ...s, name: undefined })); }} />
            {errors.name && <div className="text-sm text-red-600 mt-1">{errors.name}</div>}
          </div>

          <div>
            <label className="sr-only">Email</label>
            <input className="mt-1 block w-full border rounded-md px-3 py-2" placeholder="Email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors(s=>({ ...s, email: undefined })); }} />
            {errors.email && <div className="text-sm text-red-600 mt-1">{errors.email}</div>}
          </div>

          <div>
            <label className="sr-only">Password</label>
            <input className="mt-1 block w-full border rounded-md px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setErrors(s=>({ ...s, password: undefined })); }} />
            {errors.password && <div className="text-sm text-red-600 mt-1">{errors.password}</div>}
          </div>

          {role === "business" && (
            <div className="space-y-3">
              <div>
                <input className="mt-1 block w-full border rounded-md px-3 py-2" placeholder="Category (e.g. Hardware)" value={category} onChange={(e) => { setCategory(e.target.value); setErrors(s=>({ ...s, category: undefined })); }} />
                {errors.category && <div className="text-sm text-red-600 mt-1">{errors.category}</div>}
              </div>
              <div>
                <input className="mt-1 block w-full border rounded-md px-3 py-2" placeholder="Location (city)" value={location} onChange={(e) => { setLocation(e.target.value); setErrors(s=>({ ...s, location: undefined })); }} />
                {errors.location && <div className="text-sm text-red-600 mt-1">{errors.location}</div>}
              </div>
              <div>
                <textarea className="mt-1 block w-full border rounded-md px-3 py-2" placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
            </div>
          )}

          <div>
            <button disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-md">{submitting ? "Registering…" : "Register"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}