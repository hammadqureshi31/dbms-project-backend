import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    details: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now, 
      required: true,
    },    
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",      
      required: true,   
    },
  },
  { timestamps: true } 
);

export const Log = mongoose.model("Log", activitySchema);
