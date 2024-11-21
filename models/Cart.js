import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  idNum: {
    type: Number,
    required: false,
  },
  productName: {
    type: String,
    required: false,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Product ID is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
});

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate total price
cartSchema.pre("save", function (next) {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  this.lastUpdated = Date.now();
  next();
});

export default mongoose.model("Cart", cartSchema);
