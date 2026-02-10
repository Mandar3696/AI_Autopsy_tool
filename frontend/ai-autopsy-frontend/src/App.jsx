import { useState } from "react";
import { supabase } from "./supabase";
import { useEffect } from "react";



const faqs = [
  {
    question: "How accurate is this AI image detection system?",
    answer:
      "The system provides probabilistic predictions based on patterns learned from real and AI-generated images. Accuracy may vary depending on image quality and unseen generation techniques.",
  },
  {
    question: "Can this tool detect all AI-generated images?",
    answer:
      "No. AI generation methods evolve rapidly. While the model is trained on diverse datasets, it may not detect images created using newer or unseen techniques.",
  },
  {
    question: "What does the heatmap represent?",
    answer:
      "The heatmap highlights regions of the image that most influenced the model’s decision. Brighter areas indicate stronger contribution to the prediction.",
  },
  {
    question: "Is this tool suitable for legal or forensic use?",
    answer:
      "No. This tool is intended strictly for educational and research purposes and should not be used as legal or forensic evidence.",
  },
  {
    question: "Are uploaded images stored on the server?",
    answer:
      "No. Images are processed temporarily for analysis and are not stored or shared.",
  },
  {
    question: "What type of images work best?",
    answer:
      "High-quality, clear images with minimal compression provide the most reliable results. Low-resolution or heavily edited images may reduce accuracy.",
  },
];


export default function App() {
  
 useEffect(() => {
  // Get current session on load
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
  });

  // Listen to auth changes
  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);
    }
  );

  return () => {
    listener.subscription.unsubscribe();
  };
}, []);



  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  
  const [authMode, setAuthMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

    async function handleAuth() {
    setAuthLoading(true);

    try {
      const response =
        authMode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (response.error) {
        if (response.error.message === "Email not confirmed") {
          alert("Please confirm your email before logging in.");
        } else {
          alert(response.error.message);
        }
        return;
      }


      setShowAuth(false);
      setEmail("");
      setPassword("");
    } finally {
      setAuthLoading(false);
    }
  }





  function severityStyle(level) {
    return {
      Low: "bg-green-500/15 text-green-300 border-green-500/30",
      Moderate: "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
      High: "bg-orange-400/15 text-orange-300 border-orange-400/30",
      Extreme: "bg-red-500/15 text-red-300 border-red-500/30",
    }[level];
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  }

  async function analyzeImage() {
    if (!image) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", image);

    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);

      setRecent((prev) => [
        {
          id: Date.now(),
          preview,
          verdict: data.verdict,
          confidence: data.confidence,
        },
        ...prev.slice(0, 4),
      ]);
    } catch {
      alert("Backend not reachable");
    } finally {
      setLoading(false);
    }
  }

  


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#020617] to-black text-white px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-14">

        <div className="flex justify-end mb-4">
  {/* <button
    onClick={() => setShowAuth(true)}
    className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition"
  >
    Login / Sign Up
  </button> */}
</div>


        {/* HEADER */}
        <header className="flex items-center justify-between">
          {/* LEFT */}
          <div>
            <h1 className="text-3xl font-bold">🧠 AI Autopsy Tool</h1>
            <p className="text-gray-400 text-sm">
              Explainable AI system for AI-generated image detection
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            {!session ? (
              <button
                onClick={() => setShowAuth(true)}
                className="px-5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20 transition"
              >
                Login / Sign Up
              </button>
            ) : (
              <>
                <span className="hidden sm:block text-sm text-gray-400">
                  {session.user.email}
                </span>

                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                  }}
                  className="px-5 py-2 rounded-xl bg-red-500/10 border border-red-400/30 text-red-300 hover:bg-red-500/20 transition"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </header>


        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT */}
          <div className="space-y-6">
            <div className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-3">📤 Upload Image</h2>

              <label className="flex flex-col items-center justify-center h-48 border border-dashed border-white/25 rounded-xl cursor-pointer hover:border-cyan-400/70 transition">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                <p className="text-gray-300">Click or drag image here</p>
                <p className="text-xs text-gray-500 mt-2">JPG / PNG</p>
              </label>

              {preview && (
                <>
                  <img src={preview} className="rounded-xl mt-4 max-h-80 mx-auto" />
                  <button
                      onClick={() => {
                        if (!session) {
                          setShowAuth(true);
                          return;
                        }
                        analyzeImage();
                      }}
                      className={`w-full mt-4 py-3 rounded-xl font-semibold transition ${
                        session
                          ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                          : "bg-gray-600 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      {session ? "🔍 Analyze Image" : "🔒 Login to Analyze"}
                    </button>


                </>
              )}

              {!session ? (
                      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                        🔒 Login required to upload images
                      </div>
                    ) : (
                      <>
                        {/* existing upload UI here */}
                      </>
                    )}



            </div>

            {recent.length > 0 && (
              <div className="bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-semibold mb-4">🕘 Recent Analysis</h3>
                <div className="space-y-3">
                  {recent.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 bg-black/40 p-3 rounded-xl">
                      <img src={r.preview} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <p className={r.verdict === "AI Generated" ? "text-red-300" : "text-green-300"}>
                          {r.verdict}
                        </p>
                        <p className="text-xs text-gray-400">{r.confidence}% confidence</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">🧪 Forensic Analysis</h2>

            {!result && !loading && (
              <p className="text-gray-400">Upload an image to start analysis.</p>
            )}

            {loading && <p className="text-cyan-400 animate-pulse">Analyzing…</p>}

            {result && (
              <div className="space-y-5">
                <div className={`text-center py-3 rounded-xl font-bold ${
                  result.verdict === "AI Generated"
                    ? "bg-red-500/15 text-red-300"
                    : "bg-green-500/15 text-green-300"
                }`}>
                  {result.verdict}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Severity</span>
                  <span className={`px-3 py-1 rounded-full border text-xs ${severityStyle(result.severity)}`}>
                    {result.severity}
                  </span>
                </div>

                {/* CLASS PROBABILITIES */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">
                      Class Probabilities
                    </h3>

                    {Object.entries(result.probabilities).map(([label, value]) => (
                      <div key={label} className="mb-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>{label.toUpperCase()}</span>
                          <span>{value}%</span>
                        </div>

                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              label === "AI" ? "bg-red-400" : "bg-green-400"
                            }`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>


                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">
                    {showHeatmap ? "🔥 Heatmap ON" : "🚫 Heatmap OFF"}
                  </span>
                  <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className={`w-12 h-6 rounded-full ${showHeatmap ? "bg-cyan-500" : "bg-zinc-600"}`}
                  >
                    <span className={`block w-5 h-5 bg-black rounded-full transition ${
                      showHeatmap ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                {showHeatmap && result.heatmap && (
                  <img
                    src={`data:image/png;base64,${result.heatmap}`}
                    className="rounded-xl border border-white/10"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* USE CASES */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Use Cases</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              ["📰 Journalism & Media", "Verify image authenticity before publishing."],
              ["⚖️ Legal & Forensics", "Analyze evidence images for manipulation."],
              ["🎓 Education", "Detect AI-generated images in submissions."],
              ["📱 Social Media", "Moderate AI-generated visual content."],
              ["🎨 Content Creators", "Protect original visual work."],
              ["🏷️ Brand Protection", "Detect fake brand imagery."],
            ].map(([title, desc]) => (
              <div key={title} className="bg-white/5 backdrop-blur-xl
                    border border-white/10
                    rounded-xl p-5

                    transition-all duration-300 ease-out
                    hover:-translate-y-1
                    hover:border-cyan-400/50
                    hover:bg-white/10
                    hover:shadow-[0_0_30px_-8px_rgba(34,211,238,0.35)]
                  ">
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-center">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-6  ">
            {[
              ["1️⃣ Upload Image", "User uploads or drags an image."],
              ["2️⃣ AI Analysis", "Model analyzes artifacts and patterns."],
              ["3️⃣ Explainability", "Heatmap highlights decision regions."],
            ].map(([title, desc]) => (
              <div key={title} className="bg-white/5 backdrop-blur-xl
                    border border-white/10
                    rounded-xl p-5

                    transition-all duration-300 ease-out
                    hover:-translate-y-1
                    hover:border-cyan-400/50
                    hover:bg-white/10
                    hover:shadow-[0_0_30px_-8px_rgba(34,211,238,0.35)]
                  ">
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ SECTION */}
          <div className="bg-white/5 backdrop-blur-xl
                border border-white/10
                rounded-xl p-5

                transition-all duration-300 ease-out
                hover:-translate-y-1
                hover:border-cyan-400/50
                hover:bg-white/10
                hover:shadow-[0_0_30px_-8px_rgba(34,211,238,0.35)]
              ">
            <h3 className="text-2xl font-semibold text-center">
               Frequently Asked Questions
               <br />
               
              <text className="text-xs text-gray-500">
                      Find answers to common questions about our AI image detection technology.
               </text>


            </h3>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className="group rounded-xl border border-white/10 bg-black/40 p-4 transition"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-gray-200">
                    {faq.question}
                    <span className="transition-transform group-open:rotate-45 text-lg">
                      +
                    </span>
                  </summary>

                  <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>


        {/* FOOTER */}
            <footer className="mt-20 bg-white/5 backdrop-blur-xl border-t border-white/10">
              <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">

                {/* DESCRIPTION */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    🧠 AI Autopsy Tool
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Advanced AI image detection technology designed to analyze and explain
                    image authenticity using deep learning and forensic visual cues.
                    This tool helps users better understand AI-generated content and
                    maintain trust in digital media.
                  </p>
                </div>

                {/* NAVIGATION */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
                    Navigation
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="hover:text-cyan-400 cursor-pointer transition">
                      Use Cases
                    </li>
                    <li className="hover:text-cyan-400 cursor-pointer transition">
                      How It Works
                    </li>
                    <li className="hover:text-cyan-400 cursor-pointer transition">
                      FAQ
                    </li>
                    <li className="hover:text-cyan-400 cursor-pointer transition">
                      Blog (Future Scope)
                    </li>
                  </ul>
                </div>

                {/* INFORMATION */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
                    Information
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="hover:text-cyan-400 cursor-pointer transition">
                      Disclaimer
                    </li>
                    <text className="text-xs text-gray-500">
                      The AI Autopsy Tool is an experimental and research-oriented system designed to analyze images and provide probabilistic insights into whether an image may be AI-generated or real. The results produced by this tool are based on machine learning models and statistical patterns and do not guarantee absolute accuracy.
                    </text>
                      
                  </ul>
                </div>

              </div>

              {/* BOTTOM BAR */}
              <div className="text-center text-xs text-gray-500 border-t border-white/10 py-4">
                © {new Date().getFullYear()} AI Autopsy Tool — Educational & Research Use Only
              </div>
            </footer>



      </div>

              {session && (
          <button
            onClick={async () => await supabase.auth.signOut()}
            className="fixed bottom-10 right-10 px-4 py-2 bg-red-500 text-black rounded-lg"
          >
            Logout
          </button>
        )}

               

          {showAuth && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="relative w-full max-w-md bg-[#020617] border border-white/10 rounded-2xl p-6 space-y-5">

          <h2 className="text-xl font-semibold text-center">
            {authMode === "login" ? "Login" : "Create Account"}
          </h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
          />

          <button
            onClick={handleAuth}
            disabled={authLoading}
            className="w-full py-3 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition"
          >
            {authLoading
              ? "Please wait..."
              : authMode === "login"
              ? "Login"
              : "Sign Up"}
          </button>

          <p className="text-center text-sm text-gray-400">
            {authMode === "login" ? "No account?" : "Already have an account?"}
            <button
              className="ml-2 text-cyan-400 hover:underline"
              onClick={() =>
                setAuthMode(authMode === "login" ? "signup" : "login")
              }
            >
              {authMode === "login" ? "Sign up" : "Login"}
            </button>
          </p>

          <button
            onClick={() => setShowAuth(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    )}


    </div>
  );
}
