import { GoogleGenerativeAI } from "@google/generative-ai";
import { addEventToCalendar, sendEmail } from "../../../lib/google";
import { getTextToSpeechAudio } from "../../../lib/elevenlabs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define the persona and instructions for the AI model.
const model = genAI.getGenerativeModel({
  model: "gemini-pro",
  systemInstruction: "You are a helpful and friendly financial assistant. Your goal is to help the user understand their financial plan based on the provided context, schedule meetings, and send email summaries. You can also provide voice responses. Keep your answers concise and helpful.",
});

// Simplified toolset focusing on in-app user interaction.
const tools = [
    {
        functionDeclarations: [
          {
            name: "add_event_to_calendar",
            description: "Adds an event to the user's Google Calendar. Use the current date and time to resolve relative times like 'tomorrow' or 'next week'.",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "The title or summary of the event." },
                startDateTime: { type: "string", description: "The start time of the event in ISO 8601 format (e.g., '2025-10-19T14:00:00-05:00')." },
                endDateTime: { type: "string", description: "The end time of the event in ISO 8601 format (e.g., '2025-10-19T15:00:00-05:00')." },
              },
              required: ["summary", "startDateTime", "endDateTime"],
            },
          },
          {
            name: "send_email",
            description: "Sends an email from the user's connected Gmail account to a specified recipient.",
            parameters: {
              type: "object",
              properties: {
                to: { type: "string", description: "The recipient's email address." },
                subject: { type: "string", description: "The subject line of the email." },
                body: { type: "string", description: "The HTML or plain text content of the email body." },
              },
              required: ["to", "subject", "body"],
            },
          },
          {
            name: "speak_response_to_user",
            description: "Generates audio from a text message to be played back to the user in the app. Use this to provide a voice response to the user's query.",
            parameters: {
              type: "object",
              properties: {
                message: { type: "string", description: "The text content to be converted into speech." },
              },
              required: ["message"],
            },
          },
        ]
    }
];

const toolFunctions = {
  add_event_to_calendar: addEventToCalendar,
  send_email: sendEmail,
  speak_response_to_user: async ({ message }) => {
      const audioBase64 = await getTextToSpeechAudio(message);
      // Include the original message in the response so the frontend can display it as text.
      return { success: true, audio: audioBase64, message: message };
  },
};

export async function POST(req) {
  try {
    const { prompt, context } = await req.json();
    
    // Start a chat session with the model, including the tools.
    const chat = model.startChat({ tools });
    const fullPrompt = `User's request: "${prompt}".\n\nContext from the dashboard: ${context}`;
    
    const result = await chat.sendMessage(fullPrompt);
    const call = result.response.functionCalls()?.[0];

    if (call) {
      const { name, args } = call;
      console.log(`Tool call requested: ${name}`, args);
      const apiResult = await toolFunctions[name](args);
      return new Response(JSON.stringify({ result: apiResult, type: 'tool' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // If no tool is called, the model provides a standard text response.
      // We can also convert this text response to speech.
      const text = result.response.text();
      const audioBase64 = await getTextToSpeechAudio(text);
      const apiResult = { text, audio: audioBase64 };
      return new Response(JSON.stringify({ result: apiResult, type: 'text_and_audio' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error("Error in AI agent route:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}

