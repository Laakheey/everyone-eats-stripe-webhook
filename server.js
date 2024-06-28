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
const stripe = require('stripe')(process.env.STRIPE_PUBLISHABLE_KEY);
const express = require('express');
const app = express();
const Payments = require('./paymentDB');
const mongoose = require('mongoose');
require('dotenv').configDotenv();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to Database"))
  .catch((error) => console.error("MongoDB connection error:", error));

const endpointSecret = process.env.END_POINT_SECRET;

const PORT = process.env.PORT || 4242

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

app.listen(PORT, () => console.log('http://localhost:4242'));