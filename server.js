const express = require("express");
const app = express();
const Payments = require("./paymentDB");
const mongoose = require("mongoose");
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_PUBLISHABLE_KEY);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to Database"))
  .catch((error) => console.error("MongoDB connection error:", error));

const endpointSecret = process.env.END_POINT_SECRET;

const PORT = process.env.PORT || 4242;

app.get("/", (req, res) => {
  return res.json({ msg: "hello world" });
});

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    console.log("Webhook API called");

    const body = request.body;

    console.log("🚀 ~ body:", body)

    const sig = request.headers["stripe-signature"];
    console.log("sig: ", sig);

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        sig,
        endpointSecret
      );
    } catch (err) {
      console.log(
        `Webhook signature verification failed. Error: ${err.message}`
      );
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    let sessionData;
    switch (event.type) {
      case "checkout.session.completed":
        const checkoutSessionCompleted = event.data.object;
        sessionData = checkoutSessionCompleted;
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
        response.status(400).send(`Unhandled event type ${event.type}`);
        return;
    }

    const data = new Payments({
      userId: new mongoose.Types.ObjectId(sessionData.metadata.userId),
      restaurantID: new mongoose.Types.ObjectId(sessionData.metadata.restaurantId),
      stripeId: sessionData.payment_intent,
      orderId: sessionData.metadata.orderId
    });

    try {
      await data.save();
      response.status(200).send();
    } catch (error) {
      console.error("Error saving payment data:", error);
      response.status(500).send("Internal Server Error");
    }
  }
);

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
