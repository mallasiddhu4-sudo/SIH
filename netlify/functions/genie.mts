import { Config } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (!apiKey) {
    console.error('GEMINI_API_KEY is missing');
    return new Response(JSON.stringify({ error: 'AI Service is currently unavailable (Missing API Key)' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const body = await req.json();
    const { message, language, currentPage, currentContext } = body;

    const systemInstruction = `You are Genie, the multilingual assistant for KisanX, a farmer procurement coordination platform.
Your job is to understand what the farmer is trying to do.
Supported languages: Telugu, English, Hindi, Tamil, Kannada.
Understand: natural language, everyday language, spoken variations, Romanized Telugu, mixed-language requests.
Return only one allowed KisanX intent and structured entities.
Never invent: token numbers, queue positions, centre capacity, payment status, procurement status, crop eligibility, slot availability, dates, prices.
Do not make business decisions yourself. KisanX application logic will validate all actions.

Allowed intents:
SHOW_HOME, SHOW_LOGIN, SHOW_REGISTER, CHANGE_LANGUAGE, SHOW_CROP_SELECTION, SHOW_CROP_INFO, SHOW_DIVERSIFICATION_INFO,
WHERE_SHOULD_I_GO, SHOW_RECOMMENDED_CENTRE, SHOW_RECOMMENDED_TIME,
BOOK_SLOT, CHANGE_CENTRE, CHANGE_DATE, CHANGE_TIME, SHOW_APPOINTMENT,
SHOW_MY_PROCUREMENT_PLAN, MULTI_CROP_PLAN, EDIT_MULTI_CROP_PLAN,
SHOW_TOKEN, SHOW_QUEUE, SHOW_WAIT_TIME,
ARRIVAL_DECISION, GO_NOW, WAIT, RESCHEDULE,
CANCEL_APPOINTMENT, RESCHEDULE_APPOINTMENT,
SHOW_PROCUREMENT_STATUS, SHOW_PAYMENT_STATUS, SHOW_QUALITY_STATUS,
SHOW_CENTRE_STATUS, SHOW_CENTRE_LOAD, HELP, UNKNOWN.

Context Information:
- Current Page: ${currentPage || 'unknown'}
- Current Context: ${JSON.stringify(currentContext || {})}
- User Language preference: ${language || 'en'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            intent: {
              type: 'STRING',
              description: 'One of the allowed intents.'
            },
            entities: {
              type: 'OBJECT',
              properties: {
                crop: { type: 'STRING' },
                quantity: { type: 'STRING' },
                centre: { type: 'STRING' },
                date: { type: 'STRING' },
                time: { type: 'STRING' },
                token: { type: 'STRING' }
              }
            },
            language: {
              type: 'STRING',
              description: 'The ISO 639-1 code of the language the user is speaking.'
            },
            responseText: {
              type: 'STRING',
              description: 'A friendly, natural language response to the user in their preferred language (e.g. Telugu, English).'
            },
            confidence: {
              type: 'NUMBER',
              description: 'Confidence score between 0 and 1.'
            },
            needsClarification: {
              type: 'BOOLEAN'
            }
          },
          required: ['intent', 'entities', 'language', 'responseText', 'confidence', 'needsClarification']
        }
      }
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error('No text in response');
    }

    return new Response(textResponse, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request via AI' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const config: Config = {
  path: '/.netlify/functions/genie'
};
