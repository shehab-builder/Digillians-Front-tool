import { useEffect, useState } from "react";
import { UserCheck, Plus, Search, Building2, Trash2 } from "lucide-react";
import api from "../../services/api";

export default function JudgesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [judges, setJudges] = useState([]);

  useEffect(() => {
    async function getAllJudges() {
      try {
        const response = await api.get("/judge");
        setJudges(response.data.data || []);
        console.log(response.data.data);
      } catch (error) {
        console.error("Failed to fetch judges:", error);
      }
    }
    getAllJudges();
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    title: "DR", // Default title option
    labCode: "",
  });

  const handleCreateJudge = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username) return;

    try {
      const response = await api.post("/judge/", {
        name: formData.name,
        username: formData.username,
        password: formData.password,
        title: formData.title,
        labId: formData.labCode,
      });

      const newCreatedJudge = response.data.data;
      setJudges((prev) => [...prev, newCreatedJudge]);

      setFormData({
        name: "",
        username: "",
        password: "",
        title: "DR",
        labCode: "",
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating judge:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/judge/${id}`);
      setJudges((prev) => prev.filter((j) => j.id !== id));
    } catch (error) {
      console.error("Failed to delete judge:", error);
    }
  };

  const filteredJudges = judges.filter(
    (j) =>
      j.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.username?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-black tracking-tight">
            Judges Directory
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Create evaluator credentials and bind judges to active competition
            labs.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
        >
          <Plus size={16} />
          <span>Add New Judge</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search judge name, username, or lab..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Judges Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="p-4">Judge</th>
              <th className="p-4">Username</th>
              <th className="p-4">Title / Role</th>
              <th className="p-4">Assigned Lab</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium">
            {filteredJudges.map((judge) => (
              <tr
                key={judge.id}
                className="hover:bg-slate-50/60 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <UserCheck size={16} />
                    </div>
                    <span className="font-bold text-slate-900">
                      {judge.name}
                    </span>
                  </div>
                </td>
                <td className="p-4 font-mono text-slate-600">
                  @{judge.username}
                </td>
                <td className="p-4 text-slate-600 font-semibold">
                  {judge.title || "—"}
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 text-[11px]">
                    <Building2 size={12} className="text-slate-500" />
                    <span>
                      {judge.labCode || judge?.lab?.code || "Unassigned"}
                    </span>
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleDelete(judge.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Judge Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <h2 className="text-lg font-bold text-black">Register New Judge</h2>
            <form
              onSubmit={handleCreateJudge}
              className="space-y-4 text-xs font-bold text-slate-700"
            >
              <div>
                <label className="block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Alan Turing"
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="e.g. a_turing"
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block mb-1">Title / Designation</label>
                <select
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="PROFESSOR">PROFESSOR</option>
                  <option value="DR">DR</option>
                  <option value="ENGINEER">ENGINEER</option>
                  <option value="MR">MR</option>
                  <option value="MS">MS</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                >
                  Create Judge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
