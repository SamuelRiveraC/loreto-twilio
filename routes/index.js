var express = require('express');
var router = express.Router();
var axios = require('axios');

router.post('/sms', async (req, res) => {
  const messageBody = req.body.Body;
  const fromNumber = req.body.From;
  try {
    if (!messageBody || !fromNumber) throw "No sms body";
    if (!process.env.OPEN_AI_KEY) throw "No OpenAI Key";
    
    const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo-16k',
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Please respond with a brief and concise answer suitable for an SMS' },
          { role: 'user', content: messageBody }
        ],
        temperature: 0.8,
        max_tokens: 1500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      },
      {
        headers: { 'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`, 'Content-Type': 'application/json' }
      }
    );

    const responseText = openaiResponse.data.choices[0].message.content;
    const responseMessage = `ChatGPT: ${responseText}`;
    const { MessagingResponse } = require('twilio').twiml;
    const twiml = new MessagingResponse();
    twiml.message(responseMessage);

    res.type('text/xml').send(twiml.toString());
  } catch (error) {
    console.error(error);
    res.status(500).send('Error sending response');
  }
});
module.exports = router;