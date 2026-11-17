const MODELS = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL]
  : ['gemini-flash-latest', 'gemini-2.5-flash'];

const TUTOR = 'You are a patient, friendly study tutor. Solve the problem step by step and explain every step in simple words a student can follow. Give a short real-life example when it helps and finish with a 2-line summary. Use plain text only: numbered steps, no markdown symbols and no LaTeX.\n\nStudent question: ';
const FLOW = 'Return ONLY JSON in this shape: {"nodes":[{"id":"n1","text":"max 7 words","type":"start|process|decision|io|end"}],"edges":[{"from":"n1","to":"n2","label":""}]}. Draw a clear flowchart (max 12 nodes) that explains the following. Make it a classic textbook flowchart: exactly one start and one end, steps in order, use io for input or output, and decisions as yes/no questions. For each decision list the Yes edge first, then the No edge, labelled Yes and No.\n\nTopic: ';
const CARDS = 'Return ONLY JSON in this shape: {"cards":[{"q":"question","a":"answer"}]}. Make 4 to 6 short revision flashcards from the lesson below. Each question under 100 characters and each answer under 200 characters, plain text only.\n\n';

const reply = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body)
});

function extractJson(text) {
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a === -1 || b <= a) { throw new Error('no json'); }
  return JSON.parse(text.slice(a, b + 1));
}

async function askGemini(key, prompt, asJson) {
  let lastStatus = 0;
  for (const model of MODELS) {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: Object.assign({ maxOutputTokens: 2500 }, asJson ? { responseMimeType: 'application/json' } : {})
      })
    });
    if (res.status === 404) { lastStatus = 404; continue; }
    if (!res.ok) { const err = new Error('api'); err.status = res.status; throw err; }
    const data = await res.json();
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const text = parts.map(p => p.text || '').join('').trim();
    if (!text) { throw new Error('empty answer'); }
    return text;
  }
  const err = new Error('no model available');
  err.status = lastStatus;
  throw err;
}

exports.handler = async (event) => {
  const key = process.env.GEMINI_API_KEY;
  if (event.httpMethod === 'GET') { return reply(200, { ai: !!key }); }
  if (event.httpMethod !== 'POST') { return reply(405, { error: 'Method not allowed.' }); }
  if (!key) { return reply(500, { error: 'The AI is not set up on the server yet.' }); }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return reply(400, { error: 'Bad request.' }); }

  const task = body.task;
  const input = String(body.input || '').trim().slice(0, 2000);
  const lesson = String(body.lesson || '').slice(0, 8000);
  if (!input) { return reply(400, { error: 'Please type a question first.' }); }

  let prompt, asJson;
  if (task === 'solve') { prompt = TUTOR + input; asJson = false; }
  else if (task === 'flow') { prompt = FLOW + input; asJson = true; }
  else if (task === 'cards') { prompt = CARDS + 'Question: ' + input + '\n\nLesson:\n' + lesson; asJson = true; }
  else { return reply(400, { error: 'Unknown task.' }); }

  try {
    const text = await askGemini(key, prompt, asJson);
    if (task === 'solve') { return reply(200, { text }); }
    return reply(200, { data: extractJson(text) });
  } catch (e) {
    return reply(e.status === 429 ? 429 : 502, { error: 'The AI could not answer right now. Please try again.' });
  }
};
