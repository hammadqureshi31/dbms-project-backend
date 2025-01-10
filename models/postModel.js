import mongoose from "mongoose";

const postSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    content: {
        type: String,
        required: true,
    },
    postImage: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        default: "uncategorized"
    },
    clicks:{
        type: Number,
        default: 0
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    createdByUser: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }  
}, {timestamps: true}
);

export const Post = mongoose.model("Post", postSchema);