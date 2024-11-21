import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      default: () => {
        return Math.round(Math.random() * 10000);
      },
      unique: true,
    },
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
    },
    avatar: {
      type: String,
      trim: true,
      required: false,
      default: null,
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
  const token = jwt.sign(
    { _id: this._id.toString(), idNum: this.id, email: this.email },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    }
  );
  return token;
};

userSchema.methods.comparePassword = async function (password) {
  if (!password) {
    return false;
  }

  return await bcrypt.compare(password, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model("User", userSchema);
