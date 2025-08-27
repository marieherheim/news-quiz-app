import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "node:fs/promises";
import path from "node:path";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function loadArticles() {
  try {
    const articlesDir = path.join(process.cwd(), "src/data/articles");
    const files = await fs.readdir(articlesDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    const articles = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(articlesDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        return JSON.parse(content);
      })
    );

    return articles;
  } catch (error) {
    console.error("Error loading articles:", error);
    throw new Error("Failed to load articles");
  }
}

export async function POST() {
  try {
    // Load articles directly from file system
    const articles = await loadArticles();

    if (!articles || articles.length === 0) {
      return NextResponse.json({ error: "No articles found" }, { status: 404 });
    }

    const prompt = `
    Create exactly 5 quiz questions based on these news articles. Mix both multiple-choice and true/false questions.
    Make the questions challenging but fair, focusing on key facts and details from the articles.

    Important: All questions and answers must be written in Norwegian.

    Return your response in this exact JSON format:
    {
      "questions": [
        {
          "question": "Ifølge den nylige meningsmålingen, hvilket parti opplever betydelig vekst i Trøndelag?",
          "type": "multipleChoice",
          "options": ["Arbeiderpartiet", "Høyre", "FrP", "SV"],
          "answer": "Arbeiderpartiet"
        },
        {
          "question": "Åge Aleksandersen uttrykte følelser av maktesløshet angående situasjonen i Gaza. Sant eller usant?",
          "type": "trueOrFalse",
          "options": ["Sant", "Usant"],
          "answer": "Sant"
        }
      ]
    }

    Important rules:
    - For multiple-choice questions, always provide exactly 4 options
    - For true/false questions, always use exactly ["Sant", "Usant"] as options
    - Make sure the "answer" field matches exactly one of the options
    - Base all questions on factual information from the provided articles, disregard any external knowledge
    - Do not fabricate any information; if unsure, skip that question
    - Ensure the JSON is valid and parsable
    - Use proper Norwegian language and grammar
    - Keep questions clear and unambiguous

    Articles to base questions on:
    ${JSON.stringify(articles, null, 2)}
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        // System prompt to set behavior
        {
          role: "system",
          content:
            "You are a quiz generator that creates engaging news quiz questions. Always respond with valid JSON in the specified format.",
        },
        // The actual request
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7, // tradeoff between consistent/focused output and creative/varied/not repetitive
      max_tokens: 1500, // prevent runaway costs and ensure efficient responses
    });

    const quizContent = response.choices[0].message?.content;

    if (!quizContent) {
      throw new Error("No content received from OpenAI");
    }

    let quiz;
    try {
      quiz = JSON.parse(quizContent);
    } catch {
      console.error("Failed to parse OpenAI response:", quizContent);
      throw new Error("Invalid JSON response from OpenAI");
    }

    // Validate the quiz structure
    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      throw new Error("Invalid quiz format: missing questions array");
    }

    // Validate each question
    for (const question of quiz.questions) {
      if (
        !question.question ||
        !question.type ||
        !question.options ||
        !question.answer
      ) {
        throw new Error("Invalid question format: missing required fields");
      }

      if (!["multipleChoice", "trueOrFalse"].includes(question.type)) {
        throw new Error("Invalid question type");
      }

      if (!question.options.includes(question.answer)) {
        throw new Error("Answer not found in options");
      }
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Quiz generation error:", error);

    return NextResponse.json(
      {
        error: "Could not generate quiz",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
