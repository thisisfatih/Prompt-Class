import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
  // @ts-ignore (extra headers supported by OpenRouter)
  defaultHeaders: {
    ...(process.env.OPENROUTER_SITE_URL
      ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL }
      : {}),
    ...(process.env.OPENROUTER_APP_NAME
      ? { "X-Title": process.env.OPENROUTER_APP_NAME }
      : {}),
  },
});

const MODEL = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

export async function POST(req: Request) {
  try {
    const { topic, count, courseName, courseCreator } = (await req.json()) as {
      topic: string;
      count: number;
      courseName?: string;
      courseCreator?: string;
    };

    if (!topic || !count) {
      return NextResponse.json(
        { error: "Missing topic or count" },
        { status: 400 },
      );
    }
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY" },
        { status: 500 },
      );
    }

    const system = `
You generate study courses as structured data for a database.
You MUST return data ONLY via the provided function (tool) with VALID JSON arguments.
Constraints for each question:
- Use key "questionSentence" (not "question").
- questionType must be one of: TRUE_FALSE | MULTI_SELECT | SHORT_ANSWER.
- For TRUE_FALSE, answer must be "True" or "False" (string).
- For MULTI_SELECT, include "options" (array of 3-6 concise strings) and set "answer" to EXACTLY ONE of those options (string, not array).
- For SHORT_ANSWER, "answer" is a concise string (<= 80 chars).
Use beginner-friendly wording; keep everything concise.
`.trim();

    const user = `Create a course on "${topic}" with exactly ${count} questions.`;

    // Define a single function (tool) that encodes our exact schema
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: "createCourse",
          description:
            "Structured course payload for insertion into the database.",
          parameters: {
            type: "object",
            additionalProperties: false,
            properties: {
              courseName: { type: "string" },
              creator: { type: "string" },
              questions: {
                type: "array",
                minItems: Math.max(1, Math.min(50, count)),
                maxItems: Math.max(1, Math.min(50, count)),
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    questionSentence: { type: "string" },
                    questionType: {
                      type: "string",
                      enum: ["TRUE_FALSE", "MULTI_SELECT", "SHORT_ANSWER"],
                    },
                    options: {
                      type: "array",
                      items: { type: "string" },
                    },
                    answer: { type: "string" }, // ALWAYS a string
                  },
                  required: ["questionSentence", "questionType", "answer"],
                },
              },
            },
            required: ["questions"],
          },
        },
      },
    ];

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
        // Optional gentle nudge if user provided overrides:
        ...(courseName
          ? [
              {
                role: "user" as const,
                content: `Use courseName exactly as: ${courseName}`,
              },
            ]
          : []),
        ...(courseCreator
          ? [
              {
                role: "user" as const,
                content: `Use creator exactly as: ${courseCreator}`,
              },
            ]
          : []),
      ],
      tools,
      tool_choice: { type: "function", function: { name: "createCourse" } }, // FORCE function call
      temperature: 0.3,
    });

    const toolCall = completion.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "createCourse") {
      return NextResponse.json(
        { error: "Model did not return structured function output" },
        { status: 500 },
      );
    }

    const args = JSON.parse(toolCall.function.arguments || "{}") as {
      courseName?: string;
      creator?: string;
      questions: Array<{
        questionSentence: string;
        questionType: "TRUE_FALSE" | "MULTI_SELECT" | "SHORT_ANSWER";
        options?: string[];
        answer: string;
      }>;
    };

    // Final guards (count + shape)
    if (
      !args.questions ||
      !Array.isArray(args.questions) ||
      args.questions.length < 1
    ) {
      return NextResponse.json(
        { error: "No questions produced" },
        { status: 500 },
      );
    }
    const items = args.questions.slice(0, count);

    // Optional strict checks for MULTI_SELECT
    for (const q of items) {
      if (q.questionType === "MULTI_SELECT") {
        if (!q.options || q.options.length === 0) {
          return NextResponse.json(
            { error: "MULTI_SELECT requires options" },
            { status: 500 },
          );
        }
        if (!q.options.includes(q.answer)) {
          return NextResponse.json(
            { error: "MULTI_SELECT answer must be one of options" },
            { status: 500 },
          );
        }
      }
      if (
        q.questionType === "TRUE_FALSE" &&
        !["True", "False"].includes(q.answer)
      ) {
        return NextResponse.json(
          { error: "TRUE_FALSE answer must be 'True' or 'False'" },
          { status: 500 },
        );
      }
    }

    // Apply UI overrides if provided
    const finalName = (
      courseName?.trim() ||
      args.courseName?.trim() ||
      `${topic} — Basics`
    ).slice(0, 200);
    const finalCreator = (
      courseCreator?.trim() ||
      args.creator?.trim() ||
      "AI"
    ).slice(0, 100);

    // Insert: course + v1 + questions; set current=v1
    const result = await prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          courseName: finalName,
          courseCreator: finalCreator,
          createdBy: finalCreator,
          updatedBy: finalCreator,
        },
      });

      const v1 = await tx.courseVersion.create({
        data: { courseId: course.courseId, version: 1 },
      });

      for (const q of items) {
        const createdQ = await tx.question.create({
          data: {
            questionSentence: q.questionSentence,
            answer: q.answer, // always a string now
            options: q.options && q.options.length ? q.options.join(";") : null,
            questionType: q.questionType,
          },
        });

        await tx.courseQuestion.create({
          data: {
            courseId: course.courseId,
            courseVersionId: v1.courseVersionId,
            questionId: createdQ.questionId,
          },
        });
      }

      await tx.course.update({
        where: { courseId: course.courseId },
        data: { currentVersionId: v1.courseVersionId },
      });

      return { courseId: course.courseId, newVersionNumber: 1 };
    });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
