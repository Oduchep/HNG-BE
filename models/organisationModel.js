import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const Schema = mongoose.Schema;

const organisationSchema = new Schema({
  orgId: { type: String, required: true, unique: true, default: uuidv4() },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

export default mongoose.model('Organisation', organisationSchema);
