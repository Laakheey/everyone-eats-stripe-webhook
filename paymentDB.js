const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  restaurantID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  stripeId: { type: String, required: true },
});

const Payments = mongoose.model("Payment", paymentSchema);
module.exports = Payments;
