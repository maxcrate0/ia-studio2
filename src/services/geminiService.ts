import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { Task, DispatchResponse, Feature } from '../types';
import { fileToBase64, decode, decodeAudioData } from '../utils/helpers';

// FIX: Use process.env.API_KEY as per guidelines. The API key is assumed to be available in the environment.
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const DISPATCHER_MODEL = 'gemini-2.5-pro';
const CHAT_MODEL = 'gemini-2.5-flash';
const TITLE_MODEL = 'gemini-2.5-flash';
const IMAGE_GEN_MODEL = 'imagen-4.0-generate-001';
const IMAGE_EDIT_MODEL = 'gemini-2.5-flash-image';
const VIDEO_GEN_MODEL = 'veo-3.1-fast-generate-preview';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

const getDispatcherPrompt = (userPrompt: string, hasImage: boolean) => `
You are an intelligent AI assistant that routes user requests to the appropriate tool.
Analyze the user's prompt and determine which of the following tools is most suitable.
You must respond with a JSON object containing an array of 'tasks'. Each task object should have a 'feature' and a 'prompt'.

Available features:
- "IMAGE_GENERATION": For requests to create, generate, or draw an image.
- "IMAGE_EDITING": For requests to edit, change, or modify an existing image. This is the correct tool if an image has been provided.
- "VIDEO_GENERATION": For requests to create, generate, or animate a video.
- "TTS": For requests to say, speak, narrate, or generate audio. The prompt for this should be "[PREVIOUS_RESULT]" if it follows a text-generating task.
- "SEARCH": For requests about recent events, facts, or information that requires up-to-date knowledge.
- "CHAT": For general conversation, questions, stories, poems, code, or any request not covered by the other tools.

The user has provided an image: ${hasImage}.

User Prompt: "${userPrompt}"

Analyze the prompt and return a valid JSON object in the format { "tasks": [{ "feature": "FEATURE_NAME", "prompt": "prompt_for_the_model" }] }.
If multiple steps are needed, include multiple task objects in the array. For example, generating a story then reading it aloud would be two tasks: CHAT then TTS.
`;

export const improvePrompt = async (prompt: string): Promise<string> => {
    const ai = getAiClient();
    const improvementPrompt = `You are a prompt-enhancing AI. Your goal is to take a user's prompt and make it more detailed, specific, and clear to generate the best possible result from an AI model. Do not fulfill the prompt, only improve it. Return only the improved prompt. User's prompt: "${prompt}"`;
    
    const response = await ai.models.generateContent({
        model: CHAT_MODEL,
        contents: improvementPrompt,
    });
    
    return response.text.trim();
};

export const generateChatTitle = async (prompt: string): Promise<string> => {
    const ai = getAiClient();
    const titlePrompt = `Create a very short, concise title (4-5 words max) for a chat conversation that starts with this prompt: "${prompt}". Just return the title, nothing else.`;
    const response = await ai.models.generateContent({ model: TITLE_MODEL, contents: titlePrompt });
    return response.text.trim().replace(/"/g, ''); // Remove quotes
};


export const dispatchPrompt = async (prompt: string, imageFile: File | null): Promise<Task[]> => {
  const ai = getAiClient();
  const dispatcherPrompt = getDispatcherPrompt(prompt, !!imageFile);

  const response = await ai.models.generateContent({
    model: DISPATCHER_MODEL,
    contents: dispatcherPrompt,
    config: { responseMimeType: "application/json" }
  });
  
  const jsonText = response.text.trim();
  try {
    const parsed = JSON.parse(jsonText) as DispatchResponse;
    if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
      throw new Error("Invalid format from dispatcher: 'tasks' array not found.");
    }
    return parsed.tasks;
  } catch (e) {
    console.error("Failed to parse dispatcher response:", jsonText, e);
    // Fallback to CHAT if dispatcher fails
    return [{ feature: Feature.Chat, prompt }];
  }
};

export const executeTask = async (task: Task, context: { previousResult?: any; imageFile?: File | null }) => {
  const ai = getAiClient();
  const finalPrompt = task.prompt === "[PREVIOUS_RESULT]" && typeof context.previousResult === 'string'
    ? context.previousResult
    : task.prompt;

  switch (task.feature) {
    case Feature.Chat: {
      const response = await ai.models.generateContent({ model: CHAT_MODEL, contents: finalPrompt });
      return { type: 'text', data: response.text };
    }
    case Feature.Search: {
      const response = await ai.models.generateContent({
        model: CHAT_MODEL,
        contents: finalPrompt,
        config: { tools: [{ googleSearch: {} }] },
      });
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = groundingChunks?.map((chunk: any) => ({
          uri: chunk.web?.uri || '',
          title: chunk.web?.title || 'Source'
      })).filter((s:any) => s.uri) || [];

      return { type: 'text', data: response.text, sources: sources };
    }
    case Feature.ImageGeneration: {
      const response = await ai.models.generateImages({
        model: IMAGE_GEN_MODEL,
        prompt: finalPrompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' },
      });
      const base64Image = response.generatedImages[0].image.imageBytes;
      return { type: 'image', data: `data:image/png;base64,${base64Image}` };
    }
    case Feature.ImageEditing: {
      if (!context.imageFile) throw new Error("Image editing requires an image.");
      const base64Image = await fileToBase64(context.imageFile);
      const imagePart = { inlineData: { data: base64Image, mimeType: context.imageFile.type } };
      const textPart = { text: finalPrompt };
      
      const response = await ai.models.generateContent({
        model: IMAGE_EDIT_MODEL,
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE] },
      });

      const resultPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (!resultPart?.inlineData) throw new Error("No image was returned from the editing model.");
      
      const resultBase64 = resultPart.inlineData.data;
      return { type: 'image', data: `data:${resultPart.inlineData.mimeType};base64,${resultBase64}` };
    }
    case Feature.VideoGeneration: {
       const aiForVideo = getAiClient();
        let operation = await aiForVideo.models.generateVideos({
            model: VIDEO_GEN_MODEL,
            prompt: finalPrompt,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
        });
        
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await aiForVideo.operations.getVideosOperation({ operation: operation });
        }
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation failed to produce a download link.");
        
        // FIX: Use process.env.API_KEY for fetching the video.
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await videoResponse.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        
        return { type: 'video', data: videoUrl };
    }
    case Feature.TTS: {
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text: finalPrompt }] }],
        config: { responseModalities: [Modality.AUDIO] },
      });
      
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("TTS failed to produce audio data.");

      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const decodedBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(decodedBytes, outputAudioContext, 24000, 1);

      const wavBlob = bufferToWave(audioBuffer, audioBuffer.length);
      const audioUrl = URL.createObjectURL(wavBlob);
      
      return { type: 'audio', data: audioUrl };
    }
    default:
      throw new Error(`Unknown feature: ${task.feature}`);
  }
};

// Helper to convert raw audio buffer to a WAV file Blob
function bufferToWave(abuffer: AudioBuffer, len: number): Blob {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [],
        i,
        sample,
        offset = 0,
        pos = 0;

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for (i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([view], { type: "audio/wav" });

    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}
