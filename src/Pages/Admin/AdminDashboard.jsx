import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Building2,
  Users,
  ClipboardCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  Award,
  Loader2,
} from "lucide-react";
import api from "../../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalTracks: 0,
    totalLabs: 0,
    assignedJudges: 0,
    totalTeams: 0,
    totalStudents: 0,
    evaluationsSubmitted: 0,
  });

  const [trackProgress, setTrackProgress] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch using api.get
        const [tracksRes, labsRes, teamsRes, evalsRes] = await Promise.all([
          api.get("/tracks"),
          api.get("/labs"),
          api.get("/teams"),
          // api.get("/evaluations"),
        ]);

        const tracks = tracksRes.data?.data || tracksRes.data || [];
        const labs = labsRes.data?.data || labsRes.data || [];
        const teams = teamsRes.data?.data || teamsRes.data || [];
        // const evaluations = evalsRes.data?.data || evalsRes.data || [];

        // Compute metrics
        const assignedLabsCount = labs.filter(
          (lab) => lab.judgeId || lab.judge || lab.judges?.length > 0,
        ).length;

        const totalStudentsCount = teams.reduce((acc, team) => {
          return acc + (team.students?.length || team._count?.students || 0);
        }, 0);

        // const submittedEvalsCount = evaluations.filter(
        //   (e) => e.status === "SUBMITTED" || e.isSubmitted,
        // ).length;

        setStats({
          totalTracks: tracks.length,
          totalLabs: labs.length,
          assignedJudges: assignedLabsCount,
          totalTeams: teams.length,
          totalStudents: totalStudentsCount,
          // evaluationsSubmitted: submittedEvalsCount,
        });

        // Compute progress per track
        // const trackBreakdown = tracks.map((track) => {
        //   const trackTeams = teams.filter(
        //     (t) => t.trackId === track.id || t.track?.id === track.id,
        //   );
        //   const completedForTrack = trackTeams.filter((team) =>
        //     evaluations.some(
        //       (e) =>
        //         (e.teamId === team.id || e.team?.id === team.id) &&
        //         (e.status === "SUBMITTED" || e.isSubmitted),
        //     ),
        //   ).length;

        //   return {
        //     id: track.id,
        //     name: track.name,
        //     completedEvals: completedForTrack,
        //     totalEvals: trackTeams.length,
        //   };
        // });

        // setTrackProgress(trackBreakdown);

        // Format recent activity stream
        // const activities = evaluations.slice(0, 5).map((evalItem) => ({
        //   id: evalItem.id,
        //   teamName: evalItem.team?.name || "Unassigned Team",
        //   projectName: evalItem.team?.projectName || "N/A",
        //   judgeName:
        //     evalItem.judge?.name || evalItem.judge?.user?.name || "Judge",
        //   labCode: evalItem.lab?.code || evalItem.lab?.name || "LAB",
        //   status:
        //     evalItem.status || (evalItem.isSubmitted ? "SUBMITTED" : "DRAFT"),
        //   score: evalItem.totalScore ?? evalItem.score ?? null,
        //   time: evalItem.updatedAt
        //     ? new Date(evalItem.updatedAt).toLocaleTimeString([], {
        //         hour: "2-digit",
        //         minute: "2-digit",
        //       })
        //     : "Recently",
        // }));

        // setRecentActivities(activities);
      } catch (err) {
        console.error("Failed to load dashboard telemetry:", err);
        setError("Failed to sync with API backend. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const overallCompletionPercentage =
    stats.totalTeams > 0
      ? Math.round((stats.evaluationsSubmitted / stats.totalTeams) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-500">
          Syncing API telemetry...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertCircle size={20} className="shrink-0" />
          <span className="text-sm font-bold">{error}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-black tracking-tight">
            Admin Overview
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Real-time track progress, lab readiness, and judge evaluation
            telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate("/admin/evaluations")}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Award size={16} />
            <span>View Live Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Primary Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tracks */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tracks
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Layers size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-black">
              {stats.totalTracks}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Active Competition Tracks
            </p>
          </div>
        </div>

        {/* Labs & Judge Readiness */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Labs & Judges
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-black">
                {stats.assignedJudges}
              </span>
              <span className="text-sm font-bold text-slate-400">
                / {stats.totalLabs} Labs
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {stats.assignedJudges === stats.totalLabs &&
              stats.totalLabs > 0 ? (
                <span className="text-emerald-600 font-bold">
                  100% Labs Assigned
                </span>
              ) : (
                <span className="text-amber-600 font-bold">
                  {stats.totalLabs - stats.assignedJudges} Labs Unassigned
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Registered Teams & Students */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Directory
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-black">
              {stats.totalTeams} Teams
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {stats.totalStudents} Enrolled Students
            </p>
          </div>
        </div>

        {/* Global Progress */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Evaluations
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-black">
              {overallCompletionPercentage}%
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {stats.evaluationsSubmitted} of {stats.totalTeams} Teams Locked
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Track Progress Breakdown */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-black">
                Track Progress Breakdown
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Evaluation completion rates per track
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/tracks")}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>Manage Tracks</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {trackProgress.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 py-4 text-center">
                No active tracks configured.
              </p>
            ) : (
              trackProgress.map((track) => {
                const percentage =
                  track.totalEvals > 0
                    ? Math.round(
                        (track.completedEvals / track.totalEvals) * 100,
                      )
                    : 0;
                return (
                  <div
                    key={track.id}
                    className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100"
                  >
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-900">{track.name}</span>
                      <span className="text-slate-600">
                        {track.completedEvals}/{track.totalEvals} Teams (
                        {percentage}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* System Readiness Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-black border-b border-slate-100 pb-3">
              System Readiness
            </h2>

            <div className="space-y-3 mt-4">
              <div className="flex items-center space-x-3 text-xs font-semibold">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span className="text-slate-800">
                  {stats.totalTracks} Tracks Active
                </span>
              </div>

              <div className="flex items-center space-x-3 text-xs font-semibold">
                {stats.assignedJudges === stats.totalLabs &&
                stats.totalLabs > 0 ? (
                  <CheckCircle2
                    size={18}
                    className="text-emerald-600 shrink-0"
                  />
                ) : (
                  <AlertCircle size={18} className="text-amber-500 shrink-0" />
                )}
                <span className="text-slate-800">
                  {stats.totalLabs - stats.assignedJudges} Physical Labs Require
                  Judge Assignment
                </span>
              </div>

              <div className="flex items-center space-x-3 text-xs font-semibold">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span className="text-slate-800">
                  Database & API Backend Connected
                </span>
              </div>
            </div>
          </div>

          {/* Quick Nav Shortcuts */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <button
              onClick={() => navigate("/admin/labs")}
              className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex justify-between items-center"
            >
              <span>Assign Judges to Labs</span>
              <ArrowUpRight size={14} />
            </button>

            <button
              onClick={() => navigate("/admin/teams")}
              className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex justify-between items-center"
            >
              <span>Manage Teams Directory</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Live Evaluation Activity Stream */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-black">
              Live Evaluation Stream
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Recent scoring actions submitted by active judges
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/evaluations")}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View All Evaluations</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivities.length === 0 ? (
            <p className="text-xs font-medium text-slate-400 py-4 text-center">
              No recent evaluation activity recorded yet.
            </p>
          ) : (
            recentActivities.map((act) => (
              <div
                key={act.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-xl mt-0.5 ${
                      act.status === "SUBMITTED"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {act.status === "SUBMITTED" ? (
                      <ClipboardCheck size={18} />
                    ) : (
                      <Clock size={18} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-black">
                        {act.teamName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({act.projectName})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Evaluated by{" "}
                      <strong className="text-slate-800">
                        {act.judgeName}
                      </strong>{" "}
                      in{" "}
                      <strong className="text-slate-800 font-mono">
                        {act.labCode}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  {act.score !== null ? (
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      Score: {act.score} pts
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                      In Progress
                    </span>
                  )}

                  <span className="text-xs text-slate-400 font-medium">
                    {act.time}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
