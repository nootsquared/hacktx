import { ElevenLabsClient } from "elevenlabs";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

/**
 * Converts text to speech using ElevenLabs API and returns a base64 encoded string.
 * @param {string} text - The text to convert to speech.
 * @returns {Promise<string>} A base64 encoded audio string.
 */
export async function getTextToSpeechAudio(text) {
    try {
        const audio = await elevenlabs.generate({
            voice: "Rachel", // You can choose any voice you like
            text,
            model_id: "eleven_multilingual_v2",
        });

        // The audio is a stream of chunks (Buffers). We need to concatenate them.
        const chunks = [];
        for await (const chunk of audio) {
            chunks.push(chunk);
        }

        const content = Buffer.concat(chunks);
        
        // Return the audio data as a base64 string, which is easy to handle in JSON
        return content.toString('base64');

    } catch (error) {
        console.error("Error with ElevenLabs API:", error);
        throw new Error("Failed to generate audio.");
    }
}

