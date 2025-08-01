from flask import Flask, render_template, jsonify
from flask_cors import CORS
from config import Config
from database.models import db, Sensor, Measurement
from database.init_db import init_database
from datetime import datetime, timedelta
from sqlalchemy import func

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    
    # Initialize database
    init_database(app)
    
    return app

app = create_app()

@app.route('/')
def index():
    """Home page"""
    return render_template('index.html')

@app.route('/map')
def map_view():
    """Map view page"""
    return render_template('map.html')

@app.route('/charts')
def charts_view():
    """Charts view page"""
    return render_template('charts.html')

@app.route('/api/sensors')
def get_sensors():
    """Get all sensors with latest measurements"""
    sensors = Sensor.query.all()
    result = []
    
    for sensor in sensors:
        # Get latest measurement
        latest_measurement = Measurement.query.filter_by(sensor_id=sensor.id)\
                                            .order_by(Measurement.timestamp.desc())\
                                            .first()
        
        sensor_data = {
            'id': sensor.id,
            'name': sensor.name,
            'latitude': sensor.latitude,
            'longitude': sensor.longitude,
            'location_description': sensor.location_description,
            'status': sensor.status
        }
        
        if latest_measurement:
            sensor_data['latest_measurement'] = latest_measurement.to_dict()
        
        result.append(sensor_data)
    
    return jsonify(result)

@app.route('/api/measurements/<int:sensor_id>')
def get_sensor_measurements(sensor_id):
    """Get measurements for a specific sensor"""
    # Get measurements from the last 24 hours
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=1)
    
    measurements = Measurement.query.filter(
        Measurement.sensor_id == sensor_id,
        Measurement.timestamp >= start_time
    ).order_by(Measurement.timestamp.asc()).all()
    
    return jsonify([m.to_dict() for m in measurements])

@app.route('/api/measurements/range/<int:sensor_id>/<int:hours>')
def get_sensor_measurements_range(sensor_id, hours):
    """Get measurements for a specific sensor within time range"""
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=hours)
    
    measurements = Measurement.query.filter(
        Measurement.sensor_id == sensor_id,
        Measurement.timestamp >= start_time
    ).order_by(Measurement.timestamp.asc()).all()
    
    return jsonify([m.to_dict() for m in measurements])

@app.route('/api/statistics')
def get_statistics():
    """Get overall statistics"""
    # Get average values from the last hour
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=1)
    
    stats = db.session.query(
        func.avg(Measurement.pm25).label('avg_pm25'),
        func.avg(Measurement.pm10).label('avg_pm10'),
        func.avg(Measurement.co).label('avg_co'),
        func.avg(Measurement.no2).label('avg_no2'),
        func.avg(Measurement.temperature).label('avg_temp'),
        func.avg(Measurement.humidity).label('avg_humidity'),
        func.count(Measurement.id).label('total_measurements')
    ).filter(Measurement.timestamp >= start_time).first()
    
    return jsonify({
        'avg_pm25': round(stats.avg_pm25 or 0, 2),
        'avg_pm10': round(stats.avg_pm10 or 0, 2),
        'avg_co': round(stats.avg_co or 0, 2),
        'avg_no2': round(stats.avg_no2 or 0, 2),
        'avg_temperature': round(stats.avg_temp or 0, 1),
        'avg_humidity': round(stats.avg_humidity or 0, 1),
        'total_measurements': stats.total_measurements or 0,
        'active_sensors': Sensor.query.filter_by(status='active').count()
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

