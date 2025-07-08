/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {GoogleGenAI} from '@google/genai';
import {getInfographicSystemPrompt} from '../constants';
import { InfographicCardData } from '../types';

if (!process.env.API_KEY) {
  console.error(
    'API_KEY environment variable is not set. The application will not be able to connect to the Gemini API.',
  );
}

const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

// This function now returns a promise that resolves to an array of card data objects
export async function streamInfographicContent(
  topic: string,
  history: InfographicCardData[],
): Promise<InfographicCardData[]> {
  const model = 'gemini-2.5-flash-preview-04-17';

  if (!process.env.API_KEY) {
    throw new Error('Configuration Error: The API_KEY is not configured.');
  }

  const fullPrompt = getInfographicSystemPrompt(topic, history);

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        // Use Google Search for grounding and fact-checking.
        // responseMimeType must NOT be set to application/json when using tools.
        tools: [{googleSearch: {}}],
      },
    });

    const responseText = response.text;
    let jsonStr = '';

    // The response might be wrapped in ```json ... ``` markdown, sometimes with leading text.
    const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = responseText.match(fenceRegex);
    
    if (match && match[1]) {
      jsonStr = match[1].trim();
    } else {
      // Fallback for when the AI forgets the fence. It finds the first '[' or '{'
      // and assumes it's the start of the JSON.
      const firstBracket = responseText.indexOf('[');
      const firstBrace = responseText.indexOf('{');

      if (firstBracket !== -1) {
         const lastBracket = responseText.lastIndexOf(']');
         if (lastBracket > firstBracket) {
          jsonStr = responseText.substring(firstBracket, lastBracket + 1);
         }
      } else if (firstBrace !== -1) {
        const lastBrace = responseText.lastIndexOf('}');
        if(lastBrace > firstBrace) {
          jsonStr = responseText.substring(firstBrace, lastBrace + 1);
        }
      }
    }

    if (!jsonStr) {
      // If we still couldn't find a JSON string, throw an error.
      throw new Error("Could not find a valid JSON block in the AI's response.");
    }
    
    try {
      const parsedData = JSON.parse(jsonStr);
      // Basic validation to ensure we have an array
      if (Array.isArray(parsedData)) {
        return parsedData as InfographicCardData[];
      } else {
        console.error("Parsed data is not an array:", parsedData);
        throw new Error("AI returned data in an unexpected format (not an array).");
      }
    } catch (e) {
      console.error("Failed to parse JSON response:", e, "Raw response:", jsonStr);
      throw new Error("Failed to parse the data from the AI. The format was invalid.");
    }

  } catch (error) {
    console.error('Error streaming from Gemini:', error);
    let errorMessage = 'An error occurred while generating content.';
    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}