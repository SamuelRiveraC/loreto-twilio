var express = require('express');
var router = express.Router();
var axios = require('axios');

router.post('/sms', async (req, res) => {
  try {
    // const token = req.headers.authorization.split(" ")[1];
    // if (!verifySignature(token, privateKey)) {
    //   throw "Invalid signature";
    // }
    const userMessage = req.body.text;
    const userNumber = req.body.msisdn;
    if (!userMessage || !userNumber) throw "No sms body";
    if (!process.env.OPEN_AI_KEY) throw "No OpenAI Key";
    if (!userMessage.includes('gpt')) throw "This is not a message for the api"
    
    const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo-16k',
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Please respond with a brief and concise answer suitable for an SMS' },
          { role: 'user', content: userMessage }
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
    const appMessage = openaiResponse.data.choices[0].message.content;
    
    const { Vonage } = require('@vonage/server-sdk')
    const vonage = new Vonage({
      apiKey: process.env.VONAGE_KEY,
      apiSecret: process.env.VONAGE_SECRET,
    });
    

    let responseFinal = await vonage.sms.send({to: userNumber, from: process.env.APP_NUMBER, text: appMessage}).then(resp => {
      console.log('Message sent successfully');
      console.log({to: userNumber, from: process.env.APP_NUMBER, fromtext: userMessage, totext: appMessage});
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