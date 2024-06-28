const stripe = require("stripe")(process.env.STRIPE_PUBLISHABLE_KEY);
const express = require("express");
const app = express();
const Payments = require("./paymentDB");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');

require("dotenv").configDotenv();

app.use(bodyParser.json({
    verify: function (req, res, buf) {
        var url = req.originalUrl;
        if (url.startsWith('/webhook')) {
            req.body = buf.toString()
        }
    }
}));


mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to Database"))
  .catch((error) => console.error("MongoDB connection error:", error));

const endpointSecret = process.env.END_POINT_SECRET;

const PORT = process.env.PORT || 4242;

// app.use(express.raw());

app.get("/", (req, res) => {
  return res.json({ msg: "hello world" });
});

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    console.log("Webhook api called");
    console.log("request.body: ", request.body);
    const sig = request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
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
        console.log("checkoutSessionCompleted", checkoutSessionCompleted);
        sessionData = checkoutSessionCompleted;
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    const data = new Payments({
      userId: new mongoose.Types.ObjectId("666ee91689a6f624d7f80cfd"),
      restaurantID: new mongoose.Types.ObjectId("66573f6211cd76caa8c567ef"),
      stripeId: sessionData.id,
    });
    await data.save();

    response.send();
  }
);

app.listen(PORT, () => console.log("http://localhost:4242"));
