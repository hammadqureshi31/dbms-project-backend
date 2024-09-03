import mongoose, { mongo } from 'mongoose'

const commentSchema = mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    likes: {
        type: Array,
        default: []
    },
    dislikes: {
        type: Array,
        default: []
    },
}, {timestamps: true}
);

export const Comment = mongoose.model('Comment', commentSchema);