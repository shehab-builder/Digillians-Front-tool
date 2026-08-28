import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  User,
  Trash2,
  Edit2,
  X,
  UserPlus,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../../services/api";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [pagination, setPagination] = useState({
    itemsPerPage: 12,
    currentPage: 1,
    totalPages: 1,
    total: 1,
  });
  // Modal States
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [activeTeamIdForStudent, setActiveTeamIdForStudent] = useState(null);

  // Form States
  const [teamFormData, setTeamFormData] = useState({
    name: "",
    projectName: "",
    description: "",
    cover: "",
    trackId: "",
  });

  const [studentFormData, setStudentFormData] = useState({
    fullName: "",
    studentCode: "",
  });

  // --- API FETCHERS ---
  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(
        `/teams?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}&${selectedTrack !== "ALL" ? "trackId=" + selectedTrack.id : ""}`,
      );
      if (!res) throw new Error("Failed to fetch teams");
      const data = res.data;
      setTeams(data.data || data);
      setPagination((prev) => {
        return {
          ...prev,
          totalPages: res.data.pagination.totalPages,
          total: res.data.pagination.total,
        };
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await api.get("/track");
        const data = res.data;
        const trackList = data.data || data;
        setTracks(trackList);

        if (trackList.length > 0 && !teamFormData.trackId) {
          setTeamFormData((prev) => ({ ...prev, trackId: trackList[0].id }));
        }
      } catch (err) {
        console.error("Error fetching tracks:", err);
      }
    };
    fetchTracks();
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(
          `/teams?page=${currentPage}&limit=${pagination.itemsPerPage}&${selectedTrack !== "ALL" ? "trackId=" + selectedTrack : ""}`,
        );
        if (!res) throw new Error("Failed to fetch teams");
        const data = res.data;
        console.log(res.data);

        setTeams(data.data || data);
        setPagination((prev) => {
          return {
            ...prev,
            totalPages: res.data.pagination.totalPages,
            total: res.data.pagination.total,
          };
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [selectedTrack, currentPage]);

  // Reset pagination when filtering
  // useEffect(() => {
  //   setPagination((prev)=>{
  //     itemsPerPage:10,
  //     totalPages :1,
  //     total: 1,
  //     currentPage:1
  //   });
  // }, [searchTerm, selectedTrack]);

  // --- TEAM HANDLERS ---
  const handleOpenTeamModal = (teamToEdit = null) => {
    if (teamToEdit) {
      setEditingTeam(teamToEdit);
      setTeamFormData({
        name: teamToEdit.name || "",
        projectName: teamToEdit.projectName || "",
        description: teamToEdit.description || "",
        cover: teamToEdit.cover || "",
        trackId: teamToEdit.trackId || teamToEdit.track?.id || "",
      });
    } else {
      setEditingTeam(null);
      setTeamFormData({
        name: "",
        projectName: "",
        description: "",
        cover: "",
        trackId: tracks[0]?.id || "",
      });
    }
    setTeamModalOpen(true);
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingTeam) {
        res = await api.patch(`/teams/${editingTeam.id}`, teamFormData);
        if (res.status !== 200) throw new Error("Failed to save team");
      } else {
        res = await api.post("/teams", teamFormData);
        if (res.status !== 201) throw new Error("Failed to save team");
      }
      setTeamModalOpen(false);
      await fetchTeams();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      const res = await api.delete(`/teams/${id}`);
      if (res.status !== 200) throw new Error("Failed to delete team");
      setTeams((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  // --- STUDENT HANDLERS ---
  const handleOpenStudentModal = (teamId) => {
    setActiveTeamIdForStudent(teamId);
    setStudentFormData({ fullName: "", studentCode: "" });
    setStudentModalOpen(true);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!activeTeamIdForStudent) return;

    try {
      const res = await api.post(
        `/teams/${activeTeamIdForStudent}/students`,
        studentFormData,
      );
      if (res.status !== 201) throw new Error("Failed to add student");
      setStudentModalOpen(false);
      await fetchTeams();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Remove student from team?")) return;
    try {
      const res = await api.delete(`/teams/students/${studentId}`);
      if (res.status !== 200) throw new Error("Failed to remove student");
      await fetchTeams();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- FILTERING & PAGINATION LOGIC ---

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-white min-h-screen text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight">
            Teams Directory
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Register teams, update metadata, and manage assigned student
            rosters.
          </p>
        </div>
        <button
          onClick={() => handleOpenTeamModal()}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
        >
          <Plus size={16} />
          <span>Register Team</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search team, project, or student name..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>

        <select
          value={selectedTrack}
          onChange={(e) => {
            setSelectedTrack(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-600 outline-none"
        >
          <option value="ALL">All Tracks</option>
          {tracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.name}
            </option>
          ))}
        </select>
      </div>

      {/* Loading / Error States */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400 space-x-2">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-xs font-bold">Loading teams...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">
          {error}
        </div>
      )}

      {/* Team Cards Grid */}
      {!loading && !error && (
        <>
          {teams.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs font-bold">
              No teams found matching the specified filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="h-36 bg-slate-100 relative overflow-hidden">
                      <img
                        src={
                          team.cover ||
                          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop"
                        }
                        alt={team.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                        {team.track && (
                          <span className="bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md border border-white/10">
                            {team.track.name}
                          </span>
                        )}
                        <button
                          onClick={() => handleOpenTeamModal(team)}
                          className="p-1.5 bg-white text-black hover:bg-blue-600 hover:text-white rounded-lg shadow transition-colors ml-auto"
                          title="Edit Team"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="text-base font-extrabold text-black">
                          {team.name}
                        </h3>
                        <p className="text-xs font-bold text-blue-600 mt-0.5">
                          {team.projectName}
                        </p>
                        {team.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {team.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Roster ({team.students?.length || 0})
                          </span>
                          <button
                            onClick={() => handleOpenStudentModal(team.id)}
                            className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                          >
                            <UserPlus size={12} />
                            <span>Add Student</span>
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {!team.students || team.students.length === 0 ? (
                            <p className="text-xs text-slate-400 font-medium italic">
                              No students assigned.
                            </p>
                          ) : (
                            team.students.map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 group"
                              >
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                                    <User size={12} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-black leading-tight">
                                      {student.fullName}
                                    </p>
                                    {student.studentCode && (
                                      <p className="text-[10px] font-medium text-slate-400">
                                        Code: {student.studentCode}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() =>
                                    handleDeleteStudent(student.id)
                                  }
                                  className="p-1 text-slate-400 hover:text-red-600 rounded"
                                  title="Remove Student"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center space-x-1"
                    >
                      <Trash2 size={13} />
                      <span>Delete Team</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {teams.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500">
                Showing {currentPage} to {pagination.totalPages} of{" "}
                {pagination.total} teams
              </span>

              <div className="flex items-center space-x-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="text-xs font-bold text-slate-800 px-2">
                  Page {currentPage} of {pagination.totalPages}
                </span>

                <button
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* --- CREATE / EDIT TEAM MODAL --- */}
      {teamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-extrabold text-black">
                {editingTeam ? "Edit Team" : "Register New Team"}
              </h2>
              <button
                onClick={() => setTeamModalOpen(false)}
                className="text-slate-400 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSaveTeam}
              className="space-y-3 text-xs font-bold text-slate-700"
            >
              <div>
                <label className="block mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={teamFormData.name}
                  onChange={(e) =>
                    setTeamFormData({ ...teamFormData, name: e.target.value })
                  }
                  placeholder="e.g. NeuralCrafter"
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={teamFormData.projectName}
                  onChange={(e) =>
                    setTeamFormData({
                      ...teamFormData,
                      projectName: e.target.value,
                    })
                  }
                  placeholder="e.g. Autonomous Medical Diagnostics"
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Track</label>
                <select
                  required
                  value={teamFormData.trackId}
                  onChange={(e) =>
                    setTeamFormData({
                      ...teamFormData,
                      trackId: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 outline-none bg-white text-slate-800"
                >
                  <option value="" disabled>
                    Select a track...
                  </option>
                  {tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Cover Image URL (Optional)</label>
                <input
                  type="url"
                  value={teamFormData.cover}
                  onChange={(e) =>
                    setTeamFormData({ ...teamFormData, cover: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={teamFormData.description}
                  onChange={(e) =>
                    setTeamFormData({
                      ...teamFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief summary..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setTeamModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  {editingTeam ? "Update Team" : "Save Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD STUDENT MODAL --- */}
      {studentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-extrabold text-black">
                Add Student to Roster
              </h2>
              <button
                onClick={() => setStudentModalOpen(false)}
                className="text-slate-400 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleAddStudent}
              className="space-y-3 text-xs font-bold text-slate-700"
            >
              <div>
                <label className="block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={studentFormData.fullName}
                  onChange={(e) =>
                    setStudentFormData({
                      ...studentFormData,
                      fullName: e.target.value,
                    })
                  }
                  placeholder="e.g. Ahmad Hassan"
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">
                  Student Code / ID (Optional)
                </label>
                <input
                  type="text"
                  value={studentFormData.studentCode}
                  onChange={(e) =>
                    setStudentFormData({
                      ...studentFormData,
                      studentCode: e.target.value,
                    })
                  }
                  placeholder="e.g. 2024001"
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setStudentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
