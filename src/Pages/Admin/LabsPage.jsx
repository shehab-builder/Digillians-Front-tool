import { useEffect, useState } from "react";
import {
  User,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../../services/api";

export default function LabsPage() {
  const [labs, setLabs] = useState([]);
  const [availableJudges, setAvailableJudges] = useState([]);
  const [tracks, setTracks] = useState([]);

  // Filter & Pagination State
  const [selectedTrackId, setSelectedTrackId] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 9; // Number of items per page

  // Modals & Forms State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLab, setEditingLab] = useState(null);
  const [viewingLab, setViewingLab] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    code: "",
    building: "",
    floor: "",
    trackId: "",
    judgeId: "",
  });

  // Fetch initial tracks & judges once
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [judgesRes, tracksRes] = await Promise.all([
          api.get("/judge"),
          api.get("/track"),
        ]);
        setAvailableJudges(judgesRes.data.data || []);
        setTracks(tracksRes.data.data || []);
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };
    fetchMetadata();
  }, []);

  // Re-fetch labs whenever page or track filter changes
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        // Build query parameters matching the APIFeatures filter & paginate logic
        const params = {
          page: currentPage,
          limit,
        };

        if (selectedTrackId && selectedTrackId !== "ALL") {
          params.trackId = selectedTrackId;
        }

        const res = await api.get("/lab", { params });

        setLabs(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || 0);
      } catch (error) {
        console.error("Error fetching labs:", error);
      }
    };

    fetchLabs();
  }, [selectedTrackId, currentPage]);

  // Track filter selection handler
  const handleTrackSelect = (trackId) => {
    setSelectedTrackId(trackId);
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  // Reset Form Inputs
  const resetForm = () => {
    setFormData({
      code: "",
      building: "",
      floor: "",
      trackId: "",
      judgeId: "",
    });
    setEditingLab(null);
  };

  // Handle Create / Update Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.trackId) return;

    const payload = {
      code: formData.code,
      building: formData.building || null,
      floor: formData.floor || null,
      trackId: formData.trackId,
      judgeId: formData.judgeId || null,
    };

    try {
      if (editingLab) {
        await api.patch(`/lab/${editingLab.id}`, payload);
      } else {
        await api.post("/lab", payload);
      }

      const fetchLabs = async () => {
        try {
          // Build query parameters matching the APIFeatures filter & paginate logic
          const params = {
            page: currentPage,
            limit,
          };

          if (selectedTrackId && selectedTrackId !== "ALL") {
            params.trackId = selectedTrackId;
          }

          const res = await api.get("/lab", { params });

          setLabs(res.data.data || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalItems(res.data.total || 0);
        } catch (error) {
          console.error("Error fetching labs:", error);
        }
      };

      setIsCreateOpen(false);
      resetForm();
      fetchLabs(); // Refresh grid with updated data
    } catch (error) {
      console.error("Error saving lab:", error);
    }
  };

  // Open Edit Modal
  const handleEditClick = (lab) => {
    setEditingLab(lab);
    setFormData({
      code: lab.code || "",
      building: lab.building || "",
      floor: lab.floor || "",
      trackId: lab.trackId || lab.track?.id || "",
      judgeId: lab.judgeId || lab.judge?.id || "",
    });
    setIsCreateOpen(true);
  };

  // Handle Delete Lab
  const handleDeleteLab = async (labId) => {
    if (!window.confirm("Are you sure you want to delete this lab?")) return;

    try {
      await api.delete(`/lab/${labId}`);
      if (viewingLab?.id === labId) setViewingLab(null);

      const fetchLabs = async () => {
        try {
          // Build query parameters matching the APIFeatures filter & paginate logic
          const params = {
            page: currentPage,
            limit,
          };

          if (selectedTrackId && selectedTrackId !== "ALL") {
            params.trackId = selectedTrackId;
          }

          const res = await api.get("/lab", { params });

          setLabs(res.data.data || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalItems(res.data.total || 0);
        } catch (error) {
          console.error("Error fetching labs:", error);
        }
      };

      fetchLabs(); // Refresh data after deletion
    } catch (error) {
      console.error("Error deleting lab:", error);
    }
  };

  // Handle Quick Judge Assignment
  const handleAssignJudge = async (labId, judgeId) => {
    try {
      const res = await api.patch(`/lab/${labId}`, {
        judgeId: judgeId || null,
      });

      const updatedLab = res.data.data;
      setLabs((prev) => prev.map((l) => (l.id === labId ? updatedLab : l)));
    } catch (error) {
      console.error("Error assigning judge:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight">
            Labs & Schedule Management
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage physical evaluation spaces and enforce 1-to-1 judge
            assignments.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus size={16} />
          <span>Create New Lab</span>
        </button>
      </div>

      {/* Track Filter Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => handleTrackSelect("ALL")}
          className={`px-4 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-all ${
            selectedTrackId === "ALL"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-black"
          }`}
        >
          All Tracks
        </button>
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => handleTrackSelect(track.id)}
            className={`px-4 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-all ${
              selectedTrackId === track.id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-black"
            }`}
          >
            {track.name}
          </button>
        ))}
      </div>

      {/* Labs Grid */}
      {labs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          No labs found for the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {labs.map((lab) => {
            const scheduledCount = lab._count?.schedulledEvaluations || 0;

            return (
              <div
                key={lab.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header Info */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
                        {lab.track?.name || lab.trackName || "Unassigned Track"}
                      </span>
                      <h3 className="text-lg font-bold text-black">
                        {lab.code}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        {lab.building || "N/A"} ({lab.floor || "N/A"})
                      </span>
                    </div>
                  </div>

                  {/* Judge Section */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        Assigned Judge:
                      </span>
                      {lab.judge ? (
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                          {lab.judge.title} {lab.judge.name}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          Unassigned
                        </span>
                      )}
                    </div>

                    {/* Inline Select Judge */}
                    <div className="flex gap-2 pt-1">
                      <select
                        value={lab.judgeId || lab.judge?.id || ""}
                        onChange={(e) =>
                          handleAssignJudge(lab.id, e.target.value)
                        }
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      >
                        <option value="">-- No Judge Assigned --</option>
                        {availableJudges.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.title} {j.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Schedule Stats */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>Scheduled Evaluations:</span>
                      </div>
                      <strong className="text-slate-900 font-bold">
                        {scheduledCount}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setViewingLab(lab)}
                    className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleEditClick(lab)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                    title="Edit Lab"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteLab(lab.id)}
                    className="p-2 bg-slate-50 hover:bg-red-50 border border-slate-200 text-slate-400 hover:text-red-600 rounded-xl text-xs font-semibold transition-colors"
                    title="Delete Lab"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-3 rounded-2xl">
          <p className="text-xs text-slate-500 font-medium">
            Showing Page{" "}
            <span className="font-bold text-slate-900">{currentPage}</span> of{" "}
            <span className="font-bold text-slate-900">{totalPages}</span> (
            {totalItems} Labs)
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 text-xs font-bold rounded-xl transition-all ${
                  currentPage === page
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-black">
                {editingLab ? "Edit Lab" : "Create New Lab"}
              </h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Track *
                </label>
                <select
                  required
                  value={formData.trackId}
                  onChange={(e) =>
                    setFormData({ ...formData, trackId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="" disabled>
                    Select Track
                  </option>
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lab Code / Room *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab 101"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Building
                  </label>
                  <input
                    type="text"
                    placeholder="Building A"
                    value={formData.building}
                    onChange={(e) =>
                      setFormData({ ...formData, building: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Floor
                  </label>
                  <input
                    type="text"
                    placeholder="2nd Floor"
                    value={formData.floor}
                    onChange={(e) =>
                      setFormData({ ...formData, floor: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Judge (Optional)
                </label>
                <select
                  value={formData.judgeId}
                  onChange={(e) =>
                    setFormData({ ...formData, judgeId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {availableJudges.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} {j.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"
                >
                  {editingLab ? "Update Lab" : "Save Lab"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED VIEW MODAL */}
      {viewingLab && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">
                  {viewingLab.track?.name || "Track Info"}
                </span>
                <h3 className="text-xl font-bold text-black">
                  {viewingLab.code}
                </h3>
              </div>
              <button
                onClick={() => setViewingLab(null)}
                className="text-slate-400 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block">Building</span>
                  <strong className="text-slate-900 font-semibold">
                    {viewingLab.building || "N/A"}
                  </strong>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Floor</span>
                  <strong className="text-slate-900 font-semibold">
                    {viewingLab.floor || "N/A"}
                  </strong>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">
                  Assigned Judge
                </span>
                {viewingLab.judge ? (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center space-x-2">
                    <User size={16} className="text-blue-600" />
                    <span className="font-bold text-blue-900">
                      {viewingLab.judge.title} {viewingLab.judge.name}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl font-medium text-xs">
                    No judge explicitly assigned to this lab yet.
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">
                  Scheduled Evaluations
                </span>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                  <span className="font-medium text-slate-700">
                    Total Scheduled
                  </span>
                  <span className="font-bold text-black">
                    {viewingLab._count?.schedulledEvaluations ||
                      viewingLab.schedulledEvaluations?.length ||
                      0}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingLab(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
