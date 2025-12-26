import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  balance: { type: Number, default: 10000 },
  lifelines: {
    type: [Object],
    default: [
      { "50-50": false },
      { "QUESTION-SWAP": false },
      { "EXTRA-TIME": false }
    ]
  },

  // 🔑 track used lifelines
  // 🔑 track used lifelines
  // lifelinesUsed: {
  //   fiftyFifty: { type: Boolean, default: false },
  //   preferredPass: { type: Boolean, default: false },
  //   halfwayHelp: { type: Boolean, default: false }
  // }

  // [NEW] Special Items
  unityTokens: { type: Number, default: 0 },
  sugarCandy: { type: Number, default: 0 },

  // [NEW] Limits (Max 2 adds per team via Admin)
  unityTokenAddCount: { type: Number, default: 0 },
  sugarCandyAddCount: { type: Number, default: 0 }
});

export default mongoose.model("Team", TeamSchema);
