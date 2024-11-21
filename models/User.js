const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    address: {
      _id: false,
      type: {
        street: {
          type: String,
          trim: true,
          default: null,
        },
        city: {
          type: String,
          trim: true,
          default: null,
        },
        state: {
          type: String,
          trim: true,
          default: null,
        },
        country: {
          type: String,
          trim: true,
          default: null,
        },
        zipCode: {
          type: String,
          trim: true,
          default: null,
        },
      },
      required: false,
      default: null,
    },
    phoneNumber: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
      match: [
        /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
        "Please enter a valid phone number",
      ],
    },
    avatar: {
      type: String,
      trim: true,
      required: false,
      default: null,
      validate: {
        validator: function (v) {
          return v === null || v === "" || /^(http|https):\/\/[^ "]+$/.test(v);
        },
        message: "Avatar must be either empty or a valid URL",
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index(
  {
    "address.country": 1,
    "address.state": 1,
    "address.city": 1,
    "address.zipCode": 1,
  },
  {
    sparse: true,
    name: "address_location_index",
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
  return token;
};

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model("User", userSchema);
