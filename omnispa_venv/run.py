from app import create_app, db
from app.models import Spa, OperatingHours, Service, SpaImage, Availability
import os

# Create the Flask application instance
app = create_app()

def initialize_database():
    """Initialize the database with required tables"""
    with app.app_context():
        # Create all database tables
        db.create_all()
        
if __name__ == '__main__':
    # Initialize database before running
    initialize_database()
    
    # Run the application
    app.run(
        host=os.environ.get('FLASK_HOST', '0.0.0.0'),
        port=int(os.environ.get('FLASK_PORT', 8080)),
        debug=os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    )