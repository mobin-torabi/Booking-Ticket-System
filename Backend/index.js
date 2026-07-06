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
console.log(process.env.DATABASE_URL);
const sql = neon(DATABASE_URL);

const cors = require("cors");
app.use(cors());
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
        return res.status(400).send({
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

    res.send(filtered);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "Error fetching discounts" });
  }
});

// Get /discounts/validate?code=X&amount=Y
app.get("/discounts/validate", async (req, res) => {
  try {
    const { code, amount } = req.query;
    if (!code) return res.status(400).send({ error: "code is required" });

    const result =
      await sql`SELECT * FROM discounts WHERE code = ${code} AND is_active = true AND now() BETWEEN starts_at AND expires_at`;

    const discount = result[0];

    if (!discount)
      return res
        .status(404)
        .send({ valid: false, error: "Invalid or expired code" });

    if (discount.usage_limit && discount.used_count >= discount.usage_limit)
      return res
        .status(400)
        .send({ valid: false, error: "Usage limit reached" });

    if (
      amount &&
      discount.minimum_order_amount &&
      Number(amount) < discount.minimum_order_amount
    )
      return res.status(400).send({
        valid: false,
        error: `Minimum order amount is ${discount.minimum_order_amount}`,
      });

    res.send({ valid: true, discount });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "Error validating discount" });
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
        error: "code, percentage, startsAt and expiresAt are required",
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
      return res.status(404).send({ error: "Discount NOT found" });
    }

    res.send(result[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "Error updating discount" });
  }
});

// Delete /discounts/:id
app.delete("/discounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result =
      await sql`DELETE FROM discounts WHERE id = ${id} RETURNING id`;

    if (result.length === 0)
      return res
        .status(404)
        .send({ success: false, error: "Discount NOT found" });

    res.send({ success: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ success: false, error: "Error deleting discount" });
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
    res.status(500).send({ error: "Error fetching ticket types" });
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
      const result = [];

      for (const t of filtered) {
        const availableSeats = await sql`
          SELECT
            t.id,
            (t.total_seats - COALESCE(SUM(b.number_of_seats), 0)) AS available_seats
          FROM tickets t
          LEFT JOIN bookings b
            ON b.ticket_id = t.id
            AND b.status != 'cancelled'
          WHERE t.id = ${t.id}
          GROUP BY t.id;
        `;

        if (
          Number(availableSeats[0].available_seats) >=
          Number(available_seats_min)
        ) {
          result.push(t);
        }
      }

      filtered = result;
    }

    const sortFunctions = {
      departure_at_asc: (a, b) =>
        new Date(a.departure_at) - new Date(b.departure_at),
      departure_at_desc: (a, b) =>
        new Date(b.departure_at) - new Date(a.departure_at),
      price_asc: (a, b) => a.base_price - b.base_price,
      price_desc: (a, b) => b.base_price - a.base_price,
    };

    filtered.sort(sortFunctions[sort] || sortFunctions.departure_at_asc);

    res.send(filtered);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "Error fetching tickets" });
  }
});

// Get /tickets/:id
app.get("/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sql`
            SELECT t.*, tt.name AS ticket_type, tp.provider_id, tp.provider_type
            FROM tickets t
            JOIN ticket_types tt ON tt.id = t.type_id
            LEFT JOIN ticket_providers tp ON tp.ticket_id = t.id
            WHERE t.id = ${id}
    `;

    if (result.length === 0)
      return res.status(404).send({ error: "Ticket NOT found" });

    const seats =
      await sql`SELECT * FROM seats WHERE ticket_id = ${id} ORDER BY seat_number`;

    res.send({ ...result[0], seats });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "Error fetching ticket" });
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
    res.status(500).send({ error: "Error fetching seats" });
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
      return res
        .status(400)
        .send({ error: "Type must be 'flight', 'train', 'bus' or 'tour'" });
    }

    if (type === "tour" && !return_date) {
      return res.status(400).send({ error: "Tours must have a return date" });
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
      return res.status(400).send({ error: "Missing required ticket fields" });
    }

    const typeRow = await sql`SELECT id FROM ticket_types WHERE name = ${type}`;
    if (typeRow.length === 0) {
      return res.status(400).send({ error: `Unknown ticket type ${type}` });
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
    res.status(400).send({ error: `Error creating ticket\n${error}` });
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
      return res.status(404).send({ error: "Ticket NOT found" });
    }

    res.send(result[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "Error updating ticket" });
  }
});

// Delete /tickets/:id - deleting via setting status to 'cancelled'
app.delete("/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result =
      await sql`UPDATE tickets SET status = 'cancelled' WHERE id = ${id} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).send({ error: "Ticket NOT found" });
    }

    res.send(result[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "Error cancelling ticket" });
  }
});

//ADDRESS
// GET /addresses?userId=123
app.get("/addresses", async (request, response) => {
  try {
    const { userId } = request.query;
    if (!userId)
      return response
        .status(400)
        .send({ error: "userId query param is required" });
    const result =
      await sql`SELECT * FROM "Address" WHERE "user-id" = ${userId}`;
    response.send(result);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "Error fetching addresses" });
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
        .send({ error: "User Id and Address details are required" });
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
      return response.status(404).send({ error: "Address not found" });
    response.send(result[0]);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "Error updating address" });
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
      return response.status(404).send({ error: "Address Not Found" });
    response.send({ success: true, deleted: true });
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "Error deleting address" });
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
      return response.status(404).send({ error: "Province Not Found" });
    }
    response.send(result);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "Error fetching province" });
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
        p.name.toLowerCase().includes(search.toLowerCase()),
      );
    response.send(filtered);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "Error fetching provinces" });
  }
});
//CITIES
// GET /cities/:id
app.get("/cities/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const result = await sql`SELECT * FROM "City" WHERE id = ${id}`;
    if (result.length === 0) {
      return response.status(404).send({ error: "City Not Found" });
    }
    response.send(result);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "Error fetching City" });
  }
});

// GET /cities - filters:province_name,has_airport,has_train, search
app.get("/cities", async (request, response) => {
  try {
    const { province_name, has_airport, has_train, search } = request.query;
    let filtered = await sql`SELECT * FROM "City" ORDER BY name`;

    if (province_name) {
      const provinceResult =
        await sql`SELECT "province-id" FROM "Province" WHERE name = ${province_name}`;

      if (provinceResult.length === 0) {
        return response.status(404).send({ error: "Province not found" });
      }

      const provinceId = provinceResult[0]["province-id"];
      filtered = filtered.filter((c) => c["province-id"] === provinceId);
    }

    if (has_train !== undefined) {
      const wantTrain = has_train === "true";
      filtered = filtered.filter((c) => c["has-train"] === wantTrain);
    }

    if (has_airport !== undefined) {
      const wantAirport = has_airport === "true";
      filtered = filtered.filter((c) => c["has-airport"] === wantAirport); // fixed key
    }

    if (search) {
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    response.send(filtered);
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "Error fetching cities" });
  }
});
//PROVIDERS
function getFromProviderTable(route, response) {
  const table = PROVIDER_TABLES[route];
  if (!table) {
    response.status(400).send({ error: `Invalid provider route: ${route}` });
    return null;
  }
  return table;
}
  // GET /:providerRoute - filters: is_active, search
  app.get("/:providerRoute", async (request, response) => {
    try {
      const table = getFromProviderTable(
        request.params.providerRoute,
        response,
      );
      if (!table) return;
      const { is_active, search } = request.query;
      let filtered =
        await sql`SELECT * FROM ${sql.unsafe(table)} ORDER BY name`;
      if (is_active !== undefined) {
        const want = is_active === "true";
        filtered = filtered.filter((p) => p.is_active === want);
      }
      if (search)
        filtered = filtered.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase()),
        );
      response.send(filtered);
    } catch (error) {
      console.error(error);
      response.status(500).send({ error: "Error fetching providers" });
    }
  });

  app.get("/:providerRoute/:id", async (request, response) => {
    try {
      const table = getFromProviderTable(
        request.params.providerRoute,
        response,
      );
      if (!table) return;
      const result =
        await sql`SELECT * FROM ${sql.unsafe(table)} WHERE id = ${request.params.id}`;
      if (result.length === 0)
        return response.status(404).send({ error: "Not found" });
      response.send(result[0]);
    } catch (error) {
      console.error(error);
      response.status(500).send({ error: "Error fetching provider" });
    }
  });

  app.post("/:providerRoute", async (request, response) => {
    try {
      const table = getFromProviderTable(
        request.params.providerRoute,
        response,
      );
      if (!table) return;
      const {
        name,
        contactEmail,
        contactPhone,
        isActive = true,
      } = request.body;
      if (!name)
        return response.status(400).send({ error: "name is required" });
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
      const table = getFromProviderTable(
        request.params.providerRoute,
        response,
      );
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
        return response.status(404).send({ error: "Not found" });
      response.send(result[0]);
    } catch (error) {
      console.error(error);
      response.status(500).send({ error: "Error updating provider" });
    }
  });

  app.delete("/:providerRoute/:id", async (request, response) => {
    try {
      const table = getFromProviderTable(
        request.params.providerRoute,
        response,
      );
      if (!table) return;
      const result = await sql`
            UPDATE ${sql.unsafe(table)} SET is_active = false WHERE id = ${request.params.id}
            RETURNING *
        `;
      if (result.length === 0)
        return response.status(404).send({ error: "Not found" });
      response.send({ success: true, deactivated: true, provider: result[0] });
    } catch (error) {
      console.error(error);
      response.status(500).send({ error: "Error deactivating provider" });
    }
  });

//BOOKINGS
// POST /bookings
// Body: { userId, ticket_id, seat_ids: [...], passengers?: [{first_name,last_name,phone_number}] }
app.post("/bookings", async (req, res) => {
  const client = await sql.connect();

  try {
    await client`BEGIN`;

    const { userId, ticket_id, seat_ids, passengers } = req.body;

    if (!userId || !ticket_id || !Array.isArray(seat_ids) || seat_ids.length === 0) {
      return res.status(400).send({ error: "Invalid input" });
    }

    const ticketResult = await client`
      SELECT * FROM tickets
      WHERE id = ${ticket_id}
      FOR UPDATE
    `;

    const ticket = ticketResult[0];

    if (!ticket) {
      await client`ROLLBACK`;
      return res.status(404).send({ error: "Ticket not found" });
    }

    const bookedResult = await client`
      SELECT COALESCE(SUM(number_of_seats), 0) AS booked
      FROM bookings
      WHERE ticket_id = ${ticket_id} AND status != 'cancelled'
    `;

    const bookedSeats = Number(bookedResult[0].booked || 0);
    const availableSeats = ticket.capacity - bookedSeats;

    if (availableSeats < seat_ids.length) {
      await client`ROLLBACK`;
      return res.status(400).send({ error: "Not enough seats available" });
    }

    const seats = await client`
      SELECT * FROM seats
      WHERE id = ANY(${seat_ids}) AND ticket_id = ${ticket_id}
      FOR UPDATE
    `;

    if (seats.length !== seat_ids.length) {
      await client`ROLLBACK`;
      return res.status(400).send({ error: "Invalid seats" });
    }

    if (seats.some(s => !s.is_available)) {
      await client`ROLLBACK`;
      return res.status(409).send({ error: "Seats already booked" });
    }

    const totalAmount = Number(ticket.base_price) * seat_ids.length;

    const bookingResult = await client`
      INSERT INTO bookings (user_id, ticket_id, total_amount, number_of_seats, status)
      VALUES (${userId}, ${ticket_id}, ${totalAmount}, ${seat_ids.length}, 'booked')
      RETURNING *
    `;

    const booking = bookingResult[0];

    await client`
      UPDATE seats
      SET is_available = false
      WHERE id = ANY(${seat_ids})
    `;

    await client`COMMIT`;

    const userInfo =
      await sql`SELECT email, username FROM "Users" WHERE id = ${userId}`;

    const user = userInfo[0];

    if (user?.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: "Booking Confirmed",
          html: `
            <p>Hi ${user.username},</p>
            <p>Your booking (ID: ${booking.id}) has been confirmed.</p>
            <p>Total amount: ${totalAmount}</p>
          `,
        });
      } catch (err) {
        console.error("Email failed:", err);
      }
    }

    return res.status(201).send(booking);

  } catch (err) {
    await client`ROLLBACK`;
    console.error(err);
    return res.status(500).send({ error: "Booking failed" });

  } finally {
    client.release?.();
  }
});

// GET /bookings - filters: status, user_id, ticket_type, date_from, date_to
app.get("/bookings", async (request, response) => {
  try {
    const { status, user_id, ticket_type, date_from, date_to } = request.query;
    let filtered = await sql`
            SELECT b.*, tt.name AS ticket_type, u.username
            FROM bookings b
            JOIN tickets t ON t.id = b.ticket_id
            JOIN ticket_types tt ON tt.id = t.type_id
            JOIN "Users" u ON u.id = b.user_id
            ORDER BY b.booked_at DESC
        `;

    if (status) filtered = filtered.filter((b) => b.status === status);
    if (user_id)
      filtered = filtered.filter((b) => String(b.user_id) === String(user_id));
    if (ticket_type)
      filtered = filtered.filter((b) => b.ticket_type === ticket_type);
    if (date_from)
      filtered = filtered.filter(
        (b) => new Date(b.booked_at) >= new Date(date_from),
      );
    if (date_to)
      filtered = filtered.filter(
        (b) => new Date(b.booked_at) <= new Date(date_to),
      );

    response.send(filtered);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    response
      .status(500)
      .send({ error: "An error occurred while fetching bookings." });
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
    if (!booking)
      return response.status(404).send({ error: "Booking not found" });

    const seats = await sql`
            SELECT bs.*, s.seat_number, s.seat_class
            FROM booking_seats bs JOIN seats s ON s.id = bs.seat_id
            WHERE bs.booking_id = ${booking.id}
        `;
    response.send({ ...booking, seats });
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "Error fetching booking" });
  }
});

// PATCH /bookings/:id/cancel
app.patch("/bookings/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const bookingResult = await sql`
      SELECT * FROM bookings WHERE id = ${id}
    `;

    const booking = bookingResult[0];

    if (!booking) {
      return res.status(404).send({ error: "Booking not found" });
    }

    await sql`
      UPDATE bookings
      SET status = 'cancelled',
          cancellation_reason = ${reason || "Cancelled"},
          updated_at = now()
      WHERE id = ${id}
    `;

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
  console.log(err);      }
    }

    res.send({ message: "Booking cancelled" });

  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Cancel failed" });
  }
});
//NOTIFICATIONS
// GET /notifications?userId=123
app.get('/notifications', async (request, response) => {
    try {
        const { userId } = request.query;
        if (!userId) return response.status(400).send({ error: 'userId query param is required' });
        const result = await sql`SELECT * FROM notifications WHERE user_id = ${userId} ORDER BY sent_at DESC`;
        response.send(result);
    } catch (error) {
        console.error(error);
        response.status(500).send({ error: 'Error fetching notifications' });
    }
});

app.post("/test-email", async (req, res) => {
  console.log("STEP 1: route hit");

  try {
    console.log("STEP 2: before sendEmail");

    const result = await sendEmail({
      to: "aylinamjad@gmail.com",
      subject: "Test Email",
      text: "SMTP test"
    });

    console.log("STEP 3: after sendEmail", result);

    return res.send({ ok: true });

  } catch (err) {
    console.log("🔥 EMAIL ERROR:", err);
    return res.status(500).send({ error: "email failed" });
  }
});
app.listen(PORT, () =>
  console.log(` My App listening at http://localhost:${PORT}`),
);