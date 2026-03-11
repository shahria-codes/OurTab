const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env') });

const apiKey = process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
    console.error('Error: GOOGLE_AI_API_KEY not found in .env');
    process.exit(1);
}

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log('Available Models:');
        if (data.models) {
            data.models.forEach((m) => console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`));
        } else {
            console.log('No models found or error in response:', data);
        }
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
