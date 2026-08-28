import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../services/api";

export default function MasterEvaluationsPage() {
  const [tracks, setTracks] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. Fetch tracks list
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await api.get("/track");
        const data = res.data?.data || res.data || [];
        setTracks(data);
      } catch (err) {
        console.error("Failed to fetch tracks:", err);
      }
    };
    fetchTracks();
  }, []);

  // 2. Fetch aggregate evaluations using /evaluations/track/:trackId
  const fetchTrackEvaluations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tracks list first if needed to fetch per track
      const tracksRes = await api.get("/track");
      const availableTracks = tracksRes.data?.data || tracksRes.data || [];
      setTracks(availableTracks);

      let aggregatedEvaluations = [];

      // Query the optimized track endpoint for each track
      for (const track of availableTracks) {
        try {
          const evalRes = await api.get(`/evaluations/track/${track.id}`);
          const trackEvalsData = evalRes.data?.data || [];
          console.log(trackEvalsData);

          const processedEvals = trackEvalsData.map((item) => {
            const team = item.team || {};
            console.log("item: ", item);

            const projectEval = item.projectEvaluation;

            // Compute weighted score using return criteria items from API
            let weightedScore = 0;
            if (
              projectEval &&
              Array.isArray(projectEval.items) &&
              projectEval.items.length > 0
            ) {
              weightedScore = projectEval.items.reduce((acc, evalItem) => {
                const weight = evalItem.criteria?.weight || 0;
                const maxScore = evalItem.criteria?.maxScore || 100;
                const itemScore = evalItem.score || 0;
                return acc + (itemScore / maxScore) * weight;
              }, 0);
            }

            return {
              id: projectEval?.id || `temp-${team.id || item.sEvalId}`,
              teamId: team.id,
              teamName: team.name || "Unassigned Team",
              projectName: team.projectName || "No Project Title",
              trackId: track.id,
              trackName: track.name,
              judgeName: projectEval?.judge?.fullName || "Not Assigned",
              labCode: item.lab?.code || "N/A",
              weightedScore: weightedScore,
              status:
                projectEval?.status || (item.evaluated ? "SUBMITTED" : "DRAFT"),
              updatedAt: projectEval?.submittedAt
                ? new Date(projectEval.submittedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Pending",
            };
          });

          aggregatedEvaluations = [...aggregatedEvaluations, ...processedEvals];
        } catch (trackErr) {
          console.error(
            `Failed to fetch evaluations for track ${track.name}:`,
            trackErr,
          );
        }
      }

      setEvaluations(aggregatedEvaluations);
    } catch (err) {
      setError(err.message || "Failed to load scheduled evaluations data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchTrackEvaluations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch tracks list first if needed to fetch per track
        const tracksRes = await api.get("/track");
        const availableTracks = tracksRes.data?.data || tracksRes.data || [];
        setTracks(availableTracks);

        let aggregatedEvaluations = [];

        // Query the optimized track endpoint for each track
        for (const track of availableTracks) {
          try {
            const evalRes = await api.get(`/evaluations/track/${track.id}`);
            const trackEvalsData = evalRes.data?.data || [];

            const processedEvals = trackEvalsData.map((item) => {
              console.log("item: ", item);

              const team = item.team || {};
              const projectEval = item.projectEvaluation;

              // Compute weighted score using return criteria items from API
              let weightedScore = 0;
              if (
                projectEval &&
                Array.isArray(projectEval.items) &&
                projectEval.items.length > 0
              ) {
                weightedScore = projectEval.items.reduce((acc, evalItem) => {
                  const weight = evalItem.criteria?.weight || 0;
                  const maxScore = evalItem.criteria?.maxScore || 100;
                  const itemScore = evalItem.score || 0;
                  return acc + (itemScore / maxScore) * weight;
                }, 0);
              }

              return {
                id: projectEval?.id || `temp-${team.id || item.sEvalId}`,
                teamId: team.id,
                teamName: team.name || "Unassigned Team",
                projectName: team.projectName || "No Project Title",
                trackId: track.id,
                trackName: track.name,
                judgeName: item?.lab?.judge?.username || "Not Assigned",
                labCode: item.lab?.code || "N/A",
                weightedScore: weightedScore,
                status:
                  projectEval?.status ||
                  (item.evaluated ? "SUBMITTED" : "DRAFT"),
                updatedAt: projectEval?.submittedAt
                  ? new Date(projectEval.submittedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Pending",
              };
            });

            aggregatedEvaluations = [
              ...aggregatedEvaluations,
              ...processedEvals,
            ];
          } catch (trackErr) {
            console.error(
              `Failed to fetch evaluations for track ${track.name}:`,
              trackErr,
            );
          }
        }

        setEvaluations(aggregatedEvaluations);
      } catch (err) {
        setError(err.message || "Failed to load scheduled evaluations data.");
      } finally {
        setLoading(false);
      }
    };
    fetchTrackEvaluations();
  }, [fetchTrackEvaluations]);

  // Reset pagination on filter change

  // Filter Logic
  const filteredEvaluations = evaluations.filter((e) => {
    const matchesSearch =
      e.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.judgeName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTrack = selectedTrack === "ALL" || e.trackId === selectedTrack;

    return matchesSearch && matchesTrack;
  });

  // Sort descending by score for leaderboards
  const sortedLeaderboard = [...filteredEvaluations].sort(
    (a, b) => b.weightedScore - a.weightedScore,
  );

  // Pagination Logic
  const totalPages = Math.ceil(sortedLeaderboard.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeaderboard = sortedLeaderboard.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-white min-h-screen text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight">
            Master Leaderboard & Evaluations
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Real-time scheduled track scores, submission locks, and
            leaderboards.
          </p>
        </div>
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
            placeholder="Search team, project, or judge name..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>

        <select
          value={selectedTrack}
          onChange={(e) => setSelectedTrack(e.target.value)}
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

      {/* State Feedback */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400 space-x-2">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-xs font-bold">
            Fetching track schedules & aggregating scores...
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">
          {error}
        </div>
      )}

      {/* Leaderboard Table */}
      {!loading && !error && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 w-12 text-center">Rank</th>
                <th className="p-4">Team & Project</th>
                <th className="p-4">Track</th>
                <th className="p-4">Assigned Judge</th>
                <th className="p-4">Weighted Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {paginatedLeaderboard.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-400 text-xs font-bold"
                  >
                    No scheduled evaluations found for this track filter.
                  </td>
                </tr>
              ) : (
                paginatedLeaderboard.map((item, index) => {
                  console.log(item);

                  const absoluteRank = startIndex + index + 1;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                            absoluteRank === 1
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : absoluteRank === 2
                                ? "bg-slate-200 text-slate-800"
                                : absoluteRank === 3
                                  ? "bg-orange-100 text-orange-800"
                                  : "text-slate-500"
                          }`}
                        >
                          {absoluteRank}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-extrabold text-slate-900">
                            {item.teamName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {item.projectName}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[11px] font-bold">
                          {item.trackName}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">
                        {item.judgeName}{" "}
                        <span className="text-slate-400 font-mono text-[10px]">
                          ({item.labCode})
                        </span>
                      </td>
                      <td className="p-4 font-black text-sm text-blue-600">
                        {item.weightedScore.toFixed(1)}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">
                          / 100
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {sortedLeaderboard.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-500">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, sortedLeaderboard.length)}{" "}
                of {sortedLeaderboard.length} entries
              </span>

              <div className="flex items-center space-x-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="text-xs font-bold text-slate-800 px-2">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
