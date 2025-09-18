// Enhanced Backend Routes for Hospital and Casualty Management
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Hospital Model
const HospitalSchema = new mongoose.Schema({
  hospitalId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  type: { 
    type: String, 
    enum: ['Government', 'Private', 'Trust', 'Corporate'], 
    required: true 
  },
  specialties: [String],
  contact: {
    phone: String,
    emergency: String,
    email: String,
    website: String
  },
  beds: {
    total: Number,
    available: Number,
    icu: Number,
    emergency: Number,
    general: Number,
    maternity: Number,
    pediatric: Number
  },
  facilities: {
    trauma_center: { type: Boolean, default: false },
    blood_bank: { type: Boolean, default: false },
    organ_transplant: { type: Boolean, default: false },
    emergency_services: { type: Boolean, default: true },
    ambulance_services: { type: Boolean, default: false },
    helicopter_landing: { type: Boolean, default: false }
  },
  staff: {
    doctors: Number,
    nurses: Number,
    technicians: Number,
    support_staff: Number
  },
  equipment: [{
    name: String,
    quantity: Number,
    available: Number,
    status: { type: String, enum: ['Working', 'Under Maintenance', 'Out of Order'] }
  }],
  emergency_readiness: {
    disaster_preparedness_level: { type: String, enum: ['Basic', 'Intermediate', 'Advanced'] },
    mass_casualty_capacity: Number,
    backup_power: { type: Boolean, default: false },
    water_storage_days: Number
  },
  accreditation: {
    nabh_certified: { type: Boolean, default: false },
    jci_certified: { type: Boolean, default: false },
    iso_certified: { type: Boolean, default: false }
  },
  last_updated: { type: Date, default: Date.now }
}, { timestamps: true });

// Casualty/Patient Model
const CasualtySchema = new mongoose.Schema({
  casualtyId: { type: String, required: true, unique: true },
  personal_info: {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    contact: String,
    aadhar_number: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    }
  },
  emergency_contacts: [{
    name: String,
    relationship: String,
    phone: String,
    notified: { type: Boolean, default: false }
  }],
  medical_info: {
    blood_group: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    allergies: [String],
    medical_history: [String],
    current_medications: [String],
    medical_conditions: [String]
  },
  incident_details: {
    incident_type: { 
      type: String, 
      enum: ['Earthquake', 'Flood', 'Fire', 'Accident', 'Violence', 'Medical Emergency', 'Other']
    },
    incident_location: {
      lat: Number,
      lng: Number,
      address: String
    },
    incident_time: Date,
    rescue_time: Date,
    hospital_arrival_time: Date
  },
  triage_info: {
    severity: { 
      type: String, 
      enum: ['Critical', 'Serious', 'Moderate', 'Minor'], 
      required: true 
    },
    triage_color: { 
      type: String, 
      enum: ['Red', 'Yellow', 'Green', 'Black'], 
      required: true 
    },
    vital_signs: {
      pulse: Number,
      blood_pressure: String,
      temperature: Number,
      respiratory_rate: Number,
      oxygen_saturation: Number,
      consciousness_level: { type: String, enum: ['Alert', 'Verbal', 'Pain', 'Unconscious'] }
    },
    initial_assessment: String,
    triage_nurse: String,
    triage_time: { type: Date, default: Date.now }
  },
  injuries: [{
    type: String,
    location: String,
    severity: { type: String, enum: ['Minor', 'Moderate', 'Severe', 'Life-threatening'] },
    description: String,
    treatment_required: String
  }],
  hospital_info: {
    hospital_id: { type: String, required: true },
    admission_number: String,
    ward: String,
    bed_number: String,
    attending_doctor: String,
    assigned_nurse: String
  },
  treatment_status: {
    status: { 
      type: String, 
      enum: ['Incoming', 'Under Treatment', 'Surgery', 'ICU', 'Stable', 'Discharged', 'Transferred', 'Deceased'], 
      default: 'Incoming' 
    },
    treatment_plan: String,
    medications: [String],
    procedures_done: [String],
    surgery_required: { type: Boolean, default: false },
    surgery_details: String,
    discharge_plan: String
  },
  timeline: [{
    timestamp: { type: Date, default: Date.now },
    event: String,
    details: String,
    staff_member: String
  }],
  family_updates: [{
    timestamp: { type: Date, default: Date.now },
    update: String,
    notified_contact: String,
    method: { type: String, enum: ['Phone', 'SMS', 'Email', 'In-person'] }
  }],
  discharge_info: {
    discharge_time: Date,
    discharge_condition: { type: String, enum: ['Recovered', 'Stable', 'Referred', 'Against Medical Advice'] },
    follow_up_required: { type: Boolean, default: false },
    follow_up_date: Date,
    discharge_medications: [String],
    discharge_instructions: String
  }
}, { timestamps: true });

// Ambulance/Emergency Vehicle Model
const AmbulanceSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, unique: true },
  vehicle_number: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Basic Life Support', 'Advanced Life Support', 'Patient Transport', 'Mobile ICU'], 
    required: true 
  },
  current_location: {
    lat: Number,
    lng: Number,
    address: String,
    last_updated: { type: Date, default: Date.now }
  },
  status: { 
    type: String, 
    enum: ['Available', 'Dispatched', 'On Scene', 'Transporting', 'At Hospital', 'Out of Service'], 
    default: 'Available' 
  },
  crew: [{
    name: String,
    role: { type: String, enum: ['Driver', 'Paramedic', 'EMT', 'Doctor', 'Nurse'] },
    license_number: String,
    contact: String
  }],
  equipment: [{
    name: String,
    status: { type: String, enum: ['Available', 'In Use', 'Maintenance Required', 'Missing'] }
  }],
  current_assignment: {
    incident_id: String,
    casualty_id: String,
    pickup_location: {
      lat: Number,
      lng: Number,
      address: String
    },
    destination_hospital: String,
    dispatch_time: Date,
    eta: Date
  },
  service_history: [{
    date: Date,
    incident_type: String,
    pickup_location: String,
    destination: String,
    casualties_transported: Number,
    response_time: Number // in minutes
  }]
}, { timestamps: true });

// Create models
const Hospital = mongoose.model('Hospital', HospitalSchema);
const Casualty = mongoose.model('Casualty', CasualtySchema);
const Ambulance = mongoose.model('Ambulance', AmbulanceSchema);

// API Routes

// Hospital Management Routes
router.get('/hospitals', async (req, res) => {
  try {
    const { city, type, specialty, emergency_only } = req.query;
    let query = {};
    
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (type) query.type = type;
    if (specialty) query.specialties = { $in: [new RegExp(specialty, 'i')] };
    if (emergency_only === 'true') query['facilities.emergency_services'] = true;
    
    const hospitals = await Hospital.find(query).select('-__v');
    res.json({
      success: true,
      count: hospitals.length,
      hospitals: hospitals
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/hospitals/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ hospitalId: req.params.id });
    if (!hospital) {
      return res.status(404).json({ success: false, error: 'Hospital not found' });
    }
    res.json({ success: true, hospital });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/hospitals', async (req, res) => {
  try {
    const hospital = new Hospital(req.body);
    await hospital.save();
    res.status(201).json({ success: true, hospital });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, error: 'Hospital ID already exists' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

router.put('/hospitals/:id/capacity', async (req, res) => {
  try {
    const { beds, staff } = req.body;
    const hospital = await Hospital.findOneAndUpdate(
      { hospitalId: req.params.id },
      { 
        $set: { 
          beds: beds,
          staff: staff,
          last_updated: new Date()
        }
      },
      { new: true }
    );
    
    if (!hospital) {
      return res.status(404).json({ success: false, error: 'Hospital not found' });
    }
    
    res.json({ success: true, hospital });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Casualty Management Routes
router.post('/casualties', async (req, res) => {
  try {
    // Generate unique casualty ID
    const casualtyCount = await Casualty.countDocuments();
    const casualtyId = `C${String(casualtyCount + 1).padStart(6, '0')}`;
    
    const casualtyData = {
      ...req.body,
      casualtyId: casualtyId
    };
    
    const casualty = new Casualty(casualtyData);
    await casualty.save();
    
    // Add initial timeline entry
    casualty.timeline.push({
      event: 'Patient Registered',
      details: 'Patient registered in disaster management system',
      staff_member: req.user?.username || 'System'
    });
    
    await casualty.save();
    
    res.status(201).json({ success: true, casualty });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/casualties', async (req, res) => {
  try {
    const { 
      hospital_id, 
      status, 
      severity, 
      triage_color,
      search,
      page = 1,
      limit = 50
    } = req.query;
    
    let query = {};
    
    if (hospital_id) query['hospital_info.hospital_id'] = hospital_id;
    if (status) query['treatment_status.status'] = status;
    if (severity) query['triage_info.severity'] = severity;
    if (triage_color) query['triage_info.triage_color'] = triage_color;
    if (search) {
      query.$or = [
        { 'personal_info.name': new RegExp(search, 'i') },
        { casualtyId: new RegExp(search, 'i') }
      ];
    }
    
    const casualties = await Casualty.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');
    
    const total = await Casualty.countDocuments(query);
    
    res.json({
      success: true,
      casualties,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_casualties: total,
        per_page: limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/casualties/:id', async (req, res) => {
  try {
    const casualty = await Casualty.findOne({ casualtyId: req.params.id });
    if (!casualty) {
      return res.status(404).json({ success: false, error: 'Casualty not found' });
    }
    res.json({ success: true, casualty });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/casualties/:id/status', async (req, res) => {
  try {
    const { status, details, staff_member } = req.body;
    
    const casualty = await Casualty.findOneAndUpdate(
      { casualtyId: req.params.id },
      { 
        $set: { 'treatment_status.status': status },
        $push: {
          timeline: {
            event: `Status changed to ${status}`,
            details: details,
            staff_member: staff_member || req.user?.username || 'System'
          }
        }
      },
      { new: true }
    );
    
    if (!casualty) {
      return res.status(404).json({ success: false, error: 'Casualty not found' });
    }
    
    res.json({ success: true, casualty });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/casualties/:id/transfer', async (req, res) => {
  try {
    const { destination_hospital, reason, ambulance_id, staff_member } = req.body;
    
    const casualty = await Casualty.findOneAndUpdate(
      { casualtyId: req.params.id },
      {
        $set: {
          'hospital_info.hospital_id': destination_hospital,
          'treatment_status.status': 'Transferred'
        },
        $push: {
          timeline: {
            event: 'Patient Transferred',
            details: `Transferred to ${destination_hospital}. Reason: ${reason}`,
            staff_member: staff_member || req.user?.username || 'System'
          }
        }
      },
      { new: true }
    );
    
    if (!casualty) {
      return res.status(404).json({ success: false, error: 'Casualty not found' });
    }
    
    res.json({ success: true, message: 'Patient transferred successfully', casualty });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ambulance Management Routes
router.get('/ambulances', async (req, res) => {
  try {
    const { status, type, available_only } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (available_only === 'true') query.status = 'Available';
    
    const ambulances = await Ambulance.find(query).select('-__v');
    res.json({ success: true, ambulances });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ambulances/:id/dispatch', async (req, res) => {
  try {
    const { pickup_location, destination_hospital, casualty_id, incident_id } = req.body;
    
    const ambulance = await Ambulance.findOneAndUpdate(
      { vehicleId: req.params.id, status: 'Available' },
      {
        $set: {
          status: 'Dispatched',
          current_assignment: {
            incident_id,
            casualty_id,
            pickup_location,
            destination_hospital,
            dispatch_time: new Date()
          }
        }
      },
      { new: true }
    );
    
    if (!ambulance) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ambulance not found or not available' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Ambulance dispatched successfully', 
      ambulance 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analytics and Dashboard Routes
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalHospitals = await Hospital.countDocuments();
    const totalCasualties = await Casualty.countDocuments();
    const activeCasualties = await Casualty.countDocuments({
      'treatment_status.status': { $in: ['Under Treatment', 'Surgery', 'ICU'] }
    });
    const availableAmbulances = await Ambulance.countDocuments({ status: 'Available' });
    
    const casualtiesBySeverity = await Casualty.aggregate([
      {
        $group: {
          _id: '$triage_info.severity',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const casualtiesByStatus = await Casualty.aggregate([
      {
        $group: {
          _id: '$treatment_status.status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const hospitalCapacity = await Hospital.aggregate([
      {
        $group: {
          _id: null,
          totalBeds: { $sum: '$beds.total' },
          availableBeds: { $sum: '$beds.available' },
          icuBeds: { $sum: '$beds.icu' },
          emergencyBeds: { $sum: '$beds.emergency' }
        }
      }
    ]);
    
    res.json({
      success: true,
      stats: {
        hospitals: {
          total: totalHospitals,
          capacity: hospitalCapacity[0] || { totalBeds: 0, availableBeds: 0, icuBeds: 0, emergencyBeds: 0 }
        },
        casualties: {
          total: totalCasualties,
          active: activeCasualties,
          by_severity: casualtiesBySeverity,
          by_status: casualtiesByStatus
        },
        ambulances: {
          available: availableAmbulances
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Emergency notification system
router.post('/emergency/notify', async (req, res) => {
  try {
    const { casualty_id, notification_type, message } = req.body;
    
    const casualty = await Casualty.findOne({ casualtyId: casualty_id });
    if (!casualty) {
      return res.status(404).json({ success: false, error: 'Casualty not found' });
    }
    
    // Update family with notification
    casualty.family_updates.push({
      update: message,
      notified_contact: casualty.emergency_contacts[0]?.phone || 'Unknown',
      method: 'SMS' // This would integrate with SMS service
    });
    
    await casualty.save();
    
    // Here you would integrate with SMS/Email service
    // await sendSMS(casualty.emergency_contacts[0].phone, message);
    
    res.json({ 
      success: true, 
      message: 'Emergency notification sent successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;