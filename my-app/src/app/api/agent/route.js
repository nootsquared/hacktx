import { GoogleGenerativeAI } from "@google/generative-ai";
import { addEventToCalendar, sendEmail } from "../../../lib/google";
import { getTextToSpeechAudio } from "../../../lib/elevenlabs";

// Initialize the Gemini AI model
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-preview-09-2025",
    // The system instruction is updated to understand it will receive context
    systemInstruction: "You are a helpful personal assistant integrated into a financial dashboard. The user will provide you with their prompt and also a 'context' which contains the data they are currently viewing. Use this context to answer questions and perform actions. When creating calendar events or sending emails, use information from the context if the user refers to it (e.g., 'this summary'). The current year is 2025.",
});


// Define the functions (tools) that the AI model can call
const tools = [
    {
        functionDeclarations: [
            {
                name: "add_event_to_calendar",
                description: "Adds an event to the user's Google Calendar.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        summary: { type: "STRING", description: "The title or summary of the event. e.g., 'Team Meeting'" },
                        description: { type: "STRING", description: "A detailed description of the event. e.g., 'Discuss Q3 goals'" },
                        location: { type: "STRING", description: "The location of the event. e.g., 'Conference Room 4' or a URL" },
                        startDateTime: { type: "STRING", description: "The start date and time in ISO 8601 format. e.g., '2025-10-28T10:00:00-05:00'" },
                        endDateTime: { type: "STRING", description: "The end date and time in ISO 8601 format. e.g., '2025-10-28T11:00:00-05:00'" },
                    },
                    required: ["summary", "startDateTime", "endDateTime"],
                },
            },
            {
                name: "send_email",
                description: "Sends an email from the user's Gmail account.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        to: { type: "STRING", description: "The recipient's email address. e.g., 'example@google.com'" },
                        subject: { type: "STRING", description: "The subject line of the email." },
                        body: { type: "STRING", description: "The plain text body content of the email." },
                    },
                    required: ["to", "subject", "body"],
                },
            },
            {
                name: "speak_to_representative",
                description: "Generates audio from text to speak a message, as if talking to a representative.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        text: { type: "STRING", description: "The text message to be converted to speech." },
                    },
                    required: ["text"],
                },
            }
        ],
    },
];

export async function POST(req) {
    try {
        // It now expects both a 'prompt' and a 'context' from the frontend
        const { prompt, context } = await req.json();

        if (!prompt) {
            return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400 });
        }

        const chat = model.startChat({
            tools: tools,
        });
        
        // The context from the dashboard is combined with the user's direct prompt
        const fullPrompt = `${context}\n\nUser's request: "${prompt}"`;

        const result = await chat.sendMessage(fullPrompt);
        const call = result.response.functionCalls()?.[0];

        if (call) {
            let apiResponse;
            let finalMessage;

            switch (call.name) {
                case "add_event_to_calendar":
                    apiResponse = await addEventToCalendar(call.args);
                    finalMessage = `Okay, I've added "${call.args.summary}" to your calendar.`;
                    break;
                case "send_email":
                    apiResponse = await sendEmail(call.args);
                    finalMessage = `Alright, your email to ${call.args.to} has been sent.`;
                    break;
                case "speak_to_representative":
                    const audioBase64 = await getTextToSpeechAudio(call.args.text);
                    return new Response(JSON.stringify({
                        message: `Here is the audio for: "${call.args.text}"`,
                        audioData: audioBase64
                    }), { status: 200 });
                default:
                     return new Response(JSON.stringify({ error: "Unknown function call" }), { status: 400 });
            }

             return new Response(JSON.stringify({ message: finalMessage, details: apiResponse }), { status: 200 });

        } else {
            const textResponse = result.response.text();
             return new Response(JSON.stringify({ message: textResponse }), { status: 200 });
        }

    } catch (error) {
        console.error("Error in AI agent:", error);
        return new Response(JSON.stringify({ error: "An internal error occurred." }), { status: 500 });
    }
}

