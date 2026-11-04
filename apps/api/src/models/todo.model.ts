import { Schema, model, type InferSchemaType } from 'mongoose';

const schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export type Todo = InferSchemaType<typeof schema>;

export const TodoModel = model<Todo>('Todo', schema);
