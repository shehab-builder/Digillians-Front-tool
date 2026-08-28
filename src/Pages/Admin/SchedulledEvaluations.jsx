import { useState, useEffect } from "react";
import api from "../../services/api"; // Adjust path to your API client instance
import {
  Calendar,
  Building2,
  ListOrdered,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Save,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Users,
  Layers,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  X,
  Award,
} from "lucide-react";

export default function ScheduledEvaluations() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [tracks, setTracks] = useState([]);
  const [labs, setLabs] = useState([]);
  const [teams, setTeams] = useState([]);
  const [scheduledEvaluations, setScheduledEvaluations] = useState([]);

  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedLabId, setSelectedLabId] = useState("");
  const [selectedTeamToAdd, setSelectedTeamToAdd] = useState("");

  // Score Modal State
  const [selectedEvalScore, setSelectedEvalScore] = useState(null);
  const [modalTeamName, setModalTeamName] = useState("");
  const [loadingScore, setLoadingScore] = useState(false);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);

  // Initial Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [tracksRes, labsRes, scheduledRes] = await Promise.all([
          api.get("/track"),
          api.get("/lab"),
          api.get("/scheduled-evaluations"),
        ]);

        const fetchedTracks = tracksRes.data?.data || tracksRes.data || [];
        const fetchedLabs = labsRes.data?.data || labsRes.data || [];
        const fetchedScheduled =
          scheduledRes.data?.data || scheduledRes.data || [];

        setTracks(fetchedTracks);
        setLabs(fetchedLabs);
        setScheduledEvaluations(fetchedScheduled);

        if (fetchedTracks.length > 0) {
          const firstTrackId = fetchedTracks[0].id;
          setSelectedTrackId(firstTrackId);

          const initialLabs = fetchedLabs.filter(
            (l) => !l.trackId || l.trackId === firstTrackId,
          );
          if (initialLabs.length > 0) {
            setSelectedLabId(initialLabs[0].id);
          }
        } else if (fetchedLabs.length > 0) {
          setSelectedLabId(fetchedLabs[0].id);
        }
      } catch (err) {
        console.error("Failed to load scheduled evaluations data:", err);
        setError("Failed to sync with API backend. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch Teams per selected Track
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsRes = await api.get(`/teams/all?trackId=${selectedTrackId}`);
        const fetchedTeams = teamsRes.data?.data || teamsRes.data || [];
        setTeams(fetchedTeams);
      } catch (err) {
        console.error("Failed to fetch teams:", err);
      }
    };
    if (selectedTrackId) {
      fetchTeams();
    }
  }, [selectedTrackId]);

  const handleTrackChange = (trackId) => {
    setSelectedTrackId(trackId);
    setSelectedTeamToAdd("");

    const filteredLabs = labs.filter(
      (l) => !l.trackId || l.trackId === trackId,
    );
    if (filteredLabs.length > 0) {
      setSelectedLabId(filteredLabs[0].id);
    } else {
      setSelectedLabId("");
    }
  };

  const availableLabsForTrack = labs.filter(
    (lab) =>
      !selectedTrackId || !lab.trackId || lab.trackId === selectedTrackId,
  );

  const currentLabSchedule = scheduledEvaluations
    .filter((s) => s.labId === selectedLabId)
    .sort((a, b) => a.sequenceNo - b.sequenceNo);

  // Filter out teams that are already scheduled anywhere
  const scheduledTeamIds = new Set(scheduledEvaluations.map((s) => s.teamId));
  const availableUnscheduledTeams = teams.filter(
    (team) => !scheduledTeamIds.has(team.id),
  );

  // Add Team to Queue
  const handleAddTeamToSchedule = async () => {
    if (!selectedTeamToAdd || !selectedLabId) return;

    try {
      setSaving(true);
      setError(null);

      const nextSequenceNo =
        currentLabSchedule.length > 0
          ? Math.max(...currentLabSchedule.map((s) => s.sequenceNo)) + 1
          : 1;

      const payload = {
        teamId: selectedTeamToAdd,
        labId: selectedLabId,
        sequenceNo: nextSequenceNo,
        evaluated: false,
      };

      const res = await api.post("/scheduled-evaluations", payload);
      const newEntry = res.data?.data || res.data;

      setScheduledEvaluations((prev) => [...prev, newEntry]);
      setSelectedTeamToAdd("");
      setSuccessMsg("Team successfully scheduled.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Failed to schedule team:", err);
      setError(
        "Failed to add team to schedule. Ensure team isn't already assigned.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Reorder Sequence
  const handleMoveSequence = (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentLabSchedule.length) return;

    const updated = [...currentLabSchedule];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((item, idx) => ({
      ...item,
      sequenceNo: idx + 1,
    }));

    const otherSchedules = scheduledEvaluations.filter(
      (s) => s.labId !== selectedLabId,
    );
    setScheduledEvaluations([...otherSchedules, ...reordered]);
  };

  const handleSaveOrder = async () => {
    try {
      setSaving(true);
      setError(null);

      const updates = currentLabSchedule.map((item, idx) => ({
        id: item.id,
        sequenceNo: idx + 1,
      }));

      await api.put(`/scheduled-evaluations/reorder`, { items: updates });

      setSuccessMsg("Evaluation sequence successfully updated!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Failed to update sequence order:", err);
      setError("Failed to save sequence updates to server.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromSchedule = async (id) => {
    if (!window.confirm("Are you sure you want to remove this team?")) return;

    try {
      setSaving(true);
      setError(null);
      await api.delete(`/scheduled-evaluations/${id}`);
      setScheduledEvaluations((prev) => prev.filter((s) => s.id !== id));
      setSuccessMsg("Removed team from schedule.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Failed to delete schedule entry:", err);
      setError("Failed to remove team from schedule.");
    } finally {
      setSaving(false);
    }
  };

  // Fetch Team Evaluation Details for Modal View
  const handleViewScore = async (teamId, teamName) => {
    try {
      setLoadingScore(true);
      setModalTeamName(teamName);
      setScoreModalOpen(true);

      const res = await api.get(`/evaluations/projects/team/${teamId}`);
      const evalData = res.data?.data || res.data;
      setSelectedEvalScore(evalData);
    } catch (err) {
      console.error("Failed to fetch evaluation score:", err);
      setSelectedEvalScore(null);
    } finally {
      setLoadingScore(false);
    }
  };

  // Calculate Weighted Total Score
  const calculateTotalScore = (items = []) => {
    return items.reduce((acc, item) => {
      const weight = item.criteria?.weight || 0;
      const maxScore = item.criteria?.maxScore || 100;
      const itemScore = item.score || 0;
      return acc + (itemScore / maxScore) * weight;
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-500">
          Loading scheduled evaluations...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-black tracking-tight">
            Scheduled Evaluations
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Manage lab timelines, evaluate status, and review scores.
          </p>
        </div>

        {currentLabSchedule.length > 0 && (
          <button
            onClick={handleSaveOrder}
            disabled={saving}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>Save Sequence Order</span>
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center space-x-2 text-xs font-bold">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-4">
        {/* Track Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
            <Filter size={16} className="text-blue-600" />
            <span>Filter by Track</span>
          </label>

          <div className="flex flex-wrap gap-2">
            {tracks.map((track) => {
              const isSelected = selectedTrackId === track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => handleTrackChange(track.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {track.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Labs Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-2">
            <Building2 size={16} className="text-blue-600" />
            <span>Select Target Lab</span>
          </label>

          {availableLabsForTrack.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No labs found for selected track.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableLabsForTrack.map((lab) => {
                const count = scheduledEvaluations.filter(
                  (s) => s.labId === lab.id,
                ).length;
                const isSelected = selectedLabId === lab.id;

                return (
                  <button
                    key={lab.id}
                    onClick={() => setSelectedLabId(lab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>
                      {lab.name || lab.code || `Lab ${lab.id.slice(0, 4)}`}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                        isSelected
                          ? "bg-blue-700 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <ListOrdered size={18} className="text-blue-600" />
              <h2 className="text-base font-bold text-black">
                Evaluation Queue
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {currentLabSchedule.length} Teams Queued
            </span>
          </div>

          {currentLabSchedule.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">
                No evaluations scheduled for this lab yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentLabSchedule.map((item, index) => {
                const team =
                  item.team || teams.find((t) => t.id === item.teamId);

                return (
                  <div
                    key={item.id || item.teamId}
                    className="flex items-center justify-between p-4 bg-slate-50/80 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Sequence Badge */}
                      <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-black text-xs">
                        #{item.sequenceNo}
                      </div>

                      {/* Team & Evaluation Info */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-sm text-black">
                            {team?.name || "Unknown Team"}
                          </h3>

                          {/* Evaluated Badge */}
                          {item.evaluated ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                              <CheckCircle size={10} />
                              <span>Evaluated</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                              <Clock size={10} />
                              <span>Pending</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium mt-1">
                          {team?.projectName && (
                            <span>Project: {team.projectName}</span>
                          )}
                          {(team?.track?.name || team?.trackId) && (
                            <span className="flex items-center space-x-1 text-blue-600">
                              <Layers size={12} />
                              <span>
                                {team.track?.name ||
                                  tracks.find((tr) => tr.id === team.trackId)
                                    ?.name}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center space-x-2">
                      {/* VIEW SCORE BUTTON */}
                      <button
                        onClick={() =>
                          handleViewScore(
                            item.teamId,
                            team?.name || "Team Score",
                          )
                        }
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                        title="View Score Details"
                      >
                        <Eye size={14} />
                        <span>View Score</span>
                      </button>

                      <div className="h-4 w-[1px] bg-slate-200 mx-1" />

                      <button
                        onClick={() => handleMoveSequence(index, "up")}
                        disabled={index === 0}
                        className="p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 rounded-lg transition-colors"
                        title="Move Up"
                      >
                        <MoveUp size={16} />
                      </button>

                      <button
                        onClick={() => handleMoveSequence(index, "down")}
                        disabled={index === currentLabSchedule.length - 1}
                        className="p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 rounded-lg transition-colors"
                        title="Move Down"
                      >
                        <MoveDown size={16} />
                      </button>

                      <button
                        onClick={() => handleRemoveFromSchedule(item.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from Schedule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Schedule Add Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm h-fit">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-black flex items-center space-x-2">
              <Plus size={18} className="text-blue-600" />
              <span>Schedule Team</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Assign an unscheduled team to active lab queue.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Team
              </label>
              <select
                value={selectedTeamToAdd}
                onChange={(e) => setSelectedTeamToAdd(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-black focus:outline-none focus:border-blue-600"
              >
                <option value="">-- Select Unassigned Team --</option>
                {availableUnscheduledTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.projectName || "No Project"})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAddTeamToSchedule}
              disabled={!selectedTeamToAdd || saving || !selectedLabId}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition-colors flex justify-center items-center space-x-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              <span>Add to Schedule</span>
            </button>

            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center space-x-1">
                <Users size={14} />
                <span>Unassigned Pool</span>
              </div>
              <p className="text-[11px] text-blue-700">
                {availableUnscheduledTeams.length} unscheduled team(s) ready for
                evaluation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW SCORE MODAL */}
      {scoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="text-blue-600" size={20} />
                <h3 className="font-bold text-base text-slate-900">
                  {modalTeamName} Evaluation
                </h3>
              </div>
              <button
                onClick={() => setScoreModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            {loadingScore ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <Loader2 className="animate-spin text-blue-600" size={24} />
                <p className="text-xs font-semibold text-slate-500">
                  Fetching team evaluations...
                </p>
              </div>
            ) : !selectedEvalScore ? (
              <div className="text-center py-8 text-slate-400 text-xs font-bold">
                No evaluation submissions recorded for this team yet.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Meta details */}
                <div className="flex items-center justify-between text-xs font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400">Judge: </span>
                    <span className="font-bold text-slate-800">
                      {selectedEvalScore.judge?.fullName || "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Status: </span>
                    <span className="font-extrabold text-blue-600 uppercase text-[10px]">
                      {selectedEvalScore.status}
                    </span>
                  </div>
                </div>

                {/* Criteria breakdown */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedEvalScore.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-xs p-3 bg-slate-50/50 border border-slate-100 rounded-xl"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          {item.criteria?.title || "Criteria Item"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Weight: {item.criteria?.weight || 0}%
                        </div>
                      </div>
                      <div className="font-extrabold text-slate-900">
                        {item.score}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">
                          / {item.criteria?.maxScore || 100}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total weighted score */}
                <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs">
                  <span className="font-bold text-blue-950">
                    Aggregated Weighted Score:
                  </span>
                  <span className="text-base font-black text-blue-600">
                    {calculateTotalScore(selectedEvalScore.items).toFixed(1)} /
                    100
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
