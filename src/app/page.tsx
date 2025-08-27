"use client";

import { useState, useEffect, useCallback } from "react";

type Quiz = {
  questions: Question[];
};

type Question = {
  question: string;
  type: "multipleChoice" | "trueOrFalse";
  options: string[];
  answer: string;
};

type QuestionResult = {
  correct: boolean;
  points: number;
};

export default function Home() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [animatedScore, setAnimatedScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const INITIAL_TIME = 60;
  const isLocked = submitted || timeLeft <= 0;

  const calculateScore = useCallback(() => {
    if (!quiz) return;
    const basePoints = 10;
    const timeBonus = Math.max(0, Math.floor((timeLeft / INITIAL_TIME) * 5));

    let totalPoints = 0;
    const questionResults = quiz.questions.map((q, i) => {
      if (answers[i] === q.answer) {
        const pts = basePoints + timeBonus;
        totalPoints += pts;
        return { correct: true, points: pts };
      }
      return { correct: false, points: 0 };
    });

    setResults(questionResults);
    setScore(totalPoints);
  }, [quiz, timeLeft, answers]);

  const maxScore = quiz ? quiz.questions.length * 15 : 0; // 10 base + 5 bonus per question

  // Timer
  useEffect(() => {
    if (!quiz || isLocked) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (!submitted) {
            calculateScore();
            setSubmitted(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz, isLocked, submitted, calculateScore]);

  async function fetchQuiz() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQuiz(data);
      setScore(null);
      setResults([]);
      setAnswers({});
      setSubmitted(false);
      setTimeLeft(INITIAL_TIME);
      setAnimatedScore(0);
    } catch (error) {
      console.error(error);
      alert("Kunne ikke generere quiz");
    } finally {
      setIsLoading(false);
    }
  }

  // Animate score
  useEffect(() => {
    if (score === null) return;
    let current = 0;
    const step = Math.ceil(score / 40);
    const interval = setInterval(() => {
      current += step;
      if (current >= score) {
        current = score;
        clearInterval(interval);
      }
      setAnimatedScore(current);
    }, 30);
    return () => clearInterval(interval);
  }, [score]);

  function selectAnswer(qIndex: number, option: string) {
    if (isLocked) return;
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quiz || isLocked) return;
    calculateScore();
    setSubmitted(true);
  }

  function resetQuiz() {
    setQuiz(null);
    setAnswers({});
    setResults([]);
    setScore(null);
    setSubmitted(false);
    setTimeLeft(INITIAL_TIME);
    setAnimatedScore(0);
  }

  function getMedal(score: number) {
    if (score >= 100) return "🥇 Gull";
    if (score >= 70) return "🥈 Sølv";
    if (score >= 40) return "🥉 Bronse";
    return "😅 Prøv igjen!";
  }

  return (
    <main className="min-h-screen bg-[#f4f4f4] flex flex-col items-center py-8">
      <h1 className="text-3xl font-bold text-[#005379] mb-6">Nyhetsquiz</h1>

      {!quiz ? (
        <div className="text-center space-y-4 max-w-xl">
          <p>10 poeng per riktig svar + opptil 5 bonuspoeng basert på hvor raskt du svarer.</p>
          <button
            onClick={fetchQuiz}
            disabled={isLoading}
            className="px-6 py-3 bg-[#005379] text-white rounded hover:bg-[#004379] disabled:opacity-50"
          >
            {isLoading ? "Genererer quiz..." : "Generer quiz"}
          </button>
        </div>
      ) : (
        <div className="space-y-6 max-w-xl w-full">
          {!isLocked && <p className={`font-bold text-lg ${timeLeft <= 10 ? "text-red-600" : "text-black"}`}>Tid igjen: {timeLeft} sekunder</p>}

          <form onSubmit={onSubmit} className="space-y-4">
            {quiz.questions.map((q, i) => (
              <div key={i} className="p-4 bg-white rounded-lg shadow-lg border border-gray-200">
                <p className="font-semibold mb-2">{i + 1}. {q.question}</p>
                {q.options.map((opt, j) => (
                  <label key={j} className={`block mb-1 cursor-pointer ${isLocked ? "cursor-not-allowed" : ""}`}>
                    <input
                      type="radio"
                      name={`question-${i}`}
                      value={opt}
                      checked={answers[i] === opt}
                      disabled={isLocked}
                      onChange={() => selectAnswer(i, opt)}
                      className="mr-2"
                    />
                    {opt}
                  </label>
                ))}
                {submitted && (
                  <p className={`mt-2 italic ${results[i]?.correct ? "text-green-600" : "text-red-600"}`}>
                    {results[i]?.correct ? `✔️ Riktig! +${results[i].points} poeng` : `❌ Feil. Riktig svar: ${q.answer}`}
                  </p>
                )}
              </div>
            ))}

            {!submitted && timeLeft > 0 && (
              <button type="submit" className="px-6 py-2 bg-[#005379] text-white rounded hover:bg-[#004379]">
                Send inn svar
              </button>
            )}
          </form>

          {score !== null && (
            <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-200 mt-4 space-y-2">
              <h2 className="text-xl font-bold">Resultat:</h2>
              <p className="text-2xl font-bold">{animatedScore} poeng 🎉</p>
              <p>{getMedal(score)}</p>
              <p>Riktige svar: {quiz.questions.filter((q, i) => answers[i] === q.answer).length} av {quiz.questions.length}</p>

              {/* Progress bar */}
              <div className="mt-2 h-4 w-full bg-gray-300 rounded overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${maxScore ? (animatedScore / maxScore) * 100 : 0}%` }}></div>
              </div>
              <p>{animatedScore} / {maxScore} poeng</p>

              <button onClick={resetQuiz} className="mt-2 px-4 py-2 bg-[#005379] text-white rounded hover:bg-[#004379]">
                Prøv igjen
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
