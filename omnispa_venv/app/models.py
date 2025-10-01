from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone, timedelta
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import os
from typing import List, Dict, Optional
from . import db
from flask_login import UserMixin
from flask import current_app
import uuid

# Define Seychelles timezone (UTC+4)
UTC_PLUS_4 = timezone(timedelta(hours=4))

class Owner(db.Model, UserMixin):
    __tablename__ = 'owners'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    password_hash = db.Column(db.String(128))
    is_verified = db.Column(db.Boolean, default=False)
    
    # One owner can register many spas
    spas = db.relationship('Spa', backref='owner', cascade='all, delete-orphan')
    # Password helpers
    def set_password(self, password):
        """Sets password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Checks password"""
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        """Represents Owner"""
        return f'<Owner {self.username} ({self.id})>'

    def get_id(self):
        """Gets owner ID"""
        return f"owner-{self.id}"
    
    @property
    def is_active(self):
        """Checks if user is active"""
        return True
    
    @property
    def is_authenticated(self):
        """Checks if user has been authenticated"""
        return True
    
    @property
    def is_anonymous(self):
        """Check if user is not logged in"""
        return False
    
class Spa(db.Model):
    """Main spa business model with relationships to all other entities"""
    __tablename__ = 'spas'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    address = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    area = db.Column(db.String(50), nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), 
        default=lambda: datetime.now(UTC_PLUS_4), 
        nullable=False
    )
    terms_accepted = db.Column(db.Boolean, default=False, nullable=False)
    maps_embed_url = db.Column(db.Text, default=None, nullable=True)
    # Relationships
    owner_id = db.Column(db.Integer, db.ForeignKey('owners.id', ondelete='CASCADE'), nullable=False)
    operating_hours = db.relationship('OperatingHours', backref='spa', cascade='all, delete-orphan')
    services = db.relationship('Service', backref='spa', cascade='all, delete-orphan')
    images = db.relationship('SpaImage', backref='spa', cascade='all, delete-orphan')
    availability = db.relationship('Availability', backref='spa', cascade='all, delete-orphan')

    def __repr__(self):
        """Represents the SPA"""
        return f'<Spa {self.name} ({self.id})>'

class OperatingHours(db.Model):
    """Standard operating hours model"""
    __tablename__ = 'operating_hours'
    
    id = db.Column(db.Integer, primary_key=True)
    day_type = db.Column(db.String(10), nullable=False)  # 'weekday' or 'weekend'
    opening_time = db.Column(db.String(5), nullable=False)  # Format: 'HH:MM'
    closing_time = db.Column(db.String(5), nullable=False)  # Format: 'HH:MM'
    spa_id = db.Column(db.Integer, db.ForeignKey('spas.id', ondelete='CASCADE'), nullable=False)

    __table_args__ = (
        db.CheckConstraint("day_type IN ('weekday', 'weekend')", name='check_day_type'),
    )

    def __repr__(self):
        """Represents operation time"""
        return f'<Hours {self.day_type}: {self.opening_time}-{self.closing_time}>'

class Service(db.Model):
    """Spa services offered"""
    __tablename__ = 'services'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    duration = db.Column(db.Integer, nullable=False)  # in minutes
    price = db.Column(db.Float, nullable=False)
    spa_id = db.Column(db.Integer, db.ForeignKey('spas.id', ondelete='CASCADE'), nullable=False)

    __table_args__ = (
        db.CheckConstraint('duration > 0', name='check_duration_positive'),
        db.CheckConstraint('price >= 0', name='check_price_non_negative'),
    )

    def __repr__(self):
        """Represents spa services"""
        return f'<Service {self.name} (${self.price})>'

class SpaImage(db.Model):
    """Spa facility images"""
    __tablename__ = 'spa_images'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(100), nullable=False)
    filepath = db.Column(db.String(200), nullable=False)
    is_primary = db.Column(db.Boolean, default=False, nullable=False)
    caption = db.Column(db.String(255))
    spa_id = db.Column(db.Integer, db.ForeignKey('spas.id', ondelete='CASCADE'), nullable=False)

    @classmethod
    def create_from_upload(cls, file, spa_id: int, upload_folder: str, is_primary: bool = False) -> Optional['SpaImage']:
        """Factory method to handle image uploads with proper path management"""
        if not file or file.filename == '' or not allowed_file(file.filename):
            return None
        
        try:
            # Create safe unique filename with timestamp and spa ID prefix
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            filename = secure_filename(f"{spa_id}_{timestamp}_{file.filename}")
            # Create relative path (for DB)
            relative_path = os.path.join('uploads', filename).replace("\\", "/")
            
            # Create absolute path for saving - includes 'static/uploads/filename.ext'
            absolute_path = os.path.join(
                current_app.root_path,
                'static',
                relative_path
            )
            # Ensure upload directory exists
            os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
            
            file.save(absolute_path)
            # Create and return new SpaImage instance
            return cls(
                filename=filename, 
                filepath=relative_path,
                spa_id=spa_id,
                is_primary=is_primary
            )
            
        except Exception as e:
            current_app.logger.error(f"Failed to save uploaded image: {str(e)}")
            return None

    def __repr__(self):
        """Represents spa images"""
        return f'<SpaImage {self.filename} (Primary: {self.is_primary})>'

class Availability(db.Model):
    """Daily availability exceptions"""
    __tablename__ = 'availability'
    
    id = db.Column(db.Integer, primary_key=True)
    day = db.Column(db.String(10), nullable=False)  # lowercase weekday names
    is_closed = db.Column(db.Boolean, default=False, nullable=False)
    time_slots = db.Column(db.JSON, nullable=False)  # List[List[str]] format
    spa_id = db.Column(db.Integer, db.ForeignKey('spas.id', ondelete='CASCADE'), nullable=False)

    __table_args__ = (
        db.CheckConstraint("day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')",
                         name='check_valid_day'),
    )

    def __repr__(self):
        """Represents spa availability"""
        return f'<Availability {self.day} {"(Closed)" if self.is_closed else f"Slots: {self.time_slots}"}>'

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

class User(db.Model, UserMixin):
    """Customer user model for reviews and favorites"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(
        db.DateTime(timezone=True), 
        default=lambda: datetime.now(UTC_PLUS_4)
    )
    
    # Relationships
    favorites = db.relationship('Favorite', backref='user', cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='user', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Sets password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Checks password"""
        return check_password_hash(self.password_hash, password)
    
    def get_id(self):
        """Gets customer user id"""
        return f"user-{self.id}"
    
    def is_admin(self):
       """Check if user is admin"""
       return self.id == 1

class Favorite(db.Model):
    """User's favorite spas"""
    __tablename__ = 'favorites'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    spa_id = db.Column(db.Integer, db.ForeignKey('spas.id'), nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), 
        default=lambda: datetime.now(UTC_PLUS_4)
    )
    spa = db.relationship('Spa', backref='favorited_by')
    # Ensure a user can’t favorite the same spa twice
    __table_args__ = (
        db.UniqueConstraint('user_id', 'spa_id', name='unique_favorite'),
    )

class Review(db.Model):
    """User reviews for spas"""
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    spa_id = db.Column(db.Integer, db.ForeignKey('spas.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), 
        default=lambda: datetime.now(UTC_PLUS_4)
    )
    
    images = db.relationship('ReviewImage', backref='review', cascade='all, delete-orphan')
    # Check ratings
    __table_args__ = (
        db.CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_bounds'),
    )

class ReviewImage(db.Model):
    """Images associated with reviews"""
    __tablename__ = 'review_images'
    
    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey('reviews.id'), nullable=False)
    filepath = db.Column(db.String(255), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    caption = db.Column(db.String(200))
    uploaded_at = db.Column(
        db.DateTime(timezone=True), 
        default=lambda: datetime.now(UTC_PLUS_4)
    )
    
    @classmethod
    def create_from_upload(cls, file, review_id, upload_folder):
        """Create a new ReviewImage from an uploaded file"""
        if file and allowed_file(file.filename):
            # Generate a unique filename
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            
            # Create upload path
            upload_path = os.path.join(upload_folder, unique_filename)
            
            # Ensure upload directory exists
            os.makedirs(upload_folder, exist_ok=True)
            file.save(upload_path)
            
            # Create the image record
            return cls(
                review_id=review_id,
                filepath=f"uploads/{unique_filename}",
                filename=unique_filename
            )
        return None

class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    spa_id = db.Column(db.Integer, db.ForeignKey('spas.id'), nullable=False)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(120), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False)
    customer_notes = db.Column(db.Text)
    start_time = db.Column(db.DateTime, nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # in minutes
    total_price = db.Column(db.Float, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), 
        default=lambda: datetime.now(UTC_PLUS_4)
    )
    
    # Relationships
    spa = db.relationship('Spa', backref='appointments')
    services = db.relationship('AppointmentService', backref='appointment', cascade='all, delete-orphan')

class AppointmentService(db.Model):
    __tablename__ = 'appointment_services'
    
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, 
        db.ForeignKey('appointments.id', ondelete='CASCADE'),
        nullable=False
    )
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'))
    service_name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    
    service = db.relationship('Service', cascade='save-update, merge')
