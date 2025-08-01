from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Sensor(db.Model):
    __tablename__ = 'sensors'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    location_description = db.Column(db.String(255))
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship with measurements
    measurements = db.relationship('Measurement', backref='sensor', lazy=True)

class Measurement(db.Model):
    __tablename__ = 'measurements'
    
    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(db.Integer, db.ForeignKey('sensors.id'), nullable=False)
    pm25 = db.Column(db.Float)  # PM2.5 µg/m³
    pm10 = db.Column(db.Float)  # PM10 µg/m³
    co = db.Column(db.Float)    # CO ppm
    no2 = db.Column(db.Float)   # NO2 ppb
    o3 = db.Column(db.Float)    # O3 ppb
    temperature = db.Column(db.Float)  # °C
    humidity = db.Column(db.Float)     # %
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'sensor_id': self.sensor_id,
            'pm25': self.pm25,
            'pm10': self.pm10,
            'co': self.co,
            'no2': self.no2,
            'o3': self.o3,
            'temperature': self.temperature,
            'humidity': self.humidity,
            'timestamp': self.timestamp.isoformat()
        }