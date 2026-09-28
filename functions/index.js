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
  const {email, tierPrice, tierName, paymentMethodId} = data;

  try {
    const customer = await stripe.customers.create({
      email: email,
      metadata: {firebaseUID: userId},
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{price: tierPrice}],
      trial_period_days: 7,
      metadata: {tier: tierName},
      default_payment_method: paymentMethodId,
    });

    await admin.firestore().collection("users").doc(userId).update({
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      stripePaymentMethodId: paymentMethodId,
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

exports.stripeWebhook = functions.https.onRequest(
    {invoker: "public"},
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      let event;

      try {
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET,
        );
      } catch (err) {
        const errorMsg = "Webhook signature verification failed:";
        console.error(errorMsg, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      try {
        if (event.type === "customer.subscription.trial_will_end") {
          const subscription = event.data.object;
          const customerId = subscription.customer;

          const usersSnapshot = await admin
              .firestore()
              .collection("users")
              .where("stripeCustomerId", "==", customerId)
              .limit(1)
              .get();

          if (usersSnapshot.empty) {
            console.log(`No user found for customer ${customerId}`);
            return res.status(200).send("User not found");
          }

          const userDoc = usersSnapshot.docs[0];
          const userId = userDoc.id;

          await admin
              .firestore()
              .collection("users")
              .doc(userId)
              .update({
                subscriptionStatus: subscription.status,
                trialEndsAt: new Date(subscription.trial_end * 1000),
              });

          const logMsg = `Trial ending for user ${userId}, `;
          console.log(logMsg + `subscription ${subscription.id}`);
        }

        if (event.type === "invoice.payment_succeeded") {
          const invoice = event.data.object;
          const customerId = invoice.customer;

          const usersSnapshot = await admin
              .firestore()
              .collection("users")
              .where("stripeCustomerId", "==", customerId)
              .limit(1)
              .get();

          if (usersSnapshot.empty) {
            console.log(`No user found for customer ${customerId}`);
            return res.status(200).send("User not found");
          }

          const userDoc = usersSnapshot.docs[0];
          const userId = userDoc.id;

          await admin
              .firestore()
              .collection("users")
              .doc(userId)
              .update({
                subscriptionStatus: "active",
                lastChargeDate: new Date(invoice.created * 1000),
              });

          const logMsg = `Payment succeeded for user ${userId}, `;
          console.log(logMsg + `invoice ${invoice.id}`);
        }

        if (event.type === "invoice.payment_failed") {
          const invoice = event.data.object;
          const customerId = invoice.customer;

          const usersSnapshot = await admin
              .firestore()
              .collection("users")
              .where("stripeCustomerId", "==", customerId)
              .limit(1)
              .get();

          if (usersSnapshot.empty) {
            console.log(`No user found for customer ${customerId}`);
            return res.status(200).send("User not found");
          }

          const userDoc = usersSnapshot.docs[0];
          const userId = userDoc.id;

          await admin
              .firestore()
              .collection("users")
              .doc(userId)
              .update({
                subscriptionStatus: "past_due",
              });

          const logMsg = `Payment failed for user ${userId}, `;
          console.log(logMsg + `invoice ${invoice.id}`);
        }

        res.status(200).send("Webhook received");
      } catch (error) {
        console.error("Webhook processing error:", error);
        res.status(500).send("Internal server error");
      }
    },
);
