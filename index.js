import express from "express";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/database.js";
import User from "./models/User.js";
import auth from "./config/auth.js";
import rateLimit from "express-rate-limit";
import Cart from "./models/Cart.js";
import { OrderService, ProductService } from "./services/externalService.js";

const app = express();

// Connect to MongoDB
connectDB();

// Middleware

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 5, // Limit each IP to 5 requests per `window` (per minute)
  message: {
    status: 429,
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/auth", apiLimiter);
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth Routes
// Register
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, address, phoneNumber, avatar } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      address,
      phoneNumber,
      avatar,
    });
    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = user.generateAuthToken();

    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Protected Routes
// GET all users
app.get("/users", auth, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET user by ID
app.get("/users/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update user
app.put("/users/:id", auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE user
app.delete("/users/:id", auth, async (req, res) => {
  try {
    // First, try to delete user's orders
    try {
      await OrderService.deleteUserOrders(req.params.id);
    } catch (error) {
      console.error("Error deleting user orders:", error);
      // Continue with user deletion even if order deletion fails
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's cart
app.get("/cart", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add/Update cart item
app.post("/cart/items", auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Get product details from product service
    const product = await ProductService.getProductById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      // Create new cart if doesn't exist
      cart = new Cart({
        userId: req.user._id,
        items: [
          {
            idNum: product.id,
            productName: product.name,
            productId,
            quantity,
            price: product.price,
          },
        ],
      });
    } else {
      // Update existing cart
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
      } else {
        cart.items.push({
          idNum: product.id,
          productName: product.name,
          productId,
          quantity,
          price: product.price,
        });
      }
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update cart item
app.put("/cart/items/:productId", auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.productId;

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    // Update existing cart
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
    } else {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
// Remove item from cart
app.delete("/cart/items/:productId", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== req.params.productId
    );

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Clear cart
app.delete("/cart", auth, async (req, res) => {
  try {
    const cart = await Cart.findOneAndDelete({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create order from cart
app.post("/orders", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const user = await User.findOne({ _id: req.user._id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const orderParams = {
      // userId: req.user.idNum,
      cart: {
        cartItems: cart.items.map((item) => ({
          // cartItemId: item.idNum,
          product: {
            // productId: item.idNum,
            productName: item.productName,
            productPrice: item.price,
          },
          quantity: item.quantity,
        })),
      },
      address: {
        // addressId: user.idNum,
        flatNo: user.address.street,
        city: user.address.city,
        state: user.address.state,
        pinCode: user.address.zipCode,
      },
      amount: cart.totalPrice,
    };

    console.log(orderParams);

    console.log(orderParams.cart.cartItems);
    const order = await OrderService.createOrder(orderParams);
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
