require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL);

const cors = require("cors");
app.use(cors());
const sha256 = require("sha256");

const PROVIDER_TABLES = {
  airlines: "airlines",
  "bus-companies": "bus_companies",
  "train-companies": "train_companies",
  "tour-agencies": "tour_agencies",
};

async function sendEmail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"Your App Name" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Message sent: %s", info);
  } catch (error) {
    console.error("Error while sending mail:", error);
  }
}
app.listen(PORT, () =>
  console.log(` My App listening at http://localhost:${PORT}`),
);
// - - - - - Endpoints - - - - -

// Users

const SAFE_USER_COLUMNS = sql.unsafe(
  `id, username, "first-name", "last-name", "phone-number", gender, email, role, birth_date`,
);

// Get /users - filter by role, gender, search
app.get("/users", async (req, res) => {
  try {
    const { role, gender, search } = req.query;
    let filtered = await sql`SELECT ${SAFE_USER_COLUMNS} FROM "Users"`;

    if (role) {
      filtered = filtered.filter(
        (u) => u.role.toLowerCase() === role.toLowerCase(),
      );
    }

    if (gender) {
      filtered = filtered.filter(
        (u) => u.gender.toLowerCase() === gender.toLowerCase(),
      );
    }

    if (search) {
      const s = search.toLowerCase().trim();
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(s) ||
          u["first-name"]?.toLowerCase().includes(s) ||
          u["last-name"]?.toLowerCase().includes(s) ||
          `${u["first-name"]} ${u["last-name"]}`?.toLowerCase().includes(s),
      );
    }

    if (filtered.length === 0) {
      return res.status(404).send({ error: "بدون نتیجه" });
    }

    res.send(filtered);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send({ error: "خطا در دریافت لیست کاربران" });
  }
});

// Get /users/:id
app.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user =
      await sql`SELECT ${SAFE_USER_COLUMNS} FROM "Users" WHERE id = ${id}`;

    if (user.length === 0) {
      return res.status(404).send({ error: "کاربر پیدا نشد" });
    }

    res.send(user[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در دریافت کاربر" });
  }
});

// Post /users - body: username, firstName, lastName, phoneNumber, gender, email, password, birthDate
app.post("/users", async (req, res) => {
  try {
    const {
      username,
      firstName,
      lastName,
      phoneNumber,
      gender,
      email,
      password,
      birthDate,
    } = req.body;

    if (
      !username ||
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !gender ||
      !password ||
      !birthDate
    ) {
      return res.status(400).send({
        error:
          "نام کاربری, رمز ورود, نام و نام خانوادگی, شماره تماس, جنسیت و تاریخ تولد الزامی اند",
      });
    }

    const duplicateUser =
      await sql`SELECT id FROM "Users" WHERE username = ${username}`;
    if (duplicateUser.length !== 0) {
      return res.status(400).send({ error: "نام کاربری در سیستم وجود دارد" });
    }

    const hashedPassword = sha256(password);

    const result = await sql`
      INSERT INTO "Users" (username, "first-name", "last-name", "phone-number", gender, email, password, birth_date) VALUES (${username}, ${firstName}, ${lastName}, ${phoneNumber}, ${gender}, ${email || null}, ${hashedPassword}, ${birthDate}) RETURNING ${SAFE_USER_COLUMNS}
    `;

    res.status(201).send(result[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: `خطا در ثبت کاربر: ${error.message}` });
  }
});

// Post /login - body: username, password
app.post("/users/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .send({ error: "نام کاربری و رمز ورود الزامی اند" });
    }

    const user = await sql`SELECT * FROM "Users" WHERE username = ${username}`;

    if (user.length === 0) {
      return res.status(401).send({ error: "نام کاربری نامعتبر است" });
    }

    const hashedPassword = sha256(password);

    if (hashedPassword !== user[0].password && password !== user[0].password) {
      return res.status(401).send({ error: "رمز ورود اشتباه است" });
    }

    res.send({
      success: true,
      user: {
        id: user[0].id,
        username: user[0].username,
        role: user[0].role,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "ورود ناموفق!" });
  }
});

// Patch /users/:id/password - body: password
app.patch("/users/:id/password", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).send({ error: "رمز ورود الزامی است" });
    }

    const user = await sql`SELECT * FROM "Users" WHERE id = ${id}`;

    if (user.length === 0) {
      return res.status(404).send({ error: "کاربر پیدا نشد" });
    }

    const hashedPassword = sha256(password);

    if (hashedPassword === user[0].password) {
      return res.status(400).send({ error: "رمز ورود نمی تواند تکراری باشد" });
    }

    const result =
      await sql`UPDATE "Users" SET password = ${hashedPassword} WHERE id = ${id} RETURNING id`;

    if (result.length === 0) {
      return res
        .status(400)
        .send({ error: "در حین تغییر دادن رمز ورود، مشکلی پیش آمده است" });
    }

    res.send({ success: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در تغییر رمز عبور" });
  }
});

// Patch /users/:id - update user fields - body: firstName, lastName, email, phoneNumber
app.patch("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber } = req.body;

    const result = await sql`
            UPDATE "Users" SET
              "first-name" = COALESCE(${firstName}, "first-name"),
              "last-name" = COALESCE(${lastName}, "last-name"),
              email = COALESCE(${email}, email),
              "phone-number" = COALESCE(${phoneNumber}, "phone-number")
            WHERE id = ${id}
            RETURNING ${SAFE_USER_COLUMNS}
        `;

    if (result.length === 0) {
      return res.status(404).send({ error: "کاربر پیدا نشد" });
    }

    res.send(result[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در بروزرسانی اطلاعات کاربر" });
  }
});

// Patch /users/:id/role - body: role (customer or admin)
app.patch("/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).send({ error: "نقش الزامی است" });
    }

    const result = await sql`
        UPDATE "Users" SET
          role = ${role}
        WHERE id = ${id}
        RETURNING id, username, role
      `;

    if (result.length === 0) {
      return res.status(404).send({ error: "کاربر پیدا نشد" });
    }

    res.send(result[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در بروزرسانی اطلاعات کاربر" });
  }
});

// Delete /users/:id
app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sql`DELETE FROM "Users" WHERE id = ${id} RETURNING id`;

    if (result.length === 0) {
      return res.status(404).send({ error: "کاربر پیدا نشد" });
    }

    res.send({ success: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در حذف کاربر" });
  }
});

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

    if (filtered.length === 0) {
      return res.status(404).send({ error: "بدون نتیجه" });
    }

    res.send(filtered);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).send({ error: "خطا در دریافت پرداخت ها" });
  }
});

// GET /payments/:id
app.get("/payments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let payment = await sql`SELECT * FROM payments WHERE id = ${id}`;
    if (payment.length === 0)
      return res.status(404).send({ error: "پرداخت پیدا نشد" });
    res.send(payment[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "خطا در دریافت پرداخت" });
  }
});

// POST /bookings/:id/pay - Body: { discount_code }
app.post("/bookings/:id/pay", async (req, res) => {
  try {
    const { id } = req.params;
    const { discount_code } = req.body;

    const bookingResult = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    const booking = bookingResult[0];
    if (!booking) return res.status(404).send({ error: "رزرو پیدا نشد" });

    let amount = Number(booking.total_amount);
    let discountId = null;

    if (discount_code) {
      const discountResult =
        await sql`SELECT * FROM discounts WHERE code = ${discount_code} AND is_active = true AND now() BETWEEN starts_at AND expires_at`;
      const discount = discountResult[0];

      if (!discount)
        return res.status(400).send({ error: "کد تخفیف نامعتبر یا منقضی است" });

      if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
        return res
          .status(400)
          .send({ error: "ظرفیت استفاده از کد تخفیف پر شده است" });
      }

      if (
        discount.minimum_order_amount &&
        amount < discount.minimum_order_amount
      ) {
        return res.status(400).send({
          error: `خطا، حداقل میزان سفارش: ${discount.minimum_order_amount}`,
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

    res.send({ message: "پرداخت موفقیت آمیز بود", amount });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Discounts

// Get /discounts - filter by active
app.get("/discounts", async (req, res) => {
  try {
    const { active } = req.query;
    let filtered = await sql`SELECT * FROM discounts ORDER BY created_at DESC`;

    if (active === "true")
      filtered = filtered.filter((d) => d.is_active === true);
    if (active === "false")
      filtered = filtered.filter((d) => d.is_active === false);

    if (filtered.length === 0) {
      return res.status(404).send({ error: "بدون نتیجه" });
    }

    res.send(filtered);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در دریافت تخفیف ها" });
  }
});

// Get /discounts/validate?code=X&amount=Y
app.get("/discounts/validate", async (req, res) => {
  try {
    const { code, amount } = req.query;
    if (!code) return res.status(400).send({ error: "کد تخفیف الزامی است" });

    const result =
      await sql`SELECT * FROM discounts WHERE code = ${code} AND is_active = true AND now() BETWEEN starts_at AND expires_at`;

    const discount = result[0];

    if (!discount)
      return res
        .status(404)
        .send({ valid: false, error: "کد تخفیف نامعتبر یا منقضی است" });

    if (discount.usage_limit && discount.used_count >= discount.usage_limit)
      return res
        .status(400)
        .send({ valid: false, error: "ظرفیت استفاده از کد تخفیف پر شده است" });

    if (
      amount &&
      discount.minimum_order_amount &&
      Number(amount) < discount.minimum_order_amount
    )
      return res.status(400).send({
        valid: false,
        error: `خطا، حداقل میزان خرید: ${discount.minimum_order_amount}`,
      });

    res.send({ valid: true, discount });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در اعتبارسنجی کد تخفیف" });
  }
});

// Get /discounts/:id
app.get("/discounts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sql`SELECT * FROM discounts WHERE id = ${id}`;

    const discount = result[0];

    if (!discount) return res.status(404).send({ error: "کد تخفیف پیدا نشد" });

    res.send(discount);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در دریافت کد تخفیف" });
  }
});

// Post /discounts
app.post("/discounts", async (req, res) => {
  try {
    const {
      code,
      percentage,
      maxDiscountAmount,
      minimumOrderAmount,
      usageLimit,
      startsAt,
      expiresAt,
    } = req.body;

    if (!code || !percentage || !startsAt || !expiresAt) {
      return res.status(400).send({
        error: "کد تخفیف، درصد تخفیف، تاریخ شروع و تاریخ پایان الزامی اند",
      });
    }

    const result =
      await sql`INSERT INTO discounts (code, percentage, max_discount_amount, minimum_order_amount, usage_limit, starts_at, expires_at) VALUES (${code}, ${percentage}, ${maxDiscountAmount || null}, ${minimumOrderAmount || null}, ${usageLimit || null}, ${startsAt}, ${expiresAt}) RETURNING *`;

    res.status(201).send(result[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(400).send({ error: error.message });
  }
});

// Patch /discounts:id - body: is_active
app.patch("/discounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const result =
      await sql`UPDATE discounts SET is_active = ${is_active} WHERE id = ${id} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).send({ error: "تخفیف پیدا نشد" });
    }

    res.send(result[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در بروزرسانی تخفیف" });
  }
});

// Delete /discounts/:id
app.delete("/discounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result =
      await sql`DELETE FROM discounts WHERE id = ${id} RETURNING id`;

    if (result.length === 0)
      return res.status(404).send({ success: false, error: "تخفیف پیدا نشد" });

    res.send({ success: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ success: false, error: "خطا در حذف کد تخفیف" });
  }
});

// Ticket Types

// Get /ticket_types
app.get("/ticket-types", async (req, res) => {
  try {
    const result = await sql`SELECT * FROM ticket_types ORDER BY name`;
    res.send(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در دریافت نوع بلیط" });
  }
});

// Tickets

// GET /tickets - search/filter by: type, origin, destination, departure_date, departure_date_from, departure_date_to, trip_type, price_min, price_max, status, provider_id, seat_class, available_seats_min, sort
app.get("/tickets", async (req, res) => {
  try {
    const {
      type,
      origin,
      destination,
      departure_date,
      departure_date_from,
      departure_date_to,
      trip_type, // oneway or roundtrip
      price_min,
      price_max,
      status, // purchased or cancelled
      provider_id,
      seat_class, // first, business or economy
      available_seats_min,
      sort = "departure_at_asc",
    } = req.query;

    let filtered = await sql`
      SELECT t.*, tt.name AS ticket_type, tp.provider_id, tp.provider_type
      FROM tickets t
      JOIN ticket_types tt ON tt.id = t.type_id
      LEFT JOIN ticket_providers tp ON tp.ticket_id = t.id
    `;
    if (type) {
      filtered = filtered.filter((t) => t.ticket_type === type);
    }

    if (status === "purchased") {
      filtered = filtered.filter((t) => t.status === "purchased");
    }

    if (status === "cancelled") {
      filtered = filtered.filter((t) => t.status === "cancelled");
    }

    if (origin) {
      filtered = filtered.filter((t) =>
        t.origin.toLowerCase().includes(origin.toLowerCase()),
      );
    }

    if (destination) {
      filtered = filtered.filter((t) =>
        t.destination.toLowerCase().includes(destination.toLowerCase()),
      );
    }

    if (departure_date) {
      filtered = filtered.filter(
        (t) =>
          new Date(t.departure_date).getTime() ===
          new Date(departure_date).getTime(),
      );
    }

    if (departure_date_from) {
      filtered = filtered.filter(
        (t) =>
          new Date(t.departure_date).getTime() >=
          new Date(departure_date_from).getTime(),
      );
    }

    if (departure_date_to) {
      filtered = filtered.filter(
        (t) =>
          new Date(t.departure_date).getTime() <=
          new Date(departure_date_to).getTime(),
      );
    }

    if (trip_type === "oneway") {
      filtered = filtered.filter((t) => t.return_date === null);
    }

    if (trip_type === "roundtrip") {
      filtered = filtered.filter((t) => t.return_date !== null);
    }

    if (price_min) {
      filtered = filtered.filter(
        (t) => Number(t.base_price) >= Number(price_min),
      );
    }

    if (price_max) {
      filtered = filtered.filter(
        (t) => Number(t.base_price) <= Number(price_max),
      );
    }

    if (provider_id) {
      filtered = filtered.filter(
        (t) => String(t.provider_id) === String(provider_id),
      );
    }

    if (seat_class) {
      const ticketIdsWithClass = new Set(
        (
          await sql`SELECT DISTINCT ticket_id FROM seats WHERE seat_class = ${seat_class} AND is_available = true`
        ).map((r) => r.ticket_id),
      );
      filtered = filtered.filter((t) => ticketIdsWithClass.has(t.id));
    }

    if (available_seats_min) {
      // NOTE: capacity lives on seats.is_available, not a counter on
      // tickets/bookings, so "available seats" is counted directly from the
      // seats table (one query for all tickets, not one per ticket).
      const availableCounts = await sql`
        SELECT ticket_id, COUNT(*) AS available_seats
        FROM seats
        WHERE is_available = true
        GROUP BY ticket_id
      `;

      const availableByTicketId = new Map(
        availableCounts.map((r) => [r.ticket_id, Number(r.available_seats)]),
      );

      filtered = filtered.filter(
        (t) =>
          (availableByTicketId.get(t.id) || 0) >= Number(available_seats_min),
      );
    }

    const sortFunctions = {
      departure_at_asc: (a, b) =>
        new Date(a.departure_at) - new Date(b.departure_at),
      departure_at_desc: (a, b) =>
        new Date(b.departure_at) - new Date(a.departure_at),
      price_asc: (a, b) => a.base_price - b.base_price,
      price_desc: (a, b) => b.base_price - a.base_price,
    };

    if (filtered.length === 0) {
      return res.status(404).send({ error: "بدون نتیجه" });
    }

    filtered.sort(sortFunctions[sort] || sortFunctions.departure_at_asc);

    res.send(filtered);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در دریافت تیکت ها" });
  }
});

// Get /tickets/:id - query: wantSeats: boolean
app.get("/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let  wantSeats  = req.query.wantSeats === undefined ? null : req.query.wantSeats === 'true';
    if (wantSeats === null ) wantSeats = true

    const result = await sql`
            SELECT t.*, tt.name AS ticket_type, tp.provider_id, tp.provider_type
            FROM tickets t
            JOIN ticket_types tt ON tt.id = t.type_id
            LEFT JOIN ticket_providers tp ON tp.ticket_id = t.id
            WHERE t.id = ${id}
    `;

    if (result.length === 0)
      return res.status(404).send({ error: "تیکت پیدا نشد" });

    if (wantSeats) {
      const seats =
        await sql`SELECT * FROM seats WHERE ticket_id = ${id} ORDER BY seat_number`;
      res.send({ ...result[0], seats });
    }

    res.send({ ...result[0] });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در دریافت تیکت" });
  }
});

// Get /ticket/:id/seats?available=true
app.get("/tickets/:id/seats", async (req, res) => {
  try {
    const { id } = req.params;
    const { available } = req.query;

    let seats =
      await sql`SELECT * FROM seats WHERE ticket_id = ${id} ORDER BY seat_number`;

    if (available !== undefined) {
      seats = seats.filter((s) => String(s.is_available) === available);
    }

    res.send(seats);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در دریافت صندلی ها" });
  }
});

const PROVIDER_META = {
  flight: {
    table: "airlines",
    type: "airline",
  },
  train: {
    table: "train_companies",
    type: "train_company",
  },
  bus: {
    table: "bus_companies",
    type: "bus_company",
  },
  tour: {
    table: "tour_agencies",
    type: "tour_agency",
  },
};

// Post /tickets - creates a ticket, links its provider, optionally seeds seats.
// Body: { type, origin, destination, departure_at, arrival_at, base_price, total_seats, departure_date, return_date, provider_id, seat_layout?:
// const seat_layout = {
//   rows: 30,
//   columns: ["A", "B", "C", "D", "E", "F"],
//   classes: [
//     { class: "first", rows: 2 },
//     { class: "business", rows: 5 },
//     { class: "economy", rows: 23 }
//   ]
// };
app.post("/tickets", async (req, res) => {
  try {
    const {
      type,
      origin,
      destination,
      departure_at,
      arrival_at,
      base_price,
      total_seats,
      departure_date,
      return_date,
      provider_id,
      seat_layout,
    } = req.body;

    const meta = PROVIDER_META[type];
    if (!meta) {
      return res.status(400).send({
        error: "نوع تیکت باید 'پرواز', 'قطار', 'اتوبوس' یا 'تور باشد'",
      });
    }

    if (type === "tour" && !return_date) {
      return res
        .status(400)
        .send({ error: "تور ها باید تاریخ برگشت داشته باشند" });
    }

    if (
      !origin ||
      !destination ||
      !departure_at ||
      !arrival_at ||
      !base_price ||
      !total_seats ||
      !departure_date ||
      !provider_id
    ) {
      return res.status(400).send({ error: "فیلد های الزامی تیکت پر نشدند" });
    }

    const typeRow = await sql`SELECT id FROM ticket_types WHERE name = ${type}`;
    if (typeRow.length === 0) {
      return res.status(400).send({ error: `نوع تیکت ناشناس: ${type}` });
    }
    const typeId = typeRow[0].id;

    const ticketResult = await sql`
      INSERT INTO tickets (type_id, origin, destination, departure_at, arrival_at, base_price, total_seats, departure_date, return_date) VALUES (${typeId},${origin},${destination},${departure_at},${arrival_at},${base_price},${total_seats},${departure_date},${return_date || null}) RETURNING *
    `;
    const ticket = ticketResult[0];

    await sql`INSERT INTO ticket_providers (ticket_id, provider_id, provider_type) VALUES (${ticket.id}, ${provider_id}, ${meta.type})`;

    if (
      seat_layout &&
      typeof seat_layout === "object" &&
      typeof seat_layout.rows === "number" &&
      Array.isArray(seat_layout.columns) &&
      Array.isArray(seat_layout.classes)
    ) {
      const columns = seat_layout.columns;

      let currentRow = 1;

      for (const group of seat_layout.classes) {
        for (let r = 0; r < group.rows; r++) {
          for (const col of columns) {
            const seatNumber = `${currentRow}${col}`;

            await sql`
            INSERT INTO seats (ticket_id, seat_number, seat_class)
            VALUES (${ticket.id}, ${seatNumber}, ${group.class})
          `;
          }

          currentRow++;
        }
      }
    }

    res.status(201).send(ticket);
  } catch (error) {
    console.error("Error:", error);
    res.status(400).send({ error: `خطا در ساخت تیکت\n${error}` });
  }
});

// Patch /tickets/:id - body: base_price, status
app.patch("/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { base_price, status } = req.body;
    const result = await sql`
      UPDATE tickets SET
      base_price = COALESCE(${base_price}, base_price),
      status = COALESCE(${status}, status)
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).send({ error: "تیکت پیدا نشد" });
    }

    res.send(result[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در بروزرسانی تیکت" });
  }
});

// Delete /tickets/:id - deleting via setting status to 'cancelled'
app.delete("/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result =
      await sql`UPDATE tickets SET status = 'cancelled' WHERE id = ${id} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).send({ error: "تیکت پیدا نشد" });
    }

    res.send(result[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در لغو تیکت" });
  }
});

//ADDRESS
// GET /addresses?userId=123
app.get("/addresses", async (request, response) => {
  try {
    const { userId } = request.query;
    if (!userId)
      return response.status(400).send({ error: "آیدی کاربر الزامی است" });
    const result =
      await sql`SELECT * FROM "Address" WHERE "user-id" = ${userId}`;
    response.send(result);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "خطا در دریافت آدرس" });
  }
});
// POST /addresses
app.post("/addresses", async (request, response) => {
  try {
    const { userId, provinceId, cityId, addressDetails, houseNumber } =
      request.body;
    if (!userId || !addressDetails) {
      return response
        .status(400)
        .send({ error: "آیدی کاربر و اطلاعات آدرس الزامی اند" });
    }
    const result =
      await sql`INSERT INTO "Address" ("user-id", "province-id", "city-id", "address-details", "house-number")
            VALUES (${userId}, ${provinceId || null}, ${cityId || null}, ${addressDetails}, ${houseNumber || null})
            RETURNING *
        `;
    response.status(201).send(result[0]);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: error.message });
  }
});
// PATCH /addresses/:id
app.patch("/addresses/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const {
      "user-id": userId,
      "province-id": provinceId,
      "city-id": cityId,
      "address-details": addressDetails,
      "house-number": houseNumber,
    } = request.body;

    const result = await sql`
           UPDATE "Address" SET
                "province-id" = COALESCE(${provinceId ?? null}, "province-id"),
                "city-id" = COALESCE(${cityId ?? null}, "city-id"),
                "address-details" = COALESCE(${addressDetails ?? null}, "address-details"),
                "house-number" = COALESCE(${houseNumber ?? null}, "house-number")
            WHERE id = ${id} AND "user-id" = ${userId}
            RETURNING *
        `;
    if (result.length === 0)
      return response.status(404).send({ error: "آدرس پیدا نشد" });
    response.send(result[0]);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "خطا در بروزرسانی آدرس" });
  }
});
// DELETE /addresses/:id

app.delete("/addresses/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const dbCheck = await sql`SELECT current_database()`;
    console.log(dbCheck);
    const result =
      await sql`  DELETE FROM "Address" WHERE id = ${id}  RETURNING id`;
    if (result.length === 0)
      return response.status(404).send({ error: "آدرس پیدا نشد" });
    response.send({ success: true, deleted: true });
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "خطا در حذف آدرس" });
  }
});

//LOCATIONS
//PROVINCES
// GET /provinces/:id
app.get("/provinces/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const result =
      await sql`SELECT * FROM "Province" WHERE "province-id" = ${id}::integer`;
    if (result.length === 0) {
      return response.status(404).send({ error: "استان پیدا نشد" });
    }
    response.send(result);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "خطا در دریافت استان" });
  }
});

// GET /provinces - filters: has_train, search
app.get("/provinces", async (request, response) => {
  try {
    const { has_train, search } = request.query;
    let filtered = await sql`SELECT * FROM "Province" ORDER BY name`;
    if (has_train !== undefined) {
      const wantTrain = has_train === "true";
      filtered = filtered.filter((p) => p["has-train"] === wantTrain);
    }
    if (search)
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase().trim()),
      );

    if (filtered.length === 0) {
      return res.status(404).send({ error: "بدون نتیجه" });
    }

    response.send(filtered);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "خطا در دریافت استان" });
  }
});
//CITIES
// GET /cities/:id
app.get("/cities/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const result = await sql`SELECT * FROM "City" WHERE id = ${id}`;
    if (result.length === 0) {
      return response.status(404).send({ error: "شهر پیدا نشد" });
    }
    response.send(result);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "خطا در دریافت شهر" });
  }
});

// GET /cities - filters:has_airport,has_train, search
app.get("/cities", async (request, response) => {
  try {
    const { has_airport, has_train, search } = request.query;
    let filtered = await sql`SELECT * FROM "City" ORDER BY name`;

    if (has_train !== undefined) {
      const wantTrain = has_train === "true";
      filtered = filtered.filter((c) => c["has-train"] === wantTrain);
    }

    if (has_airport !== undefined) {
      const wantAirport = has_airport === "true";
      filtered = filtered.filter((c) => c["has-airport"] === wantAirport);
    }

    if (search) {
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase().trim()),
      );
    }

    if (filtered.length === 0) {
      return response.status(404).send({ error: "بدون نتیجه" });
    }

    response.send(filtered);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "خطا در دریافت شهر ها" });
  }
});
//NOTIFICATIONS
// GET /notifications?userId=123
app.get("/notifications", async (request, response) => {
  try {
    const { userId } = request.query;
    if (!userId)
      return response.status(400).send({ error: "آیدی کاربر الزامی است" });
    const result =
      await sql`SELECT * FROM notifications WHERE user_id = ${userId} ORDER BY sent_at DESC`;
    response.send(result);
  } catch (error) {
    response.status(500).send({ error: "خطا در دریافت اعلان ها" });
  }
});
//SUPPORT
// POST /support - body: { name, email, subject, message }

app.post("/support", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).send({ error: "نام، ایمیل و پیام الزامی اند" });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).send({ error: "ایمیل نامعتبر است" });
    }

    await sendEmail({
      to: "tickisupport@gmail.com",
      replyTo: email,
      subject: `[فرم پشتیبانی] ${subject || "بدون موضوع"}`,
      html: `
        <div dir="rtl" style="font-family: Tahoma, sans-serif;">
          <p><strong>نام:</strong> ${name}</p>
          <p><strong>ایمیل:</strong> ${email}</p>
          <p><strong>موضوع:</strong> ${subject || "بدون موضوع"}</p>
          <p><strong>پیام:</strong></p>
          <p>${String(message).replace(/\n/g, "<br/>")}</p>
        </div>
      `,
      text: `نام: ${name}\nایمیل: ${email}\nموضوع: ${subject || "بدون موضوع"}\n\n${message}`,
    });

    res.send({ message: "پیام شما با موفقیت ارسال شد" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "ارسال پیام با خطا مواجه شد" });
  }
});

//BOOKINGS

// GET /bookings - filters: user_id (or userId), status, ticket_id
// NOTE: this was missing before, which meant GET /bookings fell through to the
// generic "/:providerRoute" handler further down and returned
// "خطا، مسیر ارائه دهنده نامعتبر: bookings". Declaring it here (above the
// catch-all provider routes) fixes that.
app.get("/bookings", async (req, res) => {
  try {
    // The frontend sends `user_id` (see bookingApi.getBookings), but this
    // only checked `userId` — since that was always undefined, the filter
    // never ran and every user saw every booking. Accept both spellings.
    const { user_id, userId, status, ticket_id } = req.query;
    const effectiveUserId = user_id ?? userId;

    let filtered = await sql`
      SELECT b.*, t.origin, t.destination, t.departure_at, t.arrival_at
      FROM bookings b
      JOIN tickets t ON t.id = b.ticket_id
      ORDER BY b.booked_at DESC
    `;

    if (effectiveUserId) {
      filtered = filtered.filter(
        (b) => String(b.user_id) === String(effectiveUserId),
      );
    }

    if (status) {
      filtered = filtered.filter((b) => b.status === status);
    }

    if (ticket_id) {
      filtered = filtered.filter(
        (b) => String(b.ticket_id) === String(ticket_id),
      );
    }

    if (filtered.length === 0) {
      return res.status(404).send({ error: "بدون نتیجه" });
    }

    res.send(filtered);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "خطا در دریافت رزرو ها" });
  }
});

// POST /bookings
// Body: { userId, ticket_id, seat_ids: [...], passengers: [{first_name,last_name,phone_number?}] }
// `passengers` is REQUIRED and must have one entry per seat_id, in the same
// order — booking_seats.passenger_first_name/passenger_last_name are NOT NULL
// in the schema, so there's no valid "anonymous seat" to insert.
//
// NOTE ON APPROACH: `sql` here comes from neon()'s HTTP driver, which has no
// real session/connection to hold BEGIN/COMMIT/FOR UPDATE across statements
// (that's what sql.connect()/Pool is for, and it isn't what neon() gives you).
// So instead of a real transaction, each write is made atomic on its own via
// a conditional `UPDATE ... WHERE ... RETURNING`, and if a later step fails
// we manually undo ("compensate") the earlier steps.
//
// NOTE ON SCHEMA: `tickets` has no `available_seats` column — capacity is
// tracked per-seat via `seats.is_available`. So there's no ticket-level
// counter to keep in sync; the atomic seat UPDATE below is both the
// concurrency guard and the "are there enough seats?" check in one step.
app.post("/bookings", async (req, res) => {
  const { userId, ticket_id, seat_ids, passengers } = req.body;

  if (
    !userId ||
    !ticket_id ||
    !Array.isArray(seat_ids) ||
    seat_ids.length === 0
  ) {
    return res.status(400).send({ error: "ورودی نامعتبر" });
  }

  if (
    !Array.isArray(passengers) ||
    passengers.length !== seat_ids.length ||
    passengers.some((p) => !p || !p.first_name || !p.last_name)
  ) {
    return res.status(400).send({
      error: "برای هر صندلی، نام و نام خانوادگی مسافر الزامی است",
    });
  }

  let seatsFlipped = false;
  let seatsFlippedIds = [];
  let bookingId = null;

  try {
    // Step 1: make sure the ticket exists, and confirm the requested seats
    // actually belong to it before touching anything.
    const ticketResult =
      await sql`SELECT * FROM tickets WHERE id = ${ticket_id}`;
    const ticket = ticketResult[0];

    if (!ticket) {
      return res.status(404).send({ error: "تیکت پیدا نشد" });
    }

    const requestedSeats = await sql`
      SELECT * FROM seats WHERE id = ANY(${seat_ids}) AND ticket_id = ${ticket_id}
    `;

    if (requestedSeats.length !== seat_ids.length) {
      return res.status(400).send({ error: "صندلی های نامعتبر" });
    }

    // Step 2: atomically flip only the seats that are still available.
    // The WHERE is_available = true guard means two simultaneous bookings
    // can never both "win" the same seat, even without a session-level lock.
    const flipped = await sql`
      UPDATE seats
      SET is_available = false
      WHERE id = ANY(${seat_ids}) AND ticket_id = ${ticket_id} AND is_available = true
      RETURNING id
    `;

    seatsFlippedIds = flipped.map((s) => s.id);
    seatsFlipped = seatsFlippedIds.length > 0;

    if (flipped.length !== seat_ids.length) {
      // Someone else grabbed one or more of these seats first (or they were
      // never available). Undo the ones we did manage to flip, then report
      // the conflict.
      if (seatsFlipped) {
        await sql`UPDATE seats SET is_available = true WHERE id = ANY(${seatsFlippedIds})`;
        seatsFlipped = false;
      }
      return res.status(409).send({ error: "صندلی ها از قبل رزرو شده اند" });
    }

    // Step 3: create the booking.
    const totalAmount = Number(ticket.base_price) * seat_ids.length;
    const bookingResult = await sql`
      INSERT INTO bookings (user_id, ticket_id, total_amount, number_of_seats, status)
      VALUES (${userId}, ${ticket_id}, ${totalAmount}, ${seat_ids.length}, 'booked')
      RETURNING *
    `;
    const booking = bookingResult[0];
    bookingId = booking.id;

    // Step 4: link seats + required passenger info to the booking.
    for (let i = 0; i < seat_ids.length; i++) {
      const passenger = passengers[i];
      await sql`
        INSERT INTO booking_seats (booking_id, seat_id, passenger_first_name, passenger_last_name, phone_number)
        VALUES (
          ${booking.id},
          ${seat_ids[i]},
          ${passenger.first_name},
          ${passenger.last_name},
          ${passenger.phone_number || null}
        )
      `;
    }

    return res.status(201).send(booking);
  } catch (err) {
    console.error(err);

    // Best-effort compensation: undo whatever succeeded before the failure.
    try {
      if (bookingId) {
        await sql`DELETE FROM booking_seats WHERE booking_id = ${bookingId}`;
        await sql`DELETE FROM bookings WHERE id = ${bookingId}`;
      }
      if (seatsFlipped) {
        await sql`UPDATE seats SET is_available = true WHERE id = ANY(${seatsFlippedIds})`;
      }
    } catch (cleanupErr) {
      console.error("Cleanup after failed booking also failed:", cleanupErr);
    }

    return res.status(500).send({ error: "رزرو ناموفقیت آمیز" });
  }
});

// GET /bookings/:id
app.get("/bookings/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const result = await sql`
            SELECT b.*, t.origin, t.destination, t.departure_at, t.arrival_at
            FROM bookings b JOIN tickets t ON t.id = b.ticket_id
            WHERE b.id = ${id}
        `;
    const booking = result[0];
    if (!booking) return response.status(404).send({ error: "رزرو پیدا نشد" });

    const seats = await sql`
            SELECT bs.*, s.seat_number, s.seat_class
            FROM booking_seats bs JOIN seats s ON s.id = bs.seat_id
            WHERE bs.booking_id = ${booking.id}
        `;
    response.send({ ...booking, seats });
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "خطا در دریافت رزرو" });
  }
});

// PATCH /bookings/:id/cancel
//
// Same approach as POST /bookings above: no sql.connect()/client/BEGIN, just
// plain `sql` calls. The first UPDATE is guarded with
// `WHERE status != 'cancelled'` so two simultaneous cancel requests can't
// both "succeed" and double-release seats; if anything after that fails, we
// compensate by re-marking the booking as cancelled was already done, so we
// simply retry-safe re-run the remaining release steps rather than reverting
// the cancellation (a booking that's cancelled should stay cancelled).
app.patch("/bookings/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Atomically claim the cancellation: only succeeds if it wasn't already cancelled.
    const cancelResult = await sql`
      UPDATE bookings
      SET status = 'cancelled',
          cancellation_reason = ${reason || "Cancelled"},
          updated_at = now()
      WHERE id = ${id} AND status != 'cancelled'
      RETURNING *
    `;

    if (cancelResult.length === 0) {
      // Either the booking doesn't exist, or it was already cancelled.
      const existing =
        await sql`SELECT id, status FROM bookings WHERE id = ${id}`;
      if (existing.length === 0) {
        return res.status(404).send({ error: "رزرو پیدا نشد" });
      }
      return res.status(400).send({ error: "این رزرو قبلا لغو شده است" });
    }

    const booking = cancelResult[0];

    // Release the seats. NOTE: there's no tickets.available_seats column in
    // this schema — capacity is derived from seats.is_available, so this
    // single UPDATE is all that's needed to free the booking's seats back up.
    await sql`
      UPDATE seats
      SET is_available = true
      WHERE id IN (
        SELECT seat_id FROM booking_seats WHERE booking_id = ${id}
      )
    `;

    await sql`
      INSERT INTO notifications (booking_id, user_id, type, content)
      VALUES (${booking.id}, ${booking.user_id}, 'cancellation', ${reason || "Cancelled"})
    `;

    const userInfo =
      await sql`SELECT email, username FROM "Users" WHERE id = ${booking.user_id}`;

    const user = userInfo[0];

    if (user?.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: "Booking Cancelled",
          html: `<p>Hi ${user.username}, your booking was cancelled.</p>`,
        });
      } catch (err) {
        console.log(err);
      }
    }

    res.send({ message: "رزرو لغو شد" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "لغو کردن رزرو با شکست مواجه شد" });
  }
});
//PROVIDERS
function getFromProviderTable(route, response) {
  const table = PROVIDER_TABLES[route];
  if (!table) {
    response
      .status(400)
      .send({ error: `خطا، مسیر ارائه دهنده نامعتبر: ${route}` });
    return null;
  }
  return table;
}
// GET /:providerRoute - filters: is_active, search
app.get("/:providerRoute", async (request, response) => {
  try {
    const table = getFromProviderTable(request.params.providerRoute, response);
    if (!table) return;
    const { is_active, search } = request.query;
    let filtered = await sql`SELECT * FROM ${sql.unsafe(table)} ORDER BY name`;
    if (is_active !== undefined) {
      const want = is_active === "true";
      filtered = filtered.filter((p) => p.is_active === want);
    }
    if (search)
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase().trim()),
      );

    if (filtered.length === 0) {
      return res.status(404).send({ error: "بدون نتیجه" });
    }

    response.send(filtered);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "خطا در دریافت ارائه دهندگان" });
  }
});

app.get("/:providerRoute/:id", async (request, response) => {
  try {
    const table = getFromProviderTable(request.params.providerRoute, response);
    if (!table) return;
    const result =
      await sql`SELECT * FROM ${sql.unsafe(table)} WHERE id = ${request.params.id}`;
    if (result.length === 0)
      return response.status(404).send({ error: "چیزی پیدا نشد" });
    response.send(result[0]);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "خطا در دریافت ارائه دهندگان" });
  }
});

app.post("/:providerRoute", async (request, response) => {
  try {
    const table = getFromProviderTable(request.params.providerRoute, response);
    if (!table) return;
    const { name, contactEmail, contactPhone, isActive = true } = request.body;
    if (!name) return response.status(400).send({ error: "اسم الزامی است" });
    const result = await sql`
            INSERT INTO ${sql.unsafe(table)} (name, contact_email, contact_phone, is_active)
            VALUES (${name}, ${contactEmail || null}, ${contactPhone || null}, ${isActive})
            RETURNING *
        `;
    response.status(201).send(result[0]);
  } catch (error) {
    console.error("Error:", error);
    response.status(400).send({ error: error.message });
  }
});

app.patch("/:providerRoute/:id", async (request, response) => {
  try {
    const table = getFromProviderTable(request.params.providerRoute, response);
    if (!table) return;
    const { name, contactEmail, contactPhone, isActive } = request.body;
    const result = await sql`
            UPDATE ${sql.unsafe(table)} SET
                name = COALESCE(${name}, name),
                contact_email = COALESCE(${contactEmail}, contact_email),
                contact_phone = COALESCE(${contactPhone}, contact_phone),
                is_active = COALESCE(${isActive}, is_active)
            WHERE id = ${request.params.id}
            RETURNING *
        `;
    if (result.length === 0)
      return response.status(404).send({ error: "چیزی پیدا نشد" });
    response.send(result[0]);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "خطا در بروزرسانی ارائه دهنده" });
  }
});

app.delete("/:providerRoute/:id", async (request, response) => {
  try {
    const table = getFromProviderTable(request.params.providerRoute, response);
    if (!table) return;
    const result = await sql`
            UPDATE ${sql.unsafe(table)} SET is_active = false WHERE id = ${request.params.id}
            RETURNING *
        `;
    if (result.length === 0)
      return response.status(404).send({ error: "چیزی پیدا نشد" });
    response.send({ success: true, deactivated: true, provider: result[0] });
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "خطا در غیرفعال سازی ارائه دهنده" });
  }
});
