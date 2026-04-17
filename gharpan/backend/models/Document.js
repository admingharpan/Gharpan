// models/Document.js
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    required: true,
    enum: [
      'medical',
      'police_verification',
      'identity_proof',
      'address_proof',
      'court_documents',
      'certificates',
      'legal_documents',
      'death_certificate',
      'post_mortem_report',
      'admission_form',
      'transfer_form',
      'body_donation_form',
      'other'
    ]
  },
  filePath: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);