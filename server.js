const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const { body, validationResult } = require('express-validator');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// MongoDB Models
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['civilian', 'responder', 'admin'], default: 'civilian' },
  location: {
    lat: Number,
    lng: Number,
    city: String,
    state: String
  },
  isActive: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

const DisasterSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['earthquake', 'flood', 'cyclone', 'wildfire', 'tsunami', 'landslide', 'drought', 'volcanic'],
    required: true 
  },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
    address: String,
    city: String,
    state: String
  },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['predicted', 'active', 'resolved'],
    default: 'predicted' 
  },
  probability: { type: Number, min: 0, max: 1 },
  confidence: { type: Number, min: 0, max: 1 },
  affectedPopulation: Number,
  economicImpact: Number,
  description: String,
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  predictions: [{
    timestamp: Date,
    probability: Number,
    confidence: Number,
    factors: [String]
  }],
  responses: [{
    timestamp: Date,
    action: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resources: [String]
  }]
}, { timestamps: true });

const AlertSchema = new mongoose.Schema({
  disaster: { type: mongoose.Schema.Types.ObjectId, ref: 'Disaster', required: true },
  type: { 
    type: String, 
    enum: ['warning', 'watch', 'advisory', 'emergency'],
    required: true 
  },
  message: { type: String, required: true },
  channels: [{ 
    type: String, 
    enum: ['sms', 'email', 'push', 'broadcast'],
    default: 'push' 
  }],
  targetAudience: {
    location: {
      center: { lat: Number, lng: Number },
      radius: Number // in kilometers
    },
    demographics: [String],
    roles: [String]
  },
  isActive: { type: Boolean, default: true },
  sentCount: { type: Number, default: 0 },
  acknowledgedCount: { type: Number, default: 0 }
}, { timestamps: true });

const ResourceSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['medical', 'rescue', 'shelter', 'supplies', 'transport', 'communication'],
    required: true 
  },
  name: { type: String, required: true },
  capacity: Number,
  available: { type: Boolean, default: true },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Disaster' },
  status: { 
    type: String, 
    enum: ['available', 'deployed', 'maintenance', 'unavailable'],
    default: 'available' 
  },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Create indexes for geospatial queries
DisasterSchema.index({ location: '2dsphere' });

// Create models
const User = mongoose.model('User', UserSchema);
const Disaster = mongoose.model('Disaster', DisasterSchema);
const Alert = mongoose.model('Alert', AlertSchema);
const Resource = mongoose.model('Resource', ResourceSchema);

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests from this IP' }
});
app.use('/api/', limiter);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'disaster_secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Authentication routes
app.post('/api/auth/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role, location } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'civilian',
      location
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'disaster_secret',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last seen
    user.lastSeen = new Date();
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'disaster_secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Risk Analysis API
app.post('/api/prediction/analyze-risk', authenticateToken, async (req, res) => {
  try {
    const {
      coordinates,
      hazardType,
      populationDensity,
      infrastructureAge,
      buildingStandards,
      economicIndex,
      responseCapacity,
      historicalFreq
    } = req.body;

    // Parse coordinates
    let coords;
    if (typeof coordinates === 'string') {
      const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
      coords = { lat, lng };
    } else {
      coords = coordinates;
    }

    // Simulate AI analysis (in real implementation, this would call ML models)
    const analysisFactors = {
      geographic: Math.random() * 0.6 + 0.2, // 0.2-0.8
      demographic: (populationDensity || 1000) / 10000, // Normalize population density
      infrastructure: (infrastructureAge || 20) / 100, // Normalize age
      economic: (100 - (economicIndex || 50)) / 100, // Invert economic index
      historical: (historicalFreq || 1) / 10 // Normalize frequency
    };

    const baseProbability = Object.values(analysisFactors).reduce((sum, val) => sum + val, 0) / 5;
    
    // Add hazard-specific adjustments
    let hazardMultiplier = 1.0;
    const currentMonth = new Date().getMonth() + 1;
    
    switch (hazardType) {
      case 'flood':
        // Higher risk during monsoon (June-September)
        hazardMultiplier = (currentMonth >= 6 && currentMonth <= 9) ? 1.5 : 0.8;
        break;
      case 'cyclone':
        // Higher risk during cyclone seasons
        hazardMultiplier = (currentMonth >= 4 && currentMonth <= 6 || currentMonth >= 10 && currentMonth <= 12) ? 1.4 : 0.7;
        break;
      case 'earthquake':
        hazardMultiplier = 1.0; // Year-round consistent risk
        break;
      case 'drought':
        // Higher risk during summer
        hazardMultiplier = (currentMonth >= 3 && currentMonth <= 5) ? 1.6 : 0.6;
        break;
      default:
        hazardMultiplier = 1.0;
    }

    const finalProbability = Math.min(baseProbability * hazardMultiplier, 0.95);
    const confidence = Math.random() * 0.3 + 0.7; // 0.7-1.0

    // Generate risk level
    let riskLevel = 'LOW';
    let alertLevel = 'GREEN';
    
    if (finalProbability >= 0.8) {
      riskLevel = 'CRITICAL';
      alertLevel = 'RED';
    } else if (finalProbability >= 0.6) {
      riskLevel = 'HIGH';
      alertLevel = 'ORANGE';
    } else if (finalProbability >= 0.4) {
      riskLevel = 'MEDIUM';
      alertLevel = 'YELLOW';
    }

    // Generate recommendations
    const recommendations = [];
    
    if (finalProbability > 0.7) {
      recommendations.push({
        priority: 'HIGH',
        action: 'IMMEDIATE_EVACUATION',
        description: 'Immediate evacuation of high-risk areas recommended'
      });
    }
    
    if (finalProbability > 0.5) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'PREPARE_RESOURCES',
        description: 'Pre-position emergency resources and personnel'
      });
    }

    recommendations.push({
      priority: 'LOW',
      action: 'MONITOR',
      description: 'Continue monitoring conditions and maintain preparedness'
    });

    // Estimate impact
    const estimatedAffected = Math.floor((populationDensity || 1000) * finalProbability * 10);
    const economicImpact = estimatedAffected * finalProbability * 100000; // USD

    // Create disaster prediction record
    const disaster = new Disaster({
      type: hazardType,
      location: {
        type: 'Point',
        coordinates: [coords.lng, coords.lat]
      },
      severity: riskLevel.toLowerCase(),
      probability: finalProbability,
      confidence: confidence,
      affectedPopulation: estimatedAffected,
      economicImpact: economicImpact,
      reportedBy: req.user.userId,
      predictions: [{
        timestamp: new Date(),
        probability: finalProbability,
        confidence: confidence,
        factors: ['weather', 'demographics', 'infrastructure', 'historical']
      }]
    });

    await disaster.save();

    const result = {
      prediction: {
        probability: finalProbability,
        confidence: confidence,
        riskLevel: riskLevel,
        alertLevel: alertLevel,
        hazardType: hazardType,
        recommendations: recommendations,
        nextUpdate: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      },
      riskAssessment: {
        analysisFactors: analysisFactors,
        estimatedImpact: {
          estimatedAffectedPopulation: estimatedAffected,
          economicImpact: economicImpact,
          infrastructureDamage: analysisFactors.infrastructure
        }
      },
      metadata: {
        analysisTimestamp: new Date(),
        modelVersion: '2.1.0',
        dataQuality: 'HIGH',
        disasterId: disaster._id
      }
    };

    // Broadcast high-risk predictions
    if (finalProbability > 0.6) {
      io.emit('high_risk_prediction', {
        location: coords,
        hazardType,
        probability: finalProbability,
        riskLevel,
        timestamp: new Date()
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Risk analysis error:', error);
    res.status(500).json({ error: 'Risk analysis failed' });
  }
});

// Real-time monitoring data
app.get('/api/monitoring/live', authenticateToken, async (req, res) => {
  try {
    // Simulate real-time monitoring data
    const monitoringData = {
      systemStatus: 'OPERATIONAL',
      lastUpdate: new Date(),
      realTimeData: {
        seismicActivity: {
          current: (Math.random() * 5 + 2).toFixed(1),
          threshold: 7.0,
          status: 'normal',
          recent: Array.from({ length: 10 }, () => Math.random() * 3 + 1)
        },
        weatherIndex: {
          current: Math.floor(Math.random() * 30 + 70),
          threshold: 85,
          status: Math.random() > 0.8 ? 'warning' : 'normal'
        },
        populationRisk: {
          current: Math.floor(Math.random() * 10000 + 5000),
          highRiskAreas: Math.floor(Math.random() * 5 + 1),
          evacuated: Math.floor(Math.random() * 1000)
        },
        responseTime: {
          current: (Math.random() * 3 + 2).toFixed(1),
          target: 5.0,
          status: 'good'
        }
      },
      activeAlerts: await Alert.countDocuments({ isActive: true }),
      activeDis