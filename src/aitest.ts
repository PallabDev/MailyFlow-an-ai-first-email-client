import OpenAI from "openai";

const client = new OpenAI({
    baseURL: "https://api.aicredits.in/v1",
    apiKey: "sk-live-3aa3b07f4d35558af57dcb0aaea1738909a97ec432afc7c662ea4025c9401f14",
});

const response = await client.chat.completions.create({
    // @ts-expect-error — AICredits extension
    models: ["gpt-4o", "claude-sonnet-4-5", "gemini-1.5-pro"],
    messages: [{ role: "user", content: "Hello! world" }],
});

// Check which model actually responded
console.log(response.choices[0].message.content);
