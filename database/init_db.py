from faker import Faker
import random
from datetime import datetime, timedelta
from database.models import db, Sensor, Measurement

fake = Faker('vi_VN')

def init_database(app):
    """Initialize database with sample data"""
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Check if data already exists
        if Sensor.query.first():
            print("Database already initialized!")
            return
        
        # Create sample sensors in Hanoi area
        hanoi_locations = [
            {"name": "Cảm biến Hồ Gươm", "lat": 21.0285, "lng": 105.8542, "desc": "Khu vực trung tâm Hà Nội"},
            {"name": "Cảm biến Đại học Bách Khoa", "lat": 21.0063, "lng": 105.8430, "desc": "Khu vực Hai Bà Trưng"},
            {"name": "Cảm biến Cầu Giấy", "lat": 21.0334, "lng": 105.7829, "desc": "Quận Cầu Giấy"},
            {"name": "Cảm biến Long Biên", "lat": 21.0367, "lng": 105.8987, "desc": "Quận Long Biên"},
            {"name": "Cảm biến Thanh Xuân", "lat": 20.9883, "lng": 105.8065, "desc": "Quận Thanh Xuân"},
            {"name": "Cảm biến Tây Hồ", "lat": 21.0583, "lng": 105.8186, "desc": "Quận Tây Hồ"},
        ]
        
        sensors = []
        for loc in hanoi_locations:
            sensor = Sensor(
                name=loc["name"],
                latitude=loc["lat"],
                longitude=loc["lng"],
                location_description=loc["desc"]
            )
            db.session.add(sensor)
            sensors.append(sensor)
        
        db.session.commit()
        
        # Generate sample measurements for the last 7 days
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=7)
        
        for sensor in sensors:
            current_time = start_time
            while current_time <= end_time:
                # Generate realistic air quality data
                measurement = Measurement(
                    sensor_id=sensor.id,
                    pm25=random.uniform(10, 150),  # Realistic PM2.5 range
                    pm10=random.uniform(20, 200),  # Realistic PM10 range
                    co=random.uniform(0.5, 15),    # CO in ppm
                    no2=random.uniform(10, 100),   # NO2 in ppb
                    o3=random.uniform(20, 150),    # O3 in ppb
                    temperature=random.uniform(15, 35),  # Temperature in °C
                    humidity=random.uniform(40, 90),     # Humidity in %
                    timestamp=current_time
                )
                db.session.add(measurement)
                current_time += timedelta(hours=1)  # Hourly measurements
        
        db.session.commit()
        print("Database initialized with sample data!")