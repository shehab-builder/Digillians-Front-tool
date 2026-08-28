import { useEffect, useState } from "react";
import { Plus, Sliders, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../../services/api";

export default function TracksPage() {
  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [newTrackName, setNewTrackName] = useState("");
  const [isAddingTrack, setIsAddingTrack] = useState(false);

  // Fetch all tracks on mount
  useEffect(() => {
    async function getAllTracks() {
      try {
        const response = await api.get("/track");
        const fetchedTracks = response.data.data || [];
        setTracks(fetchedTracks);

        // Default select the first track if available
        if (fetchedTracks.length > 0 && !selectedTrackId) {
          setSelectedTrackId(fetchedTracks[0].id);
        }
      } catch (error) {
        console.error("Error fetching tracks:", error);
      }
    }

    getAllTracks();
  }, []);

  // New Criteria Form State
  const [cType, setCType] = useState("PROJECT");
  const [cTitle, setCTitle] = useState("");
  const [cWeight, setCWeight] = useState(10);
  const [cMaxScore, setCMaxScore] = useState(10);

  const activeTrack = tracks.find((t) => t.id === selectedTrackId);
  const activeCriteria = activeTrack?.criteria || [];

  // Filter criteria by type
  const projectCriteria = activeCriteria.filter((c) => c.type === "PROJECT");
  const studentCriteria = activeCriteria.filter((c) => c.type === "STUDENT");

  // Calculate separate totals
  const projectWeight = projectCriteria.reduce(
    (acc, item) => acc + (Number(item.weight) || 0),
    0,
  );
  const studentWeight = studentCriteria.reduce(
    (acc, item) => acc + (Number(item.weight) || 0),
    0,
  );

  const handleAddTrack = async (e) => {
    e.preventDefault();
    if (!newTrackName.trim()) return;

    try {
      const response = await api.post("/track", { name: newTrackName });
      const createdTrack = response.data.data;

      setTracks((prev) => [...prev, { ...createdTrack, criteria: [] }]);
      setSelectedTrackId(createdTrack.id);
      setNewTrackName("");
      setIsAddingTrack(false);
    } catch (error) {
      console.error("Error creating track:", error);
    }
  };

  const handleAddCriteria = async (e) => {
    e.preventDefault();
    if (!cTitle.trim() || !selectedTrackId) return;

    try {
      const response = await api.post(`/track/${selectedTrackId}/criteria`, {
        type: cType,
        title: cTitle,
        weight: parseFloat(cWeight),
        maxScore: parseInt(cMaxScore, 10),
      });

      const newCriterion = response.data.data;

      setTracks((prevTracks) =>
        prevTracks.map((t) => {
          if (t.id === selectedTrackId) {
            return { ...t, criteria: [...(t.criteria || []), newCriterion] };
          }
          return t;
        }),
      );

      setCTitle("");
      setCWeight(10);
    } catch (error) {
      console.error("Error adding criteria:", error);
    }
  };

  const handleDeleteCriteria = async (criteriaId) => {
    try {
      await api.delete(`track/${selectedTrackId}/criteria/${criteriaId}`);

      setTracks((prevTracks) =>
        prevTracks.map((t) => {
          if (t.id === selectedTrackId) {
            return {
              ...t,
              criteria: t.criteria.filter((c) => c.id !== criteriaId),
            };
          }
          return t;
        }),
      );
    } catch (error) {
      console.error("Error deleting criteria:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight">
            Tracks & Criteria Setup
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Define competition tracks and weighted scoring dimensions for
            projects and students.
          </p>
        </div>
        <button
          onClick={() => setIsAddingTrack(true)}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus size={16} />
          <span>Add New Track</span>
        </button>
      </div>

      {/* Add Track Form */}
      {isAddingTrack && (
        <form
          onSubmit={handleAddTrack}
          className="bg-white p-4 border border-slate-200 rounded-2xl flex items-center gap-3"
        >
          <input
            type="text"
            required
            placeholder="e.g. Cybersecurity, Mobile App Dev"
            value={newTrackName}
            onChange={(e) => setNewTrackName(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            Save Track
          </button>
          <button
            type="button"
            onClick={() => setIsAddingTrack(false)}
            className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-slate-200"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Track Selection Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto pb-1">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => setSelectedTrackId(track.id)}
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

      {activeTrack ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Criteria Form Builder */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl h-fit space-y-4">
            <h3 className="font-bold text-black text-base flex items-center space-x-2">
              <Sliders size={18} className="text-blue-600" />
              <span>Add Criterion</span>
            </h3>

            <form onSubmit={handleAddCriteria} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Type
                </label>
                <select
                  value={cType}
                  onChange={(e) => setCType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                >
                  <option value="PROJECT">Project Criterion</option>
                  <option value="STUDENT">Student Criterion</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title / Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code Architecture"
                  value={cTitle}
                  onChange={(e) => setCTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Weight (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={cWeight}
                    onChange={(e) => setCWeight(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Score
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={cMaxScore}
                    onChange={(e) => setCMaxScore(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
              >
                Add Dimension
              </button>
            </form>
          </div>

          {/* Right Column: Split Criteria Lists */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Project Criteria Section */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden space-y-0">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h4 className="font-bold text-black text-sm">
                  Project Criteria ({projectCriteria.length})
                </h4>
                <div
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    projectWeight === 100
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {projectWeight === 100 ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                  <span>Weight: {projectWeight}% / 100%</span>
                </div>
              </div>

              {projectCriteria.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">
                  No project criteria defined yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {projectCriteria.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-blue-100 text-blue-700">
                            PROJECT
                          </span>
                          <span className="font-semibold text-slate-900 text-sm">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Weight:{" "}
                          <strong className="text-slate-800">
                            {item.weight}%
                          </strong>{" "}
                          | Max Score:{" "}
                          <strong className="text-slate-800">
                            {item.maxScore} pts
                          </strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteCriteria(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Student Criteria Section */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden space-y-0">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h4 className="font-bold text-black text-sm">
                  Student Criteria ({studentCriteria.length})
                </h4>
                <div
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    studentWeight === 100
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {studentWeight === 100 ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                  <span>Weight: {studentWeight}% / 100%</span>
                </div>
              </div>

              {studentCriteria.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">
                  No student criteria defined yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {studentCriteria.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-purple-100 text-purple-700">
                            STUDENT
                          </span>
                          <span className="font-semibold text-slate-900 text-sm">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Weight:{" "}
                          <strong className="text-slate-800">
                            {item.weight}%
                          </strong>{" "}
                          | Max Score:{" "}
                          <strong className="text-slate-800">
                            {item.maxScore} pts
                          </strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteCriteria(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm">
          No tracks available. Please add a track to configure evaluation
          dimensions.
        </div>
      )}
    </div>
  );
}
