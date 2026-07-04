require("dotenv").config();

const express = require("express");
const { neon } = require("@neondatabase/serverless");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(function (_, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type",
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;

const sql = neon(DATABASE_URL);

const cors = require("cors");
app.use(cors());

// - - - - - Endpoints - - - - -



// Payments

// GET /payments - filtered: paid, date_from, date_to
app.get("/payments", async (req, res) => {
  try {
    const { paid, date_from, date_to } = req.query;
    let filtered =
      await sql`SELECT * FROM payments ORDER BY paid_at DESC NULLS LAST`;

    if (paid === "true") filtered = filtered.filter((p) => p.paid_at !== null);
    if (paid === "false") filtered = filtered.filter((p) => p.paid_at === null);
    if (date_from)
      filtered = filtered.filter(
        (p) => p.paid_at && new Date(p.paid_at) >= new Date(date_from),
      );
    if (date_to)
      filtered = filtered.filter(
        (p) => p.paid_at && new Date(p.paid_at) <= new Date(date_to),
      );

    res.send(filtered);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching payments" });
  }
});

// GET /payments/:id
app.get("/payments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let payment = await sql`SELECT * FROM payments WHERE id = ${id}`;
    if (payment.length === 0)
      return res.status(404).send({ error: "Payment NOT found" });
    res.send(payment[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error fetching payment" });
  }
});

// POST /bookings/:id/pay - Body: { discount_code }
app.post("/bookings/:id/pay", async (req, res) => {
  try {
    const { id } = req.params;
    const { discount_code } = req.body;

    const bookingResult = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    const booking = bookingResult[0];
    if (!booking) return res.status(404).send({ error: "Booking NOT found" });

    let amount = Number(booking.total_amount);
    let discountId = null;

    if (discount_code) {
      const discountResult =
        await sql`SELECT * FROM discounts WHERE code = ${discount_code} AND is_active = true AND now() BETWEEN starts_at AND expires_at`;
      const discount = discountResult[0];

      if (!discount)
        return res
          .status(400)
          .send({ error: "Invalid or expired discount code" });

      if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
        return res.status(400).send({ error: "Discount usage limit reached" });
      }

      if (
        discount.minimum_order_amount &&
        amount < discount.minimum_order_amount
      ) {
        return res
          .status(400)
          .send({
            error: `Minimum order amount is ${discount.minimum_order_amount}`,
          });
      }

      let reduction = amount * (discount.percentage / 100);
      if (discount.max_discount_amount) {
        reduction = Math.min(reduction, discount.max_discount_amount);
      }
      amount = Math.round(amount - reduction);
      discountId = discount.id;
      await sql`UPDATE discounts SET used_count = used_count + 1 WHERE id = ${discountId}`;
    }

    await sql`INSERT INTO payments (booking_id, discount_id, amount, paid_at) VALUES (${id}, ${discountId}, ${amount}, now())`;

    await sql`UPDATE bookings SET status = 'booked', updated_at = now() WHERE id = ${id}`;

    await sql`INSERT INTO notifications (booking_id, user_id, type, content) VALUES (${booking.id}, ${booking.user_id}, 'confirmation', 'رزرو شما با موفقیت تایید شد.')`;

    res.send({ message: "Payment successful", amount });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).send({ error: error.message });
  }
});


app.listen(PORT, () =>
  console.log(` My App listening at http://localhost:${PORT}`),
);
