var express = require('express');
var router = express.Router();
var axios = require('axios');

router.post('/sms', async (req, res) => {
  try {
    // const token = req.headers.authorization.split(" ")[1];
    // if (!verifySignature(token, privateKey)) {
    //   throw "Invalid signature";
    // }
    const messageBody = req.body.text;
    const fromNumber = req.body.msisdn;
    if (!messageBody || !fromNumber) throw "No sms body";
    if (!process.env.OPEN_AI_KEY) throw "No OpenAI Key";
    if (!messageBody.includes('gpt')) throw "This is not a message for the api"
    
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
    
    const Vonage = require('@vonage/server-sdk'); // Install the Vonage SDK using npm install @vonage/server-sdk
    const vonage = new Vonage({
      apiKey: process.env.VONAGE_KEY,
      apiSecret: process.env.VONAGE_SECRET,
    });
    let responseFinal = await vonage.sms.send({to, from, responseMessage}).then(resp => {
      console.log('Message sent successfully');
      console.log(resp);
    }).catch(err => {
      console.log('There was an error sending the messages.');
      console.error(err);
    });

    res.send(responseFinal);
} catch (error) {
    console.error(error);
    res.status(500).send({msg: 'Error sending response', error});
  }
});
module.exports = router;