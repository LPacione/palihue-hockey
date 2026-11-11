import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

// Now import handler dynamically after env is loaded
const { default: handler } = await import('./api/agent.js');

// Ensure API key is loaded
if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env.local");
  process.exit(1);
}

const req = {
  method: 'POST',
  body: {
    chatId: 'test-chat-session-1234',
    message: 'Cuantos partidos lleva jugados la 1ra_fem? y Cuales fueron sus resultados?',
    history: [
      { role: 'user', text: 'Hola' },
      { role: 'model', text: '¡Hola! Soy el Coach IA de Palihue Hockey, tu asistente para analizar el rendimiento y la táctica de nuestros partidos. ¿En qué puedo ayudarte hoy?' }
    ]
  }
};

const res = {
  statusCode: 200,
  headers: {},
  setHeader(name, value) {
    this.headers[name] = value;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    console.log("\n--- Response Status:", this.statusCode);
    console.log("Response Body:", JSON.stringify(data, null, 2));
    return this;
  },
  end() {
    console.log("\n--- Response Ended");
  }
};

async function runTest() {
  console.log("Starting agent multi-turn flow test...");
  await handler(req, res);
}

runTest();
