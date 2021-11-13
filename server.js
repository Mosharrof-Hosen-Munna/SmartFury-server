const { MongoClient } = require("mongodb");
const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;

const PORT = process.env.PORT || 5000;
// MIDDLEWARE
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@project.wytfk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const run = async () => {
  try {
    await client.connect();
    const database = client.db("SmartFury");
    const usersCollection = database.collection("users");
    const productsCollection = database.collection("products");
    const ordersCollection = database.collection("orders");
    const reviewsCollection = database.collection("reviews");

    // Get Api

    // find all products
    app.get("/api/products", async (req, res) => {
      const filter = req.query.filter;
      const query = { category: filter };
      let cursor;
      if (filter) {
        cursor = productsCollection.find(query);
      } else {
        cursor = productsCollection.find({});
      }
      const result = await cursor.toArray();
      res.send(result.reverse());
    });

    //   find a single product by id
    app.get("/api/products/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });
    app.get("/api/products/limit/:total", async (req, res) => {
      const total = req.params.total;
      const cursor = productsCollection.find({});
      const result = await cursor.limit(parseInt(total)).toArray();
      res.send(result.reverse());
    });
    //   find products by uid for specific admin
    app.get("/api/products/:uid", async (req, res) => {
      const uid = req.params.uid;
      const query = { uid };
      const cursor = productsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result.reverse());
    });

    app.get("/products/related", async (req, res) => {
      const category = req.query.category;
      console.log(category);
      const query = { category: category };
      const cursor = productsCollection.find(query);
      const result = await cursor.limit(4).toArray();
      res.send(result.reverse());
    });

    //   --------------------------------------------------------

    // find all orders
    app.get("/api/orders/all", async (req, res) => {
      const cursor = ordersCollection.find({});
      const result = await cursor.toArray();
      res.send(result.reverse());
    });
    //   find specific orders by user uid
    app.get("/api/orders/:uid", async (req, res) => {
      const uid = req.params.uid;
      const query = { uid };
      const cursor = ordersCollection.find(query);
      const result = await cursor.toArray();
      res.send(result.reverse());
    });

    //   -------------------------------------------------------

    //   find all reviews
    app.get("/api/reviews", async (req, res) => {
      const cursor = reviewsCollection.find({});
      const result = await cursor.toArray();
      res.send(result.reverse());
    });

    //   ------------------------------------------------------

    // Find single user by uid
    app.get("/api/users/:uid", async (req, res) => {
      const uid = req.params.uid;
      const query = { uid };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    //   POST API
    //   create review api
    app.post("/api/reviews/createReview", async (req, res) => {
      const reviewData = req.body;
      const createdReview = await reviewsCollection.insertOne(reviewData);
      res.json(createdReview);
    });
    //   create an order
    app.post("/api/orders/createOrder", async (req, res) => {
      const orderedData = req.body;
      const createdOrder = await ordersCollection.insertOne(orderedData);
      res.json(createdOrder);
    });

    //     create products post api
    app.post("/api/products/createProduct", async (req, res) => {
      const productData = req.body;
      const createdProduct = await productsCollection.insertOne(productData);
      res.json(createdProduct);
    });
    //   create an user

    app.post("/api/users/createUser", async (req, res) => {
      const userData = req.body;
      const createdUser = await usersCollection.insertOne(userData);
      res.json(createdUser);
    });

    //   PUT API

    //   update order status by order id
    app.put("/api/order/:id/:status", async (req, res) => {
      const { id, status } = req.params;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          orderStatus: status,
        },
      };
      const result = await ordersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // create an user google user
    app.put("/api/users/createUser", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // update a user address
    app.put("/api/user/newAddress/:uid", async (req, res) => {
      const uid = req.params.uid;
      const address = req.body;
      const filter = { uid: uid };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          address: address,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    //   make an admin by email
    app.put("/api/admin/new/:email", async (req, res) => {
      const { email } = req.params;
      const filter = { email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };

      const existsUser = await usersCollection.findOne(filter);

      if (existsUser) {
        const result = await usersCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.json(result);
      } else {
        res.json("User not found at this email");
      }
    });

    //   DELETE API

    //   delete an order by order id
    app.delete("/api/order/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.json(result);
    });

    app.delete("/api/product/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const deletedProduct = await productsCollection.deleteOne(query);
      res.json(deletedProduct);
    });

    console.log("database connected");
  } finally {
    // await client.close()
  }
};
run().catch(console.dir);

app.listen(PORT, () => {
  console.log("server is running on port", PORT);
});
