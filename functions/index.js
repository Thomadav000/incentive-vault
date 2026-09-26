const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

admin.initializeApp();

exports.createSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be logged in",
    );
  }

  const userId = context.auth.uid;
  const {email, tierPrice, tierName} = data;

  try {
    const customer = await stripe.customers.create({
      email: email,
      metadata: {firebaseUID: userId},
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{price: tierPrice}],
      trial_period_days: 7,
      metadata: {tier: tierName},
    });

    await admin.firestore().collection("users").doc(userId).update({
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      selectedTier: tierName,
      trialEndsAt: new Date(subscription.trial_end * 1000),
      subscriptionStatus: subscription.status,
    });

    return {
      success: true,
      subscriptionId: subscription.id,
      customerId: customer.id,
    };
  } catch (error) {
    console.error("Subscription creation failed:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
