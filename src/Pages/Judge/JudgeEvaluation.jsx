import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FolderGit2,
  UserCheck,
  Send,
  Award,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";

export default function JudgeEvaluation() {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const evaluation = location.state?.evaluation || {};
  const trackId =
    location.state?.trackId ||
    evaluation?.team?.trackId ||
    evaluation?.team?.track?.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isAlreadyEvaluated, setIsAlreadyEvaluated] = useState(false);

  // Evaluation Data States
  const [projectCriteria, setProjectCriteria] = useState([]);
  const [studentCriteria, setStudentCriteria] = useState([]);
  const [students, setStudents] = useState([]);

  // Form Input States
  const [projectScores, setProjectScores] = useState({});
  const [studentScores, setStudentScores] = useState({});

  const populateScores = (projScoresArr = [], studScoresArr = []) => {
    if (projScoresArr.length > 0 || studScoresArr.length > 0) {
      setIsAlreadyEvaluated(true);
    }
    console.log("studScoresArr", studScoresArr);

    const initialProjectScores = {};
    projScoresArr.forEach((item) => {
      initialProjectScores[item.criteriaId] = item.score;
    });
    setProjectScores(initialProjectScores);

    const initialStudentScores = {};
    for (let i = 0; i < studScoresArr.length; i++) {
      if (!initialStudentScores[studScoresArr[i].studentId]) {
        initialStudentScores[studScoresArr[i].studentId] = {};
      }
      for (let j = 0; j < studScoresArr[i].items.length; j++) {
        initialStudentScores[studScoresArr[i].studentId][
          studScoresArr[i].items[j].criteriaId
        ] = studScoresArr[i].items[j].score;
      }
    }
    console.log(initialStudentScores);

    setStudentScores(initialStudentScores);
  };

  useEffect(() => {
    const fetchEvaluationDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadedStudents = evaluation?.team?.students || [];
        setStudents(loadedStudents);

        if (!trackId) {
          throw new Error("Track ID missing. Cannot load criteria.");
        }

        // 1. Fetch criteria for this track
        const criteriaRes = await api.get(`/track/${trackId}/criteria`);
        const criteriaData = criteriaRes.data?.data || criteriaRes.data || [];

        setProjectCriteria(
          criteriaData.filter((item) => item.type === "PROJECT"),
        );
        setStudentCriteria(
          criteriaData.filter((item) => item.type === "STUDENT"),
        );

        console.log("Evaluation: ", evaluation);

        // 2. Check and pre-fill existing evaluation scores
        if (evaluation?.evaluated) {
          const existingRes = await api.get(`/evaluations/${evaluation.id}`);
          const evalData = existingRes.data?.data || existingRes.data;
          console.log(evalData);
          populateScores(
            evalData.projectEvaluation.items,
            evalData.studentsEvaluation,
          );
        } else if (evaluation?.team?.id) {
          // If state wasn't passed directly, query backend for existing evaluations
          try {
            const existingRes = await api.get(`/evaluations/${evaluation.id}`);
            const evalData = existingRes.data?.data || existingRes.data;
            console.log(evalData);

            if (evalData) {
              const fetchedProjectScores =
                evalData.items || evalData.projectScores || [];
              const fetchedStudentScores = evalData.studentScores || [];
              populateScores(fetchedProjectScores, fetchedStudentScores);
            }
          } catch {
            // No existing evaluation record found for team
          }
        }
      } catch (err) {
        console.error("Failed to load evaluation details:", err);
        setError(
          err.message ||
            "Failed to load evaluation details. Please check your network connection.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluationDetails();
  }, [evaluationId, trackId, evaluation?.team?.id]);

  const handleProjectScoreChange = (criteriaId, score) => {
    setProjectScores((prev) => ({
      ...prev,
      [criteriaId]: score === "" ? "" : Number(score),
    }));
  };

  const handleStudentScoreChange = (studentId, criteriaId, score) => {
    setStudentScores((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [criteriaId]: score === "" ? "" : Number(score),
      },
    }));
  };

  const calculateStudentTotal = (studentId) => {
    const scores = studentScores[studentId] || {};
    return Object.values(scores).reduce(
      (sum, val) => sum + (typeof val === "number" ? val : 0),
      0,
    );
  };

  const maxPossibleStudentScore = studentCriteria.reduce(
    (sum, item) => sum + (item.maxScore || 10),
    0,
  );

  const calculateProjectTotal = () => {
    return Object.values(projectScores).reduce(
      (sum, val) => sum + (typeof val === "number" ? val : 0),
      0,
    );
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const formattedProjectScores = Object.entries(projectScores).map(
        ([criteriaId, score]) => ({
          criteriaId,
          score: score === "" ? 0 : score,
        }),
      );

      const formattedStudentScores = Object.entries(studentScores).flatMap(
        ([studentId, criteriaObj]) =>
          Object.entries(criteriaObj).map(([criteriaId, score]) => ({
            studentId,
            criteriaId,
            score: score === "" ? 0 : score,
          })),
      );

      console.log("Evaluation id: ", evaluation?.id);

      if (formattedProjectScores.length > 0) {
        await api.post(`/evaluations/projects`, {
          teamId: evaluation?.team?.id,
          items: formattedProjectScores,
          sEvalId: evaluation.id,
        });
      }

      if (formattedStudentScores.length > 0) {
        await api.post(`/evaluations/students`, {
          teamId: evaluation?.team?.id,
          evaluations: formattedStudentScores,
          sEvalId: evaluation.id,
        });
      }

      navigate("/judge/dashboard", {
        state: {
          message: isAlreadyEvaluated
            ? "Evaluation updated successfully!"
            : "Evaluation submitted successfully!",
        },
      });
    } catch (err) {
      console.error("Failed to submit evaluation:", err);
      setError(
        err.response?.data?.message ||
          "Failed to submit evaluation scores. Please ensure all criteria are filled out.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-black">
          Loading evaluation criteria...
        </p>
      </div>
    );
  }

  const teamName = evaluation?.team?.name || "Assigned Team";
  const projectName = evaluation?.team?.projectName || "N/A";

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6 bg-white">
      {/* Header Navigation */}
      <div className="flex items-center justify-between border-b border-black/10 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-black hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
          Evaluation Session
        </span>
      </div>

      {/* Already Evaluated Status Banner */}
      {isAlreadyEvaluated && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>
              This team has already been evaluated. Showing existing scores. You
              can modify the values below and save updates.
            </span>
          </div>
        </div>
      )}

      {/* Team Info Banner */}
      <div className="bg-white rounded-xl border border-black/10 shadow-sm p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-black">{teamName}</h1>
            <p className="text-xs text-black/60 mt-1 flex items-center space-x-1.5">
              <FolderGit2 size={14} className="text-blue-600 shrink-0" />
              <span>Project Title:</span>
              <span className="font-semibold text-black">{projectName}</span>
            </p>
          </div>
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

      <form onSubmit={handleSubmitEvaluation} className="space-y-8">
        {/* MATRIX TABLE: Student Evaluation Criteria */}
        {studentCriteria.length > 0 && (
          <div className="bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden">
            <div className="p-4 bg-white border-b border-black/10 flex items-center space-x-2">
              <UserCheck size={20} className="text-blue-600" />
              <h2 className="text-base font-bold text-black">
                Scores — per student, plus your overall judgment of the project
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-black/10 text-[11px] font-bold text-black/70 uppercase tracking-wider">
                    <th className="p-3 border-r border-black/10 w-48">
                      STUDENT
                    </th>
                    {studentCriteria.map((criterion) => (
                      <th
                        key={criterion.id}
                        className="p-3 border-r border-black/10 text-center max-w-[120px]"
                      >
                        <div>{criterion.title}</div>
                        <div className="text-[10px] text-blue-600 lowercase font-normal mt-0.5">
                          / {criterion.maxScore || 10}
                        </div>
                      </th>
                    ))}
                    <th className="p-3 text-center bg-amber-50/50 w-24">
                      <div>TOTAL</div>
                      <div className="text-[10px] text-black/60 font-normal mt-0.5">
                        /{maxPossibleStudentScore || 30}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 text-xs font-medium">
                  {students.map((student, idx) => {
                    const studentTotal = calculateStudentTotal(student.id);

                    return (
                      <tr
                        key={student.id || idx}
                        className="hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="p-3 border-r border-black/10 font-bold text-black">
                          {student.fullName ||
                            student.name ||
                            `Student ${idx + 1}`}
                        </td>

                        {studentCriteria.map((criterion) => {
                          const maxScore = criterion.maxScore || 10;
                          const scoreVal =
                            studentScores[student.id]?.[criterion.id] ?? "";

                          return (
                            <td
                              key={criterion.id}
                              className="p-2 border-r border-black/10 text-center align-middle"
                            >
                              <input
                                type="number"
                                min="0"
                                max={maxScore}
                                required
                                value={scoreVal}
                                onChange={(e) =>
                                  handleStudentScoreChange(
                                    student.id,
                                    criterion.id,
                                    e.target.value,
                                  )
                                }
                                className="w-16 px-2 py-1.5 text-center border border-black/20 rounded-md font-semibold text-black focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                placeholder="0"
                              />
                            </td>
                          );
                        })}

                        <td className="p-3 text-center font-bold text-sm bg-amber-50/50 text-black">
                          {studentTotal}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Optional Project Level Row inside Table */}
                  {projectCriteria.length > 0 && (
                    <tr className="bg-amber-50/30 border-t-2 border-amber-200">
                      <td className="p-3 border-r border-black/10 font-bold italic text-black">
                        Overall (whole project)
                      </td>
                      {studentCriteria.map((criterion) => (
                        <td
                          key={criterion.id}
                          className="p-2 border-r border-black/10 text-center"
                        >
                          <input
                            type="number"
                            disabled
                            className="w-16 px-2 py-1.5 text-center bg-black/5 border border-black/10 rounded-md text-black/40 font-medium cursor-not-allowed"
                            placeholder="—"
                          />
                        </td>
                      ))}
                      <td className="p-3 text-center font-bold text-sm text-black">
                        {calculateProjectTotal()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION: Dedicated Project Evaluation Criteria */}
        {projectCriteria.length > 0 && (
          <div className="bg-white rounded-xl border border-black/10 shadow-sm p-6 space-y-6">
            <div className="border-b border-black/10 pb-3 flex items-center space-x-2">
              <Award size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold text-black">
                Project Level Evaluation Criteria
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {projectCriteria.map((criterion) => {
                const maxScore = criterion.maxScore || 10;
                const currentScore = projectScores[criterion.id] ?? "";

                return (
                  <div
                    key={criterion.id}
                    className="p-4 rounded-lg border border-black/10 bg-white hover:border-blue-600 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-black">
                          {criterion.title}
                        </h3>
                        {criterion.description && (
                          <p className="text-xs text-black/60 mt-0.5">
                            {criterion.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <label className="text-xs font-medium text-black/60">
                          Score (Max {maxScore}):
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={maxScore}
                          required
                          value={currentScore}
                          onChange={(e) =>
                            handleProjectScoreChange(
                              criterion.id,
                              e.target.value,
                            )
                          }
                          className="w-20 px-3 py-1.5 border border-black/20 rounded-md text-sm font-semibold text-black focus:outline-none focus:border-blue-600"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submit Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-black text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-colors text-sm disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {isAlreadyEvaluated
                    ? "Updating Evaluation..."
                    : "Submitting Evaluation..."}
                </span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>
                  {isAlreadyEvaluated
                    ? "Update Final Evaluation"
                    : "Submit Final Evaluation"}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
