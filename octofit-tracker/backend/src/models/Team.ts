import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
  name: { type: String, required: true, trim: true },
  mascot: { type: String, required: true, trim: true },
  members: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], required: true, default: [] },
});

export const Team = model('Team', teamSchema);
