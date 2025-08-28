"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import clsx from "clsx";
import Image from "next/image";
import Button from "./components/Button";
import Card from "./components/Card";
import HelpIcon from "./components/HelpIcon";

interface Quiz {
  questions: Question[];
}

interface Question {
  question: string;
  type: "multipleChoice" | "trueOrFalse";
  options: string[];
  answer: string;
}

const CONSTANTS = {
  BASE_POINTS: 10,
  BONUS_POINTS: 5,
  ANIMATION_STEP_DIVISOR: 20,
  ANIMATION_INTERVAL: 30,
} as const;

export default function Home() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = useMemo(() =>
    quiz?.questions[currentIndex] || null,
    [quiz, currentIndex]
  );

  const progressPercentage = useMemo(() =>
    quiz ? ((currentIndex + (showResult ? 1 : 0)) / quiz.questions.length) * 100 : 0,
    [currentIndex, showResult, quiz]
  );

  const isQuizComplete = useMemo(() => 
    quiz && currentIndex + 1 >= quiz.questions.length,
    [quiz, currentIndex]
  );

  // Hjelpefunksjon for å resette state variables, slik at ikke score o.l. henger igjen fra forrige quiz
  // resetter ikke setBestStreak fordi jeg ønsker å la brukeren beholde beste streak
  const resetQuizState = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnimatedScore(0);
    setStreak(0);
    setShowResult(false);
    setCorrectAnswers(0);
    setAnswerChecked(false);
  }, []);

  const fetchQuiz = useCallback(async () => {
    console.log("[Quiz] Starting to fetch quiz...");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      console.log("[Quiz] Response received:", res);

      if (!res.ok) {
        throw new Error(`Kunne ikke laste quiz: ${res.status} ${res.statusText}`);
      }

      // read the body stream and convert it from bytes to a string and parse to JS object
      const data = await res.json();
      console.log("[Quiz] Parsed JSON data:", data);

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Ugyldig quiz-data mottatt");
      }

      setQuiz(data);
      resetQuizState();
    } catch (error) {
      console.error("Quiz fetch error:", error);
      const errorMessage = error instanceof Error ? error.message : "Kunne ikke generere quiz";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [resetQuizState]);


  // Effekt for å animere poengsummen
  // Denne hooken gjør at poengsummen animeres jevnt opp til den nye verdien i stedet for å endre seg plutselig
  useEffect(() => {
    // hvis ny score er lik den gamle så trenger vi ikke gjøre noe
    if (score === animatedScore) return;

    let current = animatedScore;
    // Ved å dele differansen mellom ny og gammel score på ANIMATION_STEP_DIVISOR så får man et mindre "hopp" i animeringen for hvert intervall
    // Math.ceil sørger for at vi alltid øker minst 1
    const step = Math.ceil((score - current) / CONSTANTS.ANIMATION_STEP_DIVISOR);

     // setInterval som kjører hvert 30 millisekund for å oppdatere animatedScore (gjør at UI oppdateres gradvis)
    const interval = setInterval(() => {
      current += step;
      // Hvis man har nådd eller passert målet (score), så stopper intervallet og vi setter animatedScore til eksakt score
      if ((step > 0 && current >= score) || (step < 0 && current <= score)) {
        current = score;
        clearInterval(interval);
      }
      setAnimatedScore(current);
    }, CONSTANTS.ANIMATION_INTERVAL);

    // clean up - vil hindre at gamle intervaller fortsetter å kjøre og lager “memory leaks
    return () => clearInterval(interval);
  }, [score, animatedScore]);


const handleCheck = useCallback(() => {
  if (!currentQuestion || selectedAnswer === null) return;

  const isCorrect = selectedAnswer === currentQuestion.answer;

  if (isCorrect) {
    // oppdater streak først
    const newStreak = streak + 1;
    setStreak(newStreak);

    let pointsToAdd = CONSTANTS.BASE_POINTS;

    // Bonuspoeng basert på streak (ikke første spørsmål)
    if (newStreak > 1) {
      pointsToAdd += CONSTANTS.BONUS_POINTS;
    }

     // basepoeng + bonus for streak
    setScore(prev => prev + pointsToAdd);
    // oppdater beste streak
    setBestStreak(prev => Math.max(prev, newStreak));
    setCorrectAnswers(prev => prev + 1)

  } else {
    // feil svar reseter streaken
    setStreak(0);
  }
  // låser valget slik at brukeren ikke kan endre svaret etter å ha sjekket det
  // brukes også til å vise farger (riktig/galt)
  setAnswerChecked(true);
}, [currentQuestion, selectedAnswer, streak]);

  const handleNext = useCallback(() => {
    if (!quiz) return;

    if (isQuizComplete) {
      setShowResult(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswerChecked(false);
    }
  }, [quiz, isQuizComplete]);

  const resetQuiz = useCallback(() => {
    setQuiz(null);
    setError(null);
    resetQuizState();
  }, [resetQuizState]);

  const handleAnswerSelect = useCallback((answer: string) => {
    if (!answerChecked) {
      setSelectedAnswer(answer);
    }
  }, [answerChecked]);

  const QuizRules = () => (
    <div>
      <p className="font-semibold mb-1">Slik fungerer det:</p>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>Denne quizzen består av {quiz?.questions.length} spørsmål</li>
        <li>Du får {CONSTANTS.BASE_POINTS} poeng per riktig svar</li>
        <li>Du får {CONSTANTS.BONUS_POINTS} bonuspoeng per svar i streaken</li>
        <li>Samle så mange poeng som mulig ved å holde streaken gående</li>
      </ul>
    </div>
  );



  if (error) {
    return (
      <main className="min-h-screen bg-[#f4f4f4] flex flex-col items-center py-8">
        <h1 className="text-3xl font-bold text-brand mb-6">Nyhetsquiz</h1>
        <Card className="max-w-xl">
          <div className="text-center space-y-4">
            <p className="text-red-600 font-semibold">Feil oppsto:</p>
            <p className="text-gray-700">{error}</p>
            <Button onClick={fetchQuiz}>Prøv igjen</Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f4f4] flex flex-col items-center py-8 px-4">
      <h1 className="text-3xl font-bold text-brand mb-6">Nyhetsquiz</h1>

      <div className="relative w-full max-w-xl mx-auto mt-2 flex justify-end">
        <HelpIcon text={<QuizRules />} className="mb-4"/>
      </div>

      {!quiz ? (
        <div className="text-center space-y-4 max-w-xl">
          <Image
            src="/images/quiz.webp"
            alt="Quiz illustration"
            width={800}
            height={600}
          />
          {isLoading ? (
            <div className="flex justify-center">
              <div
                className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"
                aria-label="Laster quiz..."
              />
            </div>
          ) : (
            <Button onClick={fetchQuiz}>Start quiz</Button>
          )}
        </div>
      ) : (
        <div className="space-y-6 max-w-xl w-full">
          <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-[#6FB628] transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Fremgang: ${Math.round(progressPercentage)}%`}
            />
          </div>

          <div className="flex justify-between items-center font-semibold text-lg">
            <span className="text-brand-hover">Poeng: {animatedScore}</span>
            <span>
              Streak: {streak} {streak > 0 && "🔥"}
            </span>
          </div>

          {!showResult ? (
            <Card>
              <div className="space-y-4">
                <p className="font-semibold text-lg text-gray-800">
                  {currentIndex + 1}. {currentQuestion?.question}
                </p>

                <div className="space-y-2">
                  {currentQuestion?.options.map((option, index) => {
                    const isCorrect = option === currentQuestion.answer;
                    const isSelected = selectedAnswer === option;
                    const showColors = answerChecked;

                    const answerClasses = clsx(
                      "block w-full text-left cursor-pointer p-3 rounded-lg border border-gray-300 transition-all duration-200",
                      {
                        "bg-brand text-white border-brand": !showColors && isSelected,
                        "bg-[#6FB628] text-white border-[#6FB628]": showColors && isCorrect,
                        "bg-[#8C8C8C] text-white border-[#8C8C8C]": showColors && isSelected && !isCorrect,
                        "hover:border-gray-400": !showColors && !isSelected,
                      }
                    );

                    return (
                      <button
                        key={index}
                        type="button"
                        className={answerClasses}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={answerChecked}
                        aria-pressed={isSelected}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4">
                  {!answerChecked ? (
                    <Button
                      onClick={handleCheck}
                      disabled={selectedAnswer === null}
                      className="w-full"
                    >
                      Sjekk svar
                    </Button>
                  ) : (
                    <Button onClick={handleNext} className="w-full">
                      {isQuizComplete ? "Se resultat" : "Neste spørsmål"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card center className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Resultat: </h2>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{animatedScore} poeng</p>
                <p className="text-lg font-semibold mt-4">
                  Beste streak: {bestStreak} {bestStreak > 0 && "🔥"}
                </p>
                <p className="text-brand mt-4">
                  {correctAnswers === quiz.questions.length
                    ? "Perfekt! Du fikk alle riktig! 🎉"
                    : `Du fikk ${correctAnswers} av ${quiz.questions.length} riktig. Prøv en gang til! 🎯`
                  }
                </p>
              </div>
              <Button onClick={resetQuiz} className="mt-2">
                Prøv igjen!
              </Button>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}