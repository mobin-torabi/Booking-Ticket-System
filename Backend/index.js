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

app.listen(PORT, () =>
  console.log(` My App listening at http://localhost:${PORT}`),
);
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

    if (active === "true") filtered = filtered.filter((d) => d.is_active === true);
    if (active === "false") filtered = filtered.filter((d) => d.is_active === false);

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
// DELETE /addresses/:id?userId=123

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



// GET /cities - filters:has_airport,has_train, search
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

// GET /:providerRoute - filters: is_active, search
app.get('/:providerRoute', async (request, response) => {
    try {
        const table = getFromProviderTable(request.params.providerRoute, response);
        if (!table) return;
        const { is_active, search } = request.query;
        let filtered = await sql`SELECT * FROM ${sql.unsafe(table)} ORDER BY name`;
        if (is_active !== undefined) {
            const want = is_active === 'true';
            filtered = filtered.filter((p) => p.is_active === want);
        }
        if (search) filtered = filtered.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
        response.send(filtered);
    } catch (error) {
        console.error(error);
        response.status(500).send({ error: 'Error fetching providers' });
    }
});

app.get('/:providerRoute/:id', async (request, response) => {
    try {
        const table = getFromProviderTable(request.params.providerRoute, response);
        if (!table) return;
        const result = await sql`SELECT * FROM ${sql.unsafe(table)} WHERE id = ${request.params.id}`;
        if (result.length === 0) return response.status(404).send({ error: 'Not found' });
        response.send(result[0]);
    } catch (error) {
        console.error(error);
        response.status(500).send({ error: 'Error fetching provider' });
    }
});

app.post('/:providerRoute', async (request, response) => {
    try {
        const table = getFromProviderTable(request.params.providerRoute, response);
        if (!table) return;
        const { name, contactEmail, contactPhone, isActive = true } = request.body;
        if (!name) return response.status(400).send({ error: 'name is required' });
        const result = await sql`
            INSERT INTO ${sql.unsafe(table)} (name, contact_email, contact_phone, is_active)
            VALUES (${name}, ${contactEmail || null}, ${contactPhone || null}, ${isActive})
            RETURNING *
        `;
        response.status(201).send(result[0]);
    } catch (error) {
        console.error('Error:', error);
        response.status(400).send({ error: error.message });
    }
});

app.patch('/:providerRoute/:id', async (request, response) => {
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
        if (result.length === 0) return response.status(404).send({ error: 'Not found' });
        response.send(result[0]);
    } catch (error) {
        console.error(error);
        response.status(500).send({ error: 'Error updating provider' });
    }
});

app.delete('/:providerRoute/:id', async (request, response) => {
    try {
        const table = getFromProviderTable(request.params.providerRoute, response);
        if (!table) return;
        const result = await sql`
            UPDATE ${sql.unsafe(table)} SET is_active = false WHERE id = ${request.params.id}
            RETURNING *
        `;
        if (result.length === 0) return response.status(404).send({ error: 'Not found' });
        response.send({ success: true, deactivated: true, provider: result[0] });
    } catch (error) {
        console.error(error);
        response.status(500).send({ error: 'Error deactivating provider' });
    }
});
}

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