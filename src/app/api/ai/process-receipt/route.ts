import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        if (!process.env.GOOGLE_AI_API_KEY) {
            console.error('GOOGLE_AI_API_KEY is missing in process.env');
            return NextResponse.json({ error: 'AI Service not configured' }, { status: 500 });
        }

        console.log('Using API Key (first 5 chars):', process.env.GOOGLE_AI_API_KEY.substring(0, 5));

        // Initialize the model with JSON configuration
        const model = genAI.getGenerativeModel({
            model: 'gemini-3.1-pro-preview',
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        // Prepare the image for Gemini
        const base64Data = image.split(',')[1] || image;
        const mimeType = image.split(',')[0].split(':')[1]?.split(';')[0] || 'image/jpeg';

        console.log('Sending image to gemini-3.1-pro-preview, mimeType:', mimeType);

        const prompt = `
      Extract a JSON array of items from this receipt.
      For each item:
      - "name": English translation of the item. Do NOT include any commas (",") in the name. Replace commas with spaces if necessary. Example: "Pears, 1kg pack €1.49" and "Hot peppers, 100g €0.69". There should not be "," after Pears and Hot peppers.
      - "price": Net price paid (actual price = price - discount) as a number.
      same name, same price, same quantity, same weight must be sum up to one item. Then "Name x count" format.
      Handle voids and discounts carefully. Do NOT include taxes or totals.
      Return ONLY the JSON array.
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();
        console.log('Gemini JSON Response:', text);

        try {
            const groceryItems = JSON.parse(text);
            console.log('Parsed Items successfully');
            return NextResponse.json(groceryItems);
        } catch (parseError) {
            console.error('Failed to parse AI response:', text);
            console.error('Parse Error:', parseError);
            return NextResponse.json({ error: 'Failed to parse receipt data', rawResponse: text }, { status: 500 });
        }
    } catch (error: any) {
        console.error('FULL ERROR in /api/ai/process-receipt:', error);
        return NextResponse.json({
            error: 'Failed to process receipt',
            details: error.message || String(error),
            stack: error.stack
        }, { status: 500 });
    }
}
