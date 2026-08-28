import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Building2,
  Layers,
  Clock,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  UserCheck,
  MapPin,
  CheckCircle,
} from "lucide-react";

export default function JudgeDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [judgeInfo, setJudgeInfo] = useState(null);
  const [scheduledEvaluations, setScheduledEvaluations] = useState([]);

  useEffect(() => {
    const fetchJudgeData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [meRes, schedulesRes] = await Promise.all([
          api.get("/judge/me"),
          api.get("/judge/me/schedules"),
        ]);

        console.log(schedulesRes.data.data);

        const profileData = meRes.data?.data || meRes.data || {};
        const schedulesData =
          schedulesRes.data?.data || schedulesRes.data || [];

        setJudgeInfo(profileData);
        setScheduledEvaluations(schedulesData);
      } catch (err) {
        console.error("Failed to load judge dashboard data:", err);
        setError(
          "Failed to fetch dashboard records. Please check your network connection.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJudgeData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-black">Loading dashboard...</p>
      </div>
    );
  }

  const totalPending = scheduledEvaluations.filter(
    (item) => item.evaluated !== true,
  ).length;

  const totalCompleted = scheduledEvaluations.filter(
    (item) => item.evaluated === true,
  ).length;

  // Extract single lab assigned from judge profile or first scheduled evaluation
  const assignedLabObj = judgeInfo?.lab || scheduledEvaluations[0]?.lab || null;

  const labName =
    assignedLabObj?.name || assignedLabObj?.code || "Unassigned Lab";
  const labCode = assignedLabObj?.code || null;
  const labLocation =
    assignedLabObj?.location || assignedLabObj?.building || null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 bg-white">
      {/* Header & Judge Profile Card */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-black">
                {judgeInfo.title.toLowerCase()[0].toUpperCase() +
                  judgeInfo.title.toLowerCase().slice(1) +
                  " "}
                {judgeInfo?.name || "Judge Portal"}
              </h1>
              <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200">
                Official Judge
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Tracks */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-black/60 uppercase tracking-wider mr-2 flex items-center space-x-1.5">
            <Layers size={14} className="text-blue-600" />
            <span>Assigned Tracks:</span>
          </span>

          {assignedLabObj.track.id && (
            <span
              key={assignedLabObj.track.id}
              className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-md border border-blue-100"
            >
              {assignedLabObj.track.name}
            </span>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-white border border-black rounded-xl text-black flex items-center justify-between text-xs font-medium">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} className="text-blue-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="font-semibold underline hover:text-blue-600"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stat & Lab Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stat Column 1: Pending */}
        <div className="bg-white rounded-xl border border-black/10 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-black/60">
              Pending
            </span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-4xl font-bold mt-4 text-black">{totalPending}</p>
        </div>

        {/* Stat Column 2: Evaluated */}
        <div className="bg-white rounded-xl border border-black/10 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-black/60">
              Evaluated
            </span>
            <div className="p-2 bg-black text-white rounded-lg">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="text-4xl font-bold mt-4 text-black">{totalCompleted}</p>
        </div>

        {/* Merged Single Card: Assigned Lab & Full Queue Details */}
        <div className="bg-blue-600 rounded-xl p-5 shadow-sm text-white flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-white/20 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-100 flex items-center space-x-1.5">
                <Building2 size={16} />
                <span>Assigned Lab Location</span>
              </span>
              <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Single Allocation
              </span>
            </div>

            <div className="mt-3 space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {labName}
              </h2>
              {labCode && (
                <p className="text-xs font-medium text-blue-100 flex items-center space-x-1">
                  <span>Code:</span>
                  <span className="font-semibold text-white">{labCode}</span>
                </p>
              )}
              {labLocation && (
                <p className="text-xs text-blue-100 flex items-center space-x-1 pt-0.5">
                  <MapPin size={12} className="shrink-0" />
                  <span>{labLocation}</span>
                </p>
              )}
            </div>
          </div>
          {/* 
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ListOrdered size={16} className="text-blue-100" />
              <span className="text-xs font-medium text-blue-100">
                Queue Total:
              </span>
              <span className="text-lg font-bold text-white">
                {scheduledEvaluations.length} Teams
              </span>
            </div>

            <Link
              to="/judge/queue"
              className="inline-flex items-center space-x-1.5 bg-white text-blue-600 hover:bg-black hover:text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
            >
              <span>View Queue</span>
              <ArrowRight size={12} />
            </Link>
          </div> */}
        </div>
      </div>

      {/* Scheduled Evaluations List */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-black">
              Assigned Evaluation Schedule
            </h2>
            <p className="text-xs text-black/60 mt-0.5">
              Select any scheduled evaluation to start scoring the project and
              team members.
            </p>
          </div>

          <span className="self-start sm:self-auto bg-black text-white px-3 py-1 rounded-full text-xs font-semibold">
            {scheduledEvaluations.length} Teams Assigned
          </span>
        </div>

        {scheduledEvaluations.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <UserCheck className="w-10 h-10 text-blue-600 mx-auto" />
            <h3 className="text-base font-semibold text-black">
              No Scheduled Evaluations
            </h3>
            <p className="text-xs text-black/60 max-w-sm mx-auto">
              You currently have no teams assigned to your evaluation queue.
              Please contact the administrator or check back later.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {scheduledEvaluations.map((item, index) => {
              const teamName =
                item.team?.name || `Team ${item.teamId?.slice(0, 6)}`;
              const projectName = item.team?.projectName || "N/A";
              const isCompleted = item.status === "COMPLETED";

              return (
                <div
                  key={item.id || index}
                  onClick={() =>
                    navigate(`/judge/evaluate/${item.id}`, {
                      state: {
                        evaluation: item,
                        trackId: assignedLabObj.trackId,
                      },
                    })
                  }
                  className="py-4 first:pt-0 last:pb-0 cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {/* Queue Order Number */}
                    <div className="w-9 h-9 rounded-lg bg-black text-white font-semibold text-sm flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors">
                      #{item.sequenceNo || index + 1}
                    </div>

                    {/* Team details */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-semibold text-black group-hover:text-blue-600 transition-colors">
                          {teamName}
                        </h3>
                        {isCompleted && (
                          <span className="bg-black text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Evaluated
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-black/60 mt-0.5">
                        Project:{" "}
                        <span className="font-medium text-black">
                          {projectName}
                        </span>
                      </p>
                    </div>
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

                  {/* Metadata & Trigger */}
                  <div className="flex items-center justify-between md:justify-end space-x-6">
                    {item.startTime && (
                      <p className="text-xs text-black/60 font-medium">
                        {item.startTime}
                      </p>
                    )}

                    <button
                      className={`px-4 py-2 rounded-lg font-medium text-xs flex items-center space-x-1.5 transition-colors ${
                        item.evaluated
                          ? "bg-black text-white hover:bg-blue-600"
                          : "bg-blue-600 text-white hover:bg-black shadow-sm"
                      }`}
                    >
                      <span>{item.evaluated ? "Review" : "Start"}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
