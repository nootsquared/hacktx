import { ElevenLabsClient } from "elevenlabs";
import fs from 'fs';
import path from 'path';

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // A default voice, change if you want

export async function getTextToSpeechAudio(text) {
  try {
    const audio = await elevenlabs.generate({
      voice: VOICE_ID,
      text,
      model_id: "eleven_turbo_v2"
    });

    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const content = Buffer.concat(chunks);
    return content.toString('base64');
  } catch (error) {
    console.error("Error with ElevenLabs TTS:", error);
    return null;
  }
}

export async function getTextToSpeechAndSave(text, fileName) {
  try {
    const audio = await elevenlabs.generate({
      voice: VOICE_ID,
      text,
      model_id: "eleven_turbo_v2"
    });
    
    const tempDir = path.join(process.cwd(), 'public', 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, fileName);
    const fileStream = fs.createWriteStream(filePath);
    
    for await (const chunk of audio) {
      fileStream.write(chunk);
    }
    
    console.log(`Audio file saved to ${filePath}`);
    return filePath;

  } catch (error) {
    console.error("Error saving ElevenLabs TTS file:", error);
    return null;
  }
}
