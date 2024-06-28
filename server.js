// server.js
//
// Use this sample code to handle webhook events in your integration.
//
// 1) Paste this code into a new file (server.js)
//
// 2) Install dependencies
//   npm install stripe
//   npm install express
//
// 3) Run the server on http://localhost:4242
//   node server.js

// The library needs to be configured with your account's secret key.
// Ensure the key is kept out of any version control system you might be using.
const stripe = require('stripe')('sk_test_51PVDKBChcmYHyL69dgNOyILnPVU56568s0jU1mIT1TUAW20OQEgYG7Cg99gC4WlWoO0pN6mERMxAgiIzEUD7783g00xT94EuN0');
const express = require('express');
const app = express();
const Payments = require('./paymentDB');


const endpointSecret = "whsec_df8b1affad84574930077d48237fe077608fdaecc909e6eb3b73da28e2d81bbe";

app.get('/', (req, res) => {
    return res.json({msg: 'hello world'});
});

app.post('/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  let sessionData;
  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSessionCompleted = event.data.object;
      console.log("checkoutSessionCompleted", checkoutSessionCompleted);
      sessionData = checkoutSessionCompleted;
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  const data = new Payments({
    userId: new mongoose.Types.ObjectId('666ee91689a6f624d7f80cfd'),
    restaurantID: new mongoose.Types.ObjectId('66573f6211cd76caa8c567ef'),
    stripeId: sessionData.id
  });
  await data.save();

  response.send();
});

app.listen(4242, () => console.log('http://localhost:4242'));