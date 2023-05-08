const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const nodemailer = require("nodemailer");
require("dotenv").config();
const mg = require("nodemailer-mailgun-transport");

app.use(express.json());
app.use(cors());

const uri = process.env.URL;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
//Email
function sendBookingEmail(booking) {
  const { email, treatment } = booking;
  // This is your API key that you retrieve from www.mailgun.com/cp (free up to 10K monthly emails)
  const auth = {
    auth: {
      api_key: process.env.EMAIL_SEND_KEY,
      domain: process.env.EMAIL_SEND_DOMAIN,
    },
  };

  const transporter = nodemailer.createTransport(mg(auth));

  transporter.sendMail(
    {
      from: "developertanbir@gmail.com", // verified sender email
      to: email, // recipient email
      subject: `Your appointment for ${treatment} confirmed`, // Subject line
      text: "Hello world!", // plain text body
      html: `
            <h2>Your Appointment is Confirmed</h2>
            <div>
                <p>Your appointment for ${treatment} confirmed</p>
            </div>
            <p>Thanks for booking</p>
        `, // html body
    },
    function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    }
  );
}
const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send("unauthorized access");
    }
    req.decoded = decoded;
    next();
  });
};

const usersCollection = client.db("doctorPortal").collection("users");
const appointmentOptionsCollection = client
  .db("doctorPortal")
  .collection("appointmentOptions");
const bookingsCollection = client.db("doctorPortal").collection("bookings");
const doctorsCollection = client.db("doctorPortal").collection("doctors");
const paymentsCollection = client.db('doctorsPortal').collection('payments');
const stripe = require("stripe")(process.env.STRIPE_SECRET);

app.post('/create-payment-intent', async (req, res) => {
  const booking = req.body;
  const price = booking.price;
  const amount = price * 100;

  const paymentIntent = await stripe.paymentIntents.create({
      currency: 'usd',
      amount: amount,
      "payment_method_types": [
          "card"
      ]
  });
  res.send({
      clientSecret: paymentIntent.client_secret,
  });
});

app.post('/payments', async (req, res) => {
  const payment = req.body;
  const result = await paymentsCollection.insertOne(payment);
  const id = payment.bookingId
  const filter = { _id: ObjectId(id) }
  const updatedDoc = {
      $set: {
          paid: true,
          transactionId: payment.transactionId
      }
  }
  const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
  res.send(result);
})


// Make sure you use verifyAdmin after jwt
const verifyAdmin = async (req, res, next) => {
  const decodedEmail = req.decoded.email;
  const query = { email: decodedEmail };
  const user = await usersCollection.findOne(query);
  if (user?.role !== "admin") {
    return res.status(403).send({ message: "Forbidden Access" });
  }

  next();
};
async function run() {
  try {
    await client.connect();

    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );

      const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });

      res.send({ result, token });
    });
  } finally {
  }
}
run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("success");
});
// Create User
app.post("/users", async (req, res) => {
  const query = req.body;
  const result = await usersCollection.insertOne(query);
  res.send(result);
});

// Get All User
app.get("/users", async (req, res) => {
  const query = {};
  const result = await usersCollection.find(query).toArray();
  res.send(result);
});

// User Admin
app.put("/users/admin/:id", verifyJwt, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const filter = { _id: ObjectId(id) };
  const option = { upsert: true };
  const updateDoc = {
    $set: {
      role: "admin",
    },
  };
  const result = await usersCollection.updateOne(filter, updateDoc, option);
  res.send(result);
});

// Get Admin
app.get("/users/admin/:email", verifyJwt, verifyAdmin, async (req, res) => {
  const email = req.params.email;
  const query = { email };
  const user = await usersCollection.findOne(query);
  res.send({ isAdmin: user?.role === "admin" });
});
app.get("/appointmentSpecialty", verifyJwt, verifyAdmin, async (req, res) => {
  const query = {};
  const result = await appointmentOptionsCollection
    .find(query)
    .project({ name: 1, _id: 0 })
    .toArray();
  res.send(result);
});

// all treatment data
app.get("/appointmentOptions", async (req, res) => {
  const query = {};
  const options = await appointmentOptionsCollection.find(query).toArray();
  const date = req.query.date;
  const bookingQuery = { appointmentDate: date };
  const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();

  options.forEach((option) => {
    const optionBooked = alreadyBooked.filter(
      (book) => book.treatment === option.name
    );
    const bookedSlots = optionBooked.map((book) => book.slot);
    const remainingSlots = option.slots.filter(
      (slot) => !bookedSlots.includes(slot)
    );
    option.slots = remainingSlots;
  });
  res.send(options);
});

// Create Booking
app.post("/bookings", async (req, res) => {
  const booking = req.body;
  const query = {
    appointmentDate: booking.appointmentDate,
    treatment: booking.treatment,
    email: booking.email,
  };
  const alreadyBooked = await bookingsCollection.find(query).toArray();
  if (alreadyBooked.length) {
    const message = `You already have a booking on ${booking.appointmentDate}`;
    res.send({ acknowledge: false, message });
    return;
  }
  const result = await bookingsCollection.insertOne(booking);
  // Send Booking About Email Confirmation
  sendBookingEmail(booking);
  res.send(result);
});

// Get Booking Data by id
app.get("/booking/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await bookingsCollection.findOne(filter);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// Get booking data by mail
app.get("/booking", async (req, res) => {
  const email = req.query.email;
  const query = { email: email };
  const result = await bookingsCollection.find(query).toArray();
  res.send(result);
});

//Doctor
app.get("/doctors", verifyJwt, verifyAdmin, async (req, res) => {
  const query = {};
  const doctors = await doctorsCollection.find(query).toArray();
  res.send(doctors);
});
app.post("/doctors", verifyJwt, verifyAdmin, async (req, res) => {
  const doctor = req.body;
  const result = await doctorsCollection.insertOne(doctor);
  res.send(result);
});
app.delete("/doctors/:id", verifyJwt, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const filter = { _id: ObjectId(id) };
  const result = await doctorsCollection.deleteOne(filter);
  res.send(result);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("server running on port ", PORT);
});
