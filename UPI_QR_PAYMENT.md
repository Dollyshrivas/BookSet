# UPI QR checkout

Checkout creates a unique Razorpay UPI QR for each order, with the server-calculated amount fixed and prefilled. The checkout checks payment status and redirects to Profile → Orders after Razorpay confirms payment. Only signed-in users can create and view their orders.

Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the backend `.env`, or use `TEST_API_KEY` and `TEST_SECRET_KEY` for test credentials. Keep the secret on the backend and never add either value to frontend code or commit it. Start with Razorpay test-mode keys.

To enable webhook updates as an additional confirmation path, set `RAZORPAY_WEBHOOK_SECRET` and configure a webhook at `https://<your-public-backend-host>/api/v1/orders/razorpay-webhook` for `payment.captured`, `payment.failed`, and `qr_code.credited` events. Configure the backend database and session as described in `.env.example`, and set `VITE_API_URL` in the frontend as needed. Switch to live credentials only after the Razorpay account is activated and the app is deployed over HTTPS.
