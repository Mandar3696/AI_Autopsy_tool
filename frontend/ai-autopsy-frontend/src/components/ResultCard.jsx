export default function ResultCard({ result }) {
  if (!result) {
    return (
      <div className="mt-8 text-center text-gray-500 text-sm">
        Upload an image to begin AI forensic analysis.
      </div>
    );
  }

  const severityStyle = {
    Low: "bg-green-500/20 text-green-400",
    Moderate: "bg-yellow-500/20 text-yellow-300",
    High: "bg-orange-500/20 text-orange-400",
    Extreme: "bg-red-600/20 text-red-400",
  };

  return (
    <div className="mt-10 rounded-2xl bg-black/40 border border-white/10 shadow-2xl p-8 space-y-6">

      {/* Verdict */}
      <div
        className={`text-center py-4 rounded-xl text-2xl font-bold tracking-wide ${
          result.verdict === "AI Generated"
            ? "bg-red-600/20 text-red-400"
            : "bg-green-600/20 text-green-400"
        }`}
      >
        {result.verdict}
      </div>

      {/* Confidence */}
      <div>
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Model Confidence</span>
          <span>{result.confidence}%</span>
        </div>

        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-700"
            style={{ width: `${result.confidence}%` }}
          />
        </div>
      </div>

      {/* Severity */}
      <div className="flex items-center justify-between">
        <span className="text-gray-300">Manipulation Severity</span>
        <span
          className={`px-4 py-1 rounded-full text-sm font-semibold ${severityStyle[result.severity]}`}
        >
          {result.severity}
        </span>
      </div>

      {/* Explainability */}
      <div className="mt-4 p-4 rounded-xl bg-[#020617]/80 border border-white/10 text-sm text-gray-400">
        🔍 <span className="font-semibold text-gray-300">Explainability:</span>{" "}
        This prediction is based on spatial artifacts, texture inconsistencies,
        and frequency-domain patterns commonly found in AI-generated images.
      </div>
    </div>
  );
}
